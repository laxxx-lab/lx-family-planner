import { isIP } from 'node:net';
import * as cheerio from 'cheerio';
import { parseInstructionSteps } from '../shared/recipeInstructions.js';
import {
  closePinnedResponse,
  fetchPinned
} from './pinnedFetch.js';

const RECIPE_FETCH_TIMEOUT_MS = 12_000;
const RECIPE_MAX_BYTES = 3 * 1024 * 1024;
const RECIPE_IMAGE_MAX_BYTES = 3 * 1024 * 1024;
const RECIPE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);
const PINTEREST_HOST_PATTERN = /(^|\.)pinterest\.[a-z.]+$/i;
const PINTEREST_SHORT_HOSTS = new Set(['pin.it', 'www.pin.it']);
const FACEBOOK_HOST_PATTERN = /(^|\.)facebook\.com$/i;
const FACEBOOK_SHORT_HOSTS = new Set(['fb.watch', 'www.fb.watch']);
const SOCIAL_CAPTION_MAX_LENGTH = 12_000;

function recipeError(message, statusCode = 422) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanText(value, fallback = '', maxLength = 4000) {
  return String(value ?? fallback)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isPinterestHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return PINTEREST_SHORT_HOSTS.has(host) || PINTEREST_HOST_PATTERN.test(host);
}

function isFacebookHost(hostname) {
  const host = String(hostname || '').toLowerCase();
  return FACEBOOK_SHORT_HOSTS.has(host) || FACEBOOK_HOST_PATTERN.test(host);
}

function normalizeSocialCaption(value) {
  const raw = String(value || '');
  const text = /<[a-z][\s\S]*>/i.test(raw)
    ? cheerio.load(
        raw
          .replace(/<br\s*\/?\s*>/gi, '\n')
          .replace(/<\/(?:p|div|li|h[1-6])\s*>/gi, '\n')
      ).text()
    : raw;
  return text
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, SOCIAL_CAPTION_MAX_LENGTH);
}

function urlsFromText(value) {
  return (String(value || '').match(/https?:\/\/[^\s<>"']+/gi) || [])
    .map(candidate => candidate.replace(/[\])},.;!?]+$/g, ''));
}

