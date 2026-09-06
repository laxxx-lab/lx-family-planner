import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import {
  extractFacebookRecipeDraft,
  extractFacebookRecipePage,
  extractRecipeDocument,
  extractSharedRecipeDraft,
  importRecipePreviewImage,
  importRecipeFromUrl
} from './recipeImporter.js';

test('recipe importer reads nested Schema.org recipes with structured values', () => {
  const html = `
    <html>
      <head>
        <meta property="og:image" content="/fallback.jpg">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [{
              "@type": "WebPage",
              "mainEntity": {
                "@type": "Recipe",
                "name": "Familien-Pasta",
                "image": {"contentUrl": "/pasta.jpg"},
                "recipeIngredient": [
                  {"@type": "PropertyValue", "value": "500", "unitText": "g", "name": "Nudeln"},
                  "1 Dose Tomaten"
                ],
                "recipeInstructions": [
                  {"@type": "HowToStep", "text": "Nudeln nach Packungsangabe kochen."},
                  {"@type": "HowToStep", "text": "Mit der Sauce servieren."}
                ],
                "prepTime": "PT10M",
                "cookTime": "PT20M",
                "recipeYield": "4 Portionen"
              }
            }]
          }
        </script>
      </head>
    </html>
  `;
  const result = extractRecipeDocument(
    html,
    'https://recipes.example/familien-pasta'
  );

  assert.equal(result.recipe.title, 'Familien-Pasta');
  assert.equal(result.recipe.image, 'https://recipes.example/pasta.jpg');
  assert.deepEqual(result.recipe.ingredients, [
    '500 g Nudeln',
    '1 Dose Tomaten'
  ]);
  assert.equal(result.recipe.instructions.length, 2);
  assert.equal(result.recipe.prepTime, '10 Min.');
  assert.equal(result.recipe.cookTime, '20 Min.');
});

test('recipe importer supports h-recipe pages used by common portals', () => {
  const html = `
    <article class="h-recipe">
      <h1 class="p-name">Schnelle Waffeln</h1>
      <img class="u-photo" src="/waffeln.webp">
      <ul>
        <li class="p-ingredient">250 g Mehl</li>
        <li class="p-ingredient">2 Eier</li>
      </ul>
      <ol class="e-instructions">
        <li>Teig glatt rühren.</li>
        <li>Im Waffeleisen goldbraun backen.</li>
      </ol>
      <time class="dt-duration" datetime="PT25M">25 Minuten</time>
      <data class="p-yield" value="8">8 Waffeln</data>
    </article>
  `;
  const result = extractRecipeDocument(
    html,
    'https://food.example/waffeln'
  );

  assert.equal(result.recipe.title, 'Schnelle Waffeln');
  assert.deepEqual(result.recipe.ingredients, ['250 g Mehl', '2 Eier']);
  assert.equal(result.recipe.totalTime, '25 Min.');
  assert.equal(result.recipe.servings, '8');
});