function withoutUrls(value) {
  return normalizeSocialCaption(value)
    .replace(/https?:\/\/[^\s<>"']+/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function socialList(value) {
  return normalizeSocialCaption(value)
    .split(/\s*(?:\n+|[•●▪▫◦]|\s+\+\s+|\s+\|\s+|;\s+)\s*/u)
    .map(entry => entry
      .replace(/^\s*(?:[-–—*✓✅]+|\d{1,2}[.)])\s*/u, '')
      .trim())
    .filter(entry => entry.length > 1);
}

const INGREDIENT_HEADING =
  /(?:(?:^|\n|[.!?]\s+)[ \t]*(?:🛒\s*)?(?:zutaten|ingredients|du brauchst|einkaufsliste)\s*:?\s*|\s+(?:🛒\s*)?(?:zutaten|ingredients|du brauchst|einkaufsliste)\s*:\s*)/i;
const INSTRUCTION_HEADING =
  /(?:(?:^|\n|[.!?]\s+)[ \t]*(?:👩‍🍳\s*|👨‍🍳\s*)?(?:zubereitung|anleitung|so geht(?:'|’)?s|instructions?|method|preparation)\s*:?\s*|\s+(?:👩‍🍳\s*|👨‍🍳\s*)?(?:zubereitung|anleitung|so geht(?:'|’)?s|instructions?|method|preparation)\s*:\s*)/i;

function socialCaptionSections(value) {
  const caption = withoutUrls(value);
  const ingredientHeading = INGREDIENT_HEADING.exec(caption);
  if (!ingredientHeading) {
    return { caption, ingredients: [], instructions: [] };
  }
  const afterHeading = caption.slice(
    ingredientHeading.index + ingredientHeading[0].length
  );
  const instructionHeading = INSTRUCTION_HEADING.exec(afterHeading);
  const ingredientText = instructionHeading
    ? afterHeading.slice(0, instructionHeading.index)
    : afterHeading;
  const instructionText = instructionHeading
    ? afterHeading.slice(
        instructionHeading.index + instructionHeading[0].length
      )
    : '';
  const instructionInput = instructionText.replace(
    /(?<=[.!?])\s+(?=[A-ZÄÖÜ])/gu,
    '\n'
  );
  return {
    caption,
    ingredients: socialList(ingredientText).slice(0, 120),
    instructions: instructionInput
      ? parseInstructionSteps(instructionInput).slice(0, 80)
      : []
  };
}

function socialRecipeTitle(value, caption) {
  const cleaned = cleanText(value, '', 240)
    .replace(/\s*[|·-]\s*Facebook\s*$/i, '')
    .replace(/\s+on Facebook\s*$/i, '')
    .trim();
  if (cleaned && !/^facebook$/i.test(cleaned)) return cleaned;
  const firstLine = withoutUrls(caption)
    .split('\n')
    .map(line => cleanText(line, '', 160))
    .find(line =>
      line &&
      !INGREDIENT_HEADING.test(line) &&
      !INSTRUCTION_HEADING.test(line)
    );
  return firstLine || 'Rezept aus Facebook';
}

function sharedRecipeTitle(value, caption) {
  const cleaned = cleanText(value, '', 240)
    .replace(/\s*[|·-]\s*(?:My Recipe Box|RecetteTek)\s*$/i, '')
    .trim();
  if (
    cleaned &&
    !/^(?:rezept|recipe|rezept teilen|share recipe|my recipe box)$/i.test(cleaned)
  ) {
    return cleaned;
  }
  const firstLine = withoutUrls(caption)
    .split('\n')
    .map(line => cleanText(line, '', 160))
    .find(line =>
      line &&
      !INGREDIENT_HEADING.test(line) &&
      !INSTRUCTION_HEADING.test(line)
    );
  return firstLine || 'Geteiltes Rezept';
}

function socialTime(value) {
  const match = /\b(\d{1,3})\s*(min(?:ute[n]?)?|mins?)\b/i.exec(value);
  return match ? `${Number(match[1])} Min.` : '';
}

function socialServings(value) {
  const match = /\b(\d{1,2})\s*(portion(?:en)?|servings?)\b/i.exec(value);
  return match ? `${Number(match[1])} ${match[2]}` : '';
}

export function extractFacebookRecipeDraft(
  caption,
  { title = '', image = '', sourceUrl = '' } = {}
) {
  const sections = socialCaptionSections(caption);
  if (!sections.ingredients.length && !sections.instructions.length) {
    return null;
  }
  const warnings = [
    'Aus einem Facebook-Beitrag übernommen. Bitte Zutaten und Zubereitung vor dem Speichern prüfen.'
  ];
  if (!sections.ingredients.length) {
    warnings.push('In der Beschreibung wurde keine eindeutige Zutatenliste erkannt.');
  }
  if (!sections.instructions.length) {
    warnings.push('Die Zubereitung steht offenbar nur im Reel und muss ergänzt werden.');
  }
  return {
    recipe: {
      title: socialRecipeTitle(title, sections.caption),
      image: cleanText(image, '', 2000),
      ingredients: sections.ingredients,
      instructions: sections.instructions,
      prepTime: socialTime(sections.caption),
      cookTime: '',
      totalTime: '',
      servings: socialServings(sections.caption),
      sourceUrl: cleanText(sourceUrl, '', 2000),
      source: 'facebook-reel'
    },
    warnings,
    reviewRequired: true,
    platform: 'facebook'
  };
}

export function extractSharedRecipeDraft(
  caption,
  { title = '', sourceUrl = '' } = {}
) {
  const sections = socialCaptionSections(caption);
  if (!sections.ingredients.length && !sections.instructions.length) {
    return null;
  }
  const warnings = [
    'Aus einer anderen Rezept-App übernommen. Bitte Zutaten und Zubereitung vor dem Speichern kurz prüfen.'
  ];
  if (!sections.ingredients.length) {
    warnings.push('Im geteilten Text wurde keine eindeutige Zutatenliste erkannt.');
  }
  if (!sections.instructions.length) {
    warnings.push('Im geteilten Text wurde keine eindeutige Zubereitung erkannt.');
  }
  return {
    recipe: {
      title: sharedRecipeTitle(title, sections.caption),
      image: '',
      ingredients: sections.ingredients,
      instructions: sections.instructions,
      prepTime: socialTime(sections.caption),
      cookTime: '',
      totalTime: '',
      servings: socialServings(sections.caption),
      sourceUrl: cleanText(sourceUrl, '', 2000),
      source: 'shared-recipe'
    },
    warnings,
    reviewRequired: true,
    platform: 'shared-recipe'
  };
}

function ipv4Parts(address) {
  if (isIP(address) !== 4) return null;
  return address.split('.').map(Number);
}

function blockedPublicAddress(address) {
  const normalized = String(address || '').toLowerCase();
  const mappedIpv4 = normalized.startsWith('::ffff:')
    ? normalized.slice(7)
    : normalized;
  const parts = ipv4Parts(mappedIpv4);
  if (parts) {
    const [first, second] = parts;
    if (
      process.env.NODE_ENV === 'test' &&
      process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS === 'true' &&
      first === 127
    ) {
      return false;
    }
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }
  if (isIP(normalized) !== 6) return false;
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('ff')
  );
}

export function normalizeRecipeImportUrl(value) {
  let url;
  try {
    url = new URL(cleanText(value, '', 4000));
  } catch {
    throw recipeError('Bitte gib einen vollständigen Rezept-Link ein.', 400);
  }
  const allowTestHttp =
    process.env.NODE_ENV === 'test' &&
    process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS === 'true' &&
    url.protocol === 'http:';
  if (url.protocol !== 'https:' && !allowTestHttp) {
    throw recipeError('Rezept-Links müssen mit https:// beginnen.', 400);
  }
  if (url.username || url.password) {
    throw recipeError(
      'Zugangsdaten dürfen nicht direkt im Rezept-Link stehen.',
      400
    );
  }
  url.hash = '';
  return url;
}

async function fetchPublicTarget(url, options) {
  try {
    return await fetchPinned(url, options, { isBlocked: blockedPublicAddress });
  } catch (error) {
    if (error?.code === 'PINNED_TARGET_NOT_FOUND') {
      throw recipeError('Die Rezeptseite konnte nicht gefunden werden.', 400);
    }
    if (error?.code === 'PINNED_TARGET_BLOCKED') {
      throw recipeError(
        'Lokale und private Netzwerkadressen sind beim Rezeptimport nicht erlaubt.',
        400
      );
    }
    throw error;
  }
}

async function fetchRecipeResponse(url, options, unavailableMessage) {
  try {
    return await fetchPublicTarget(url, options);
  } catch (error) {
    if (error?.statusCode) throw error;
    throw recipeError(unavailableMessage, 502);
  }
}