test('Pinterest pins expose their original recipe source safely', () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Schnelle Kekse | Pinterest">
      <meta property="og:see_also" content="http://food.example/kekse">
      <meta property="pinterestapp:source" content="http://food.example/kekse">
    </head></html>
  `;
  const result = extractRecipeDocument(
    html,
    'https://www.pinterest.de/pin/123456789/'
  );

  assert.equal(result.recipe, null);
  assert.equal(result.sourceUrl, 'https://food.example/kekse');
});

test('self-contained Pinterest recipes retain ingredients with a warning', () => {
  const html = `
    <html><head>
      <meta property="og:title" content="Kartoffel-Taler | Rezept">
      <meta property="og:image" content="https://i.pinimg.com/taler.jpg">
      <meta property="og:description"
        content="ZUTATEN: 500 g Kartoffeln + 2 Eier + Salz ZUBEREITUNG: Alles mischen // Taler goldbraun braten">
    </head></html>
  `;
  const result = extractRecipeDocument(
    html,
    'https://www.pinterest.com/pin/987654321/'
  );

  assert.equal(result.recipe.title, 'Kartoffel-Taler');
  assert.deepEqual(result.recipe.ingredients, [
    '500 g Kartoffeln',
    '2 Eier',
    'Salz'
  ]);
  assert.deepEqual(result.recipe.instructions, [
    'Alles mischen Taler goldbraun braten'
  ]);
  assert.equal(result.warning, '');
});

test('Facebook Reel captions become reviewable recipe drafts', () => {
  const result = extractFacebookRecipeDraft(`
    Cremige Feierabend-Pasta
    Fertig in 25 Minuten · 2 Portionen
    Zutaten:
    250 g Nudeln
    2 Knoblauchzehen
    200 ml Sahne
    Zubereitung:
    1. Nudeln bissfest kochen.
    2. Knoblauch anbraten und mit Sahne ablöschen.
    3. Alles vermengen und servieren.
  `, {
    title: 'Cremige Feierabend-Pasta | Facebook',
    sourceUrl: 'https://www.facebook.com/reel/123456'
  });

  assert.equal(result.reviewRequired, true);
  assert.equal(result.platform, 'facebook');
  assert.equal(result.recipe.title, 'Cremige Feierabend-Pasta');
  assert.deepEqual(result.recipe.ingredients, [
    '250 g Nudeln',
    '2 Knoblauchzehen',
    '200 ml Sahne'
  ]);
  assert.equal(result.recipe.instructions.length, 3);
  assert.equal(result.recipe.prepTime, '25 Min.');
  assert.equal(result.recipe.servings, '2 Portionen');
});

test('incomplete Facebook captions stay editable and explain missing steps', () => {
  const result = extractFacebookRecipeDraft(
    'Zutaten: 2 Eier • 200 g Mehl • 250 ml Milch',
    { sourceUrl: 'https://fb.watch/example' }
  );

  assert.deepEqual(result.recipe.ingredients, [
    '2 Eier',
    '200 g Mehl',
    '250 ml Milch'
  ]);
  assert.deepEqual(result.recipe.instructions, []);
  assert.match(result.warnings.join(' '), /Zubereitung/);
});

test('recipes shared as formatted text from another app become review drafts', () => {
  const result = extractSharedRecipeDraft(`
    Schnelle Tomatensuppe
    25 Minuten · 4 Portionen
    Zutaten:
    • 800 g Tomaten
    • 1 Zwiebel
    Zubereitung:
    1. Zwiebel anbraten.
    2. Tomaten zugeben und köcheln lassen.
  `, { title: 'Schnelle Tomatensuppe | My Recipe Box' });

  assert.equal(result.reviewRequired, true);
  assert.equal(result.platform, 'shared-recipe');
  assert.equal(result.recipe.title, 'Schnelle Tomatensuppe');
  assert.deepEqual(result.recipe.ingredients, ['800 g Tomaten', '1 Zwiebel']);
  assert.deepEqual(result.recipe.instructions, [
    'Zwiebel anbraten.',
    'Tomaten zugeben und köcheln lassen.'
  ]);
  assert.equal(result.recipe.prepTime, '25 Min.');
  assert.equal(result.recipe.servings, '4 Portionen');
});

test('HTML recipe shares are converted to readable recipe text', () => {
  const result = extractSharedRecipeDraft(`
    <h1>Ofenkartoffeln</h1>
    <h2>Zutaten:</h2><p>1 kg Kartoffeln<br>2 EL Öl</p>
    <h2>Zubereitung:</h2><p>Kartoffeln schneiden.<br>Im Ofen backen.</p>
  `);
  assert.equal(result.recipe.title, 'Ofenkartoffeln');
  assert.deepEqual(result.recipe.ingredients, ['1 kg Kartoffeln', '2 EL Öl']);
  assert.deepEqual(result.recipe.instructions, [
    'Kartoffeln schneiden.',
    'Im Ofen backen.'
  ]);
});

test('Facebook pages expose only intentional outbound recipe links', () => {
  const target = encodeURIComponent('https://food.example/pasta?from=facebook');
  const result = extractFacebookRecipePage(`
    <html><head>
      <meta property="og:title" content="Pasta-Reel | Facebook">
      <meta property="og:description" content="Das Rezept findet ihr im Link">
    </head><body>
      <a href="https://help.example/privacy">Datenschutz</a>
      <a href="https://l.facebook.com/l.php?u=${target}&h=tracking">Rezept</a>
    </body></html>
  `, 'https://www.facebook.com/reel/123');

  assert.equal(
    result.sourceUrl,
    'https://food.example/pasta?from=facebook'
  );
  assert.equal(result.draft, null);
});

test('shared Facebook captions create drafts without downloading the Reel', async () => {
  const result = await importRecipeFromUrl(
    'https://www.facebook.com/reel/999999999',
    {
      title: 'Schnelle Pfannkuchen',
      text: 'Zutaten: 2 Eier • 200 g Mehl • 250 ml Milch Zubereitung: Alles verrühren. Portionsweise ausbacken.'
    }
  );

  assert.equal(result.reviewRequired, true);
  assert.equal(result.recipe.title, 'Schnelle Pfannkuchen');
  assert.equal(result.recipe.ingredients.length, 3);
  assert.equal(result.recipe.instructions.length, 2);
});

test('missing RTK images can be stored permanently from public page metadata', async () => {
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const server = createServer((request, response) => {
    if (request.url === '/cover.png') {
      response.writeHead(200, {
        'content-type': 'image/png',
        'content-length': String(png.length)
      });
      response.end(png);
      return;
    }
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<meta property="og:image" content="/cover.png">');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const previousNodeEnv = process.env.NODE_ENV;
  const previousLoopback = process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS;
  process.env.NODE_ENV = 'test';
  process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS = 'true';
  try {
    const result = await importRecipePreviewImage(
      `http://127.0.0.1:${port}/recipe`
    );
    assert.match(result.image, /^data:image\/png;base64,/);
    assert.equal(
      Buffer.from(result.image.split(',')[1], 'base64').compare(png),
      0
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousLoopback === undefined) {
      delete process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS;
    } else {
      process.env.RECIPE_ALLOW_LOOPBACK_FOR_TESTS = previousLoopback;
    }
    await new Promise(resolve => server.close(resolve));
  }
});