async function readLimitedHtml(response) {
  const announcedLength = Number(response.headers.get('content-length') || 0);
  if (announcedLength > RECIPE_MAX_BYTES) {
    throw recipeError('Die Rezeptseite ist größer als 3 MB.', 413);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > RECIPE_MAX_BYTES) {
      await reader.cancel();
      throw recipeError('Die Rezeptseite ist größer als 3 MB.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readLimitedBytes(response, limit) {
  const announcedLength = Number(response.headers.get('content-length') || 0);
  if (announcedLength > limit) {
    throw recipeError('Das Rezeptbild ist größer als 3 MB.', 413);
  }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw recipeError('Das Rezeptbild ist größer als 3 MB.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

async function fetchRecipePage(rawUrl) {
  let url = normalizeRecipeImportUrl(rawUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const request = await fetchRecipeResponse(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(RECIPE_FETCH_TIMEOUT_MS),
      headers: {
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.2',
        'accept-language': 'de-DE,de;q=0.9,en;q=0.6',
        'user-agent':
          'Mozilla/5.0 (compatible; LX-Family-Planner/2.0; +private-recipe-import)'
      }
    }, 'Die Rezeptseite antwortet gerade nicht.');
    try {
      const response = request.response;
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirect === 3) {
          throw recipeError('Der Rezept-Link leitet zu oft weiter.', 502);
        }
        url = normalizeRecipeImportUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) {
        throw recipeError(
          response.status === 401 || response.status === 403
            ? 'Die Rezeptseite blockiert den automatischen Import.'
            : `Die Rezeptseite meldet Fehler ${response.status}.`,
          502
        );
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType && !/html|xhtml/i.test(contentType)) {
        throw recipeError('Unter diesem Link wurde keine Rezeptseite gefunden.');
      }
      return {
        html: await readLimitedHtml(response),
        url
      };
    } finally {
      await closePinnedResponse(request);
    }
  }
  throw recipeError('Die Rezeptseite konnte nicht geladen werden.', 502);
}

async function fetchRecipeImage(rawUrl) {
  let url = normalizeRecipeImportUrl(rawUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const request = await fetchRecipeResponse(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(RECIPE_FETCH_TIMEOUT_MS),
      headers: {
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif;q=0.9',
        'user-agent':
          'Mozilla/5.0 (compatible; LX-Family-Planner/2.0; +private-recipe-import)'
      }
    }, 'Das Rezeptbild antwortet gerade nicht.');
    try {
      const response = request.response;
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirect === 3) {
          throw recipeError('Das Rezeptbild leitet zu oft weiter.', 502);
        }
        url = normalizeRecipeImportUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) {
        throw recipeError(`Das Rezeptbild meldet Fehler ${response.status}.`, 502);
      }
      const contentType = String(response.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!RECIPE_IMAGE_TYPES.has(contentType)) {
        throw recipeError('Die Vorschau ist keine unterstützte Bilddatei.', 422);
      }
      const bytes = await readLimitedBytes(response, RECIPE_IMAGE_MAX_BYTES);
      if (!bytes.length) return '';
      return `data:${contentType};base64,${bytes.toString('base64')}`;
    } finally {
      await closePinnedResponse(request);
    }
  }
  return '';
}

export async function importRecipePreviewImage(rawUrl) {
  const page = await fetchRecipePage(rawUrl);
  const $ = cheerio.load(page.html);
  const candidate = [
    $('meta[property="og:image:secure_url"]').attr('content'),
    $('meta[property="og:image"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[name="twitter:image:src"]').attr('content')
  ].find(Boolean);
  const imageUrl = resolveExternalUrl(candidate, page.url.href);
  if (!imageUrl) return { image: '' };
  return { image: await fetchRecipeImage(imageUrl) };
}

function schemaTypes(value) {
  return (Array.isArray(value) ? value : [value])
    .map(entry => String(entry || '').split('/').at(-1))
    .filter(Boolean);
}

function recipeCandidates(value, seen = new WeakSet(), depth = 0) {
  if (depth > 8 || value == null) return [];
  if (Array.isArray(value)) {
    return value.flatMap(entry => recipeCandidates(entry, seen, depth + 1));
  }
  if (typeof value !== 'object' || seen.has(value)) return [];
  seen.add(value);
  const candidates = schemaTypes(value['@type']).includes('Recipe')
    ? [value]
    : [];
  for (const [key, nested] of Object.entries(value)) {
    if (key === '@context' || key === 'image') continue;
    candidates.push(...recipeCandidates(nested, seen, depth + 1));
  }
  return candidates;
}

function structuredText(value, maxLength = 240) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') {
    return cleanText(value, '', maxLength);
  }
  if (Array.isArray(value)) {
    return value.map(entry => structuredText(entry, maxLength)).find(Boolean) || '';
  }
  if (typeof value !== 'object') return '';
  if (value['@value']) return cleanText(value['@value'], '', maxLength);
  const amount = cleanText(value.value, '', 60);
  const unit = cleanText(value.unitText || value.unitCode, '', 40);
  const name = cleanText(value.name || value.description, '', maxLength);
  return cleanText([amount, unit, name].filter(Boolean).join(' '), '', maxLength);
}

function ingredientList(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap(entry => {
      if (entry?.itemListElement) return ingredientList(entry.itemListElement);
      return structuredText(entry, 280);
    })
    .filter(Boolean);
}

function imageCandidates(value) {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(imageCandidates);
  if (typeof value !== 'object') return [];
  return [
    value.url,
    value.contentUrl,
    value.thumbnailUrl,
    value.image,
    value.primaryImageOfPage
  ].flatMap(imageCandidates);
}

function resolveExternalUrl(value, baseUrl) {
  const candidate = cleanText(value, '', 2000);
  if (!candidate) return '';
  try {
    const resolved = new URL(candidate, baseUrl);
    if (!['http:', 'https:'].includes(resolved.protocol)) return '';
    const keepTestLoopbackHttp = process.env.NODE_ENV === 'test'
      && process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS === 'true'
      && resolved.protocol === 'http:'
      && ['127.0.0.1', '::1', 'localhost'].includes(resolved.hostname);
    if (resolved.protocol === 'http:' && !keepTestLoopbackHttp) {
      resolved.protocol = 'https:';
    }
    return resolved.href;
  } catch {
    return '';
  }
}

function firstText(value, fallback = '', maxLength = 160) {
  if (Array.isArray(value)) {
    return value
      .map(entry => structuredText(entry, maxLength))
      .find(Boolean) || fallback;
  }
  return structuredText(value, maxLength) || fallback;
}

function formatDuration(value) {
  const duration = firstText(value, '', 50);
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(duration);
  if (!match) return duration;
  const parts = [];
  if (match[1]) parts.push(`${Number(match[1])} Tag${match[1] === '1' ? '' : 'e'}`);
  if (match[2]) parts.push(`${Number(match[2])} Std.`);
  if (match[3]) parts.push(`${Number(match[3])} Min.`);
  if (!parts.length && match[4]) parts.push(`${Number(match[4])} Sek.`);
  return parts.join(' ');
}

function elementValue($, element) {
  const node = $(element);
  return cleanText(
    node.attr('content') ||
      node.attr('datetime') ||
      node.attr('value') ||
      node.attr('src') ||
      node.attr('href') ||
      node.text(),
    '',
    4000
  );
}

function elementValues($, root, selector) {
  return root
    .find(selector)
    .toArray()
    .map(element => elementValue($, element))
    .filter(Boolean);
}

function instructionValues($, root, selector) {
  return root
    .find(selector)
    .toArray()
    .flatMap(element => {
      const node = $(element);
      const listItems = node.find('li').toArray();
      return listItems.length
        ? listItems.map(item => elementValue($, item))
        : elementValue($, element);
    })
    .filter(Boolean);
}

function extractJsonLdRecipe($) {
  let recipe = null;
  $('script[type="application/ld+json"]').each((_index, element) => {
    if (recipe) return;
    try {
      const parsed = JSON.parse($(element).text());
      recipe = recipeCandidates(parsed)[0] || null;
    } catch {
      // A later JSON-LD block may still contain valid recipe metadata.
    }
  });
  return recipe;
}

function extractMicrodataRecipe($) {
  const root = $('[itemtype*="schema.org/Recipe"]').first();
  if (!root.length) return null;
  return {
    name: elementValues($, root, '[itemprop="name"]').at(0),
    image: elementValues($, root, '[itemprop="image"]'),
    recipeIngredient: elementValues(
      $,
      root,
      '[itemprop="recipeIngredient"], [itemprop="ingredients"]'
    ),
    recipeInstructions: instructionValues(
      $,
      root,
      '[itemprop="recipeInstructions"]'
    ),
    prepTime: elementValues($, root, '[itemprop="prepTime"]').at(0),
    cookTime: elementValues($, root, '[itemprop="cookTime"]').at(0),
    totalTime: elementValues($, root, '[itemprop="totalTime"]').at(0),
    recipeYield: elementValues($, root, '[itemprop="recipeYield"]').at(0)
  };
}

function extractHRecipe($) {
  const root = $('.h-recipe').first();
  if (!root.length) return null;
  return {
    name: elementValues($, root, '.p-name').at(0),
    image: elementValues($, root, '.u-photo'),
    recipeIngredient: elementValues($, root, '.p-ingredient'),
    recipeInstructions: instructionValues($, root, '.e-instructions'),
    totalTime: elementValues($, root, '.dt-duration').at(0),
    recipeYield: elementValues($, root, '.p-yield').at(0)
  };
}

function splitPinterestList(value) {
  return String(value || '')
    .split(/\s*(?:\n+|[•●▪]|\/{2,}|={2,}|\s+\+\s+)\s*/u)
    .map(entry => cleanText(entry, '', 280))
    .filter(entry => entry.length > 2);
}

function extractPinterestDescriptionRecipe($) {
  const description = cleanText(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content'),
    '',
    6000
  );
  const ingredientsMatch = /\b(?:zutaten|ingredients)\s*:\s*/i.exec(description);
  if (!ingredientsMatch) return null;
  const afterHeading = description.slice(
    ingredientsMatch.index + ingredientsMatch[0].length
  );
  const instructionsMatch =
    /\b(?:zubereitung|anleitung|instructions?|methode)\s*:\s*/i.exec(afterHeading);
  const ingredientsText = instructionsMatch
    ? afterHeading.slice(0, instructionsMatch.index)
    : afterHeading;
  const instructionsText = instructionsMatch
    ? afterHeading.slice(instructionsMatch.index + instructionsMatch[0].length)
    : '';
  const ingredients = splitPinterestList(ingredientsText);
  if (!ingredients.length) return null;
  const rawTitle =
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    'Pinterest-Rezept';
  return {
    name: cleanText(rawTitle.split('|')[0], 'Pinterest-Rezept', 160),
    image:
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content'),
    recipeIngredient: ingredients,
    recipeInstructions: instructionsText
      ? splitPinterestList(instructionsText)
      : [description],
    importWarning: instructionsText
      ? ''
      : 'Pinterest hat nur Zutaten und Beschreibung geliefert. Bitte prüfe die Zubereitung.'
  };
}

function pinterestSourceUrl($, pageUrl) {
  const candidates = [
    $('meta[property="pinterestapp:source"]').attr('content'),
    $('meta[name="pinterestapp:source"]').attr('content'),
    $('meta[property="og:see_also"]').attr('content')
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const source = new URL(candidate, pageUrl);
      if (isPinterestHost(source.hostname)) continue;
      if (source.protocol === 'http:') source.protocol = 'https:';
      return source.href;
    } catch {
      // Ignore malformed source candidates.
    }
  }
  return '';
}

function facebookExternalUrl(value, pageUrl) {
  if (!value) return '';
  try {
    let candidate = new URL(value, pageUrl);
    if (
      isFacebookHost(candidate.hostname) &&
      /\/l\.php$/i.test(candidate.pathname)
    ) {
      const redirected = candidate.searchParams.get('u');
      if (!redirected) return '';
      candidate = new URL(redirected);
    }
    if (!['http:', 'https:'].includes(candidate.protocol)) return '';
    if (isFacebookHost(candidate.hostname)) return '';
    if (candidate.protocol === 'http:') candidate.protocol = 'https:';
    candidate.hash = '';
    return candidate.href;
  } catch {
    return '';
  }
}

function facebookSourceUrl($, pageUrl, caption = '') {
  const candidates = [
    $('meta[property="og:see_also"]').attr('content'),
    ...urlsFromText(caption),
    ...$('a[href*="/l.php?"]')
      .toArray()
      .map(element => $(element).attr('href'))
  ];
  for (const candidate of candidates) {
    const source = facebookExternalUrl(candidate, pageUrl);
    if (source) return source;
  }
  return '';
}

function facebookCaption($) {
  return normalizeSocialCaption(
    $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content')
  );
}

function facebookRecipeDraft($, pageUrl, shared = {}) {
  const pageCaption = facebookCaption($);
  const caption = normalizeSocialCaption(
    [shared.text, pageCaption].filter(Boolean).join('\n')
  );
  const title =
    shared.title ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    '';
  const image =
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    '';
  return {
    draft: extractFacebookRecipeDraft(caption, {
      title,
      image: resolveExternalUrl(image, pageUrl),
      sourceUrl: pageUrl
    }),
    sourceUrl: facebookSourceUrl($, pageUrl, caption)
  };
}

export function extractFacebookRecipePage(html, pageUrl, shared = {}) {
  return facebookRecipeDraft(
    cheerio.load(String(html || '')),
    pageUrl,
    shared
  );
}

function normalizedRecipe(recipe, pageUrl, fallbackImage = '') {
  const image = [
    ...imageCandidates(recipe.image),
    ...imageCandidates(recipe.thumbnailUrl),
    ...imageCandidates(recipe.primaryImageOfPage),
    fallbackImage
  ]
    .map(candidate => resolveExternalUrl(candidate, pageUrl))
    .find(Boolean) || '';
  const ingredients = ingredientList(
    recipe.recipeIngredient || recipe.ingredients || []
  );
  const instructions = parseInstructionSteps(recipe.recipeInstructions);
  return {
    title: firstText(recipe.name, 'Importiertes Rezept', 160),
    image: cleanText(image, '', 2000),
    ingredients,
    instructions,
    prepTime: formatDuration(recipe.prepTime),
    cookTime: formatDuration(recipe.cookTime),
    totalTime: formatDuration(recipe.totalTime),
    servings: firstText(recipe.recipeYield, '', 80),
    sourceUrl: pageUrl,
    source: 'recipe-import'
  };
}

export function extractRecipeDocument(html, pageUrl) {
  const $ = cheerio.load(String(html || ''));
  const recipe =
    extractJsonLdRecipe($) ||
    extractMicrodataRecipe($) ||
    extractHRecipe($) ||
    (isPinterestHost(new URL(pageUrl).hostname)
      ? extractPinterestDescriptionRecipe($)
      : null);
  const fallbackImage = [
    $('meta[property="og:image"]').attr('content'),
    $('meta[property="og:image:secure_url"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[name="twitter:image:src"]').attr('content'),
    $('link[rel="image_src"]').attr('href')
  ].find(Boolean) || '';
  return {
    recipe: recipe ? normalizedRecipe(recipe, pageUrl, fallbackImage) : null,
    sourceUrl: isPinterestHost(new URL(pageUrl).hostname)
      ? pinterestSourceUrl($, pageUrl)
      : '',
    warning: cleanText(recipe?.importWarning, '', 240)
  };
}

export async function importRecipeFromUrl(rawUrl, shared = {}) {
  const requestedUrl = normalizeRecipeImportUrl(rawUrl);
  const facebookImport = isFacebookHost(requestedUrl.hostname);
  const sharedRecipeDraft = !facebookImport
    ? extractSharedRecipeDraft(shared.text, {
        title: shared.title,
        sourceUrl: requestedUrl.href
      })
    : null;
  const sharedFacebookDraft = facebookImport
    ? extractFacebookRecipeDraft(shared.text, {
        title: shared.title,
        sourceUrl: requestedUrl.href
      })
    : null;
  if (facebookImport) {
    const sharedSourceUrl = urlsFromText(shared.text)
      .map(candidate => facebookExternalUrl(candidate, requestedUrl.href))
      .find(Boolean);
    if (sharedSourceUrl) {
      try {
        const sourcePage = await fetchRecipePage(sharedSourceUrl);
        const sourceResult = extractRecipeDocument(
          sourcePage.html,
          sourcePage.url.href
        );
        if (sourceResult.recipe) {
          return {
            recipe: {
              ...sourceResult.recipe,
              importedFromUrl: requestedUrl.href
            },
            warnings: sourceResult.warning ? [sourceResult.warning] : []
          };
        }
      } catch {
        // The caption itself can still provide a useful editable draft.
      }
    }
    if (sharedFacebookDraft) return sharedFacebookDraft;
  }
  let firstPage;
  try {
    firstPage = await fetchRecipePage(requestedUrl);
  } catch (error) {
    if (sharedFacebookDraft) {
      return {
        ...sharedFacebookDraft,
        warnings: [
          ...sharedFacebookDraft.warnings,
          'Facebook hat das Vorschaubild blockiert; der geteilte Beschreibungstext wurde trotzdem übernommen.'
        ]
      };
    }
    if (facebookImport) {
      throw recipeError(
        'Facebook hat nur den Reel-Link geliefert oder verlangt eine Anmeldung. Teile das Reel direkt über die Android-App; wenn Facebook die Beschreibung mitsendet, erstellt LX daraus einen prüfbaren Entwurf.',
        422
      );
    }
    if (sharedRecipeDraft) return sharedRecipeDraft;
    throw error;
  }
  const firstResult = extractRecipeDocument(firstPage.html, firstPage.url.href);
  if (firstResult.recipe) {
    return {
      recipe: firstResult.recipe,
      warnings: firstResult.warning ? [firstResult.warning] : []
    };
  }

  if (facebookImport || isFacebookHost(firstPage.url.hostname)) {
    const facebook = extractFacebookRecipePage(
      firstPage.html,
      firstPage.url.href,
      shared
    );
    if (facebook.sourceUrl) {
      try {
        const sourcePage = await fetchRecipePage(facebook.sourceUrl);
        const sourceResult = extractRecipeDocument(
          sourcePage.html,
          sourcePage.url.href
        );
        if (sourceResult.recipe) {
          return {
            recipe: {
              ...sourceResult.recipe,
              importedFromUrl: firstPage.url.href
            },
            warnings: sourceResult.warning ? [sourceResult.warning] : []
          };
        }
      } catch {
        // A usable caption draft is preferable to losing the whole import
        // because an optional linked recipe page is temporarily unavailable.
      }
    }
    if (facebook.draft) return facebook.draft;
    if (sharedFacebookDraft) return sharedFacebookDraft;
    throw recipeError(
      'Im öffentlichen Facebook-Reel wurden weder eine Zutatenliste noch eine verlinkte Rezeptseite gefunden. Video-Ton wird aus Datenschutz- und Stabilitätsgründen nicht ungefragt heruntergeladen.',
      422
    );
  }

  if (firstResult.sourceUrl) {
    const sourcePage = await fetchRecipePage(firstResult.sourceUrl);
    const sourceResult = extractRecipeDocument(
      sourcePage.html,
      sourcePage.url.href
    );
    if (sourceResult.recipe) {
      return {
        recipe: {
          ...sourceResult.recipe,
          importedFromUrl: firstPage.url.href
        },
        warnings: sourceResult.warning ? [sourceResult.warning] : []
      };
    }
  }

  if (sharedRecipeDraft) return sharedRecipeDraft;

  throw recipeError(
    isPinterestHost(firstPage.url.hostname)
      ? 'Dieser Pinterest-Pin enthält kein vollständig lesbares Rezept und verweist auf keine öffentliche Rezeptseite.'
      : 'Auf dieser Seite wurden keine lesbaren Rezeptdaten gefunden. Unterstützt werden Schema.org- und h-recipe-Seiten.',
    422
  );
}
