import BringApi from 'bring-shopping';
import { shoppingItemIcon } from '../shared/shoppingItemIcons.js';

const CATALOG_TTL_MS = 12 * 60 * 60 * 1000;
const CATALOG_TIMEOUT_MS = 8_000;
const SUPPORTED_CATALOG_LOCALES = ['de-DE', 'en-GB'];
const DEFAULT_CATALOG_LOCALE = 'de-DE';

const SECTION_ICONS = [
  [/obst|gemüse|früchte|fruit|vegetable/i, '🥦'],
  [/brot|gebäck|bread|bakery|pastr/i, '🥨'],
  [/milch|käse|dairy|milk|cheese|egg/i, '🥛'],
  [/fleisch|fisch|meat|fish|seafood/i, '🐟'],
  [/zutaten|gewürze|ingredient|spice|condiment/i, '🫙'],
  [/fertig|tiefkühl|frozen|convenience|ready/i, '❄️'],
  [/getreide|grain|cereal|pasta/i, '🌾'],
  [/snacks|süss|süß|sweet|candy/i, '🍫'],
  [/getränke|tabak|beverage|drink|tobacco/i, '🧃'],
  [/haushalt|household|cleaning/i, '🧽'],
  [/pflege|gesundheit|care|health|hygiene/i, '🧴'],
  [/tierbedarf|pet/i, '🐾'],
  [/baumarkt|garten|diy|garden|hardware/i, '🌿']
];

const FALLBACK_SECTIONS_DE = [
  {
    name: 'Obst & Gemüse',
    icon: '🥦',
    items: [
      'Äpfel', 'Bananen', 'Birnen', 'Erdbeeren', 'Weintrauben', 'Zitronen',
      'Orangen', 'Avocado', 'Tomaten', 'Gurken', 'Paprika', 'Kartoffeln',
      'Zwiebeln', 'Knoblauch', 'Karotten', 'Brokkoli', 'Blumenkohl',
      'Champignons', 'Salat', 'Spinat', 'Lauch', 'Schnittlauch'
    ]
  },
  {
    name: 'Brot & Gebäck',
    icon: '🥨',
    items: [
      'Brot', 'Brötchen', 'Toastbrot', 'Baguette', 'Knäckebrot',
      'Croissants', 'Wraps'
    ]
  },
  {
    name: 'Milch & Käse',
    icon: '🥛',
    items: [
      'Milch', 'Hafermilch', 'Butter', 'Margarine', 'Eier', 'Joghurt',
      'Quark', 'Sahne', 'Crème fraîche', 'Käse', 'Frischkäse', 'Mozzarella',
      'Feta'
    ]
  },
  {
    name: 'Fleisch & Fisch',
    icon: '🐟',
    items: [
      'Hackfleisch', 'Hähnchen', 'Würstchen', 'Aufschnitt', 'Schinken',
      'Lachs', 'Thunfisch'
    ]
  },
  {
    name: 'Zutaten & Gewürze',
    icon: '🫙',
    items: [
      'Mehl', 'Zucker', 'Salz', 'Pfeffer', 'Öl', 'Essig', 'Ketchup',
      'Mayonnaise', 'Senf', 'Tomatenmark', 'Dosentomaten', 'Brühe',
      'Backpulver'
    ]
  },
  {
    name: 'Fertig- & Tiefkühlprodukte',
    icon: '❄️',
    items: [
      'Tiefkühlpizza', 'Pommes', 'Tiefkühlgemüse', 'Fischstäbchen',
      'Eis', 'Fertiggericht'
    ]
  },
  {
    name: 'Getreideprodukte',
    icon: '🌾',
    items: [
      'Nudeln', 'Reis', 'Haferflocken', 'Müsli', 'Cornflakes', 'Couscous',
      'Linsen'
    ]
  },
  {
    name: 'Snacks & Süsswaren',
    icon: '🍫',
    items: [
      'Nougatcreme', 'Schokolade', 'Kekse', 'Chips', 'Nüsse', 'Gummibärchen',
      'Müsliriegel'
    ]
  },
  {
    name: 'Getränke',
    icon: '🧃',
    items: [
      'Mineralwasser', 'Saft', 'Kaffee', 'Tee', 'Kakao', 'Limonade',
      'Bier', 'Wein'
    ]
  },
  {
    name: 'Haushalt',
    icon: '🧽',
    items: [
      'Spülmittel', 'Spülmaschinentabs', 'Waschmittel', 'Küchenrolle',
      'Toilettenpapier', 'Müllbeutel', 'Alufolie', 'Backpapier',
      'Allzweckreiniger', 'Schwämme'
    ]
  },
  {
    name: 'Pflege & Gesundheit',
    icon: '🧴',
    items: [
      'Zahnpasta', 'Zahnbürsten', 'Duschgel', 'Shampoo', 'Seife',
      'Deo', 'Taschentücher', 'Pflaster'
    ]
  },
  {
    name: 'Tierbedarf',
    icon: '🐾',
    items: ['Hundefutter', 'Katzenfutter', 'Katzenstreu', 'Leckerlis']
  }
];

const FALLBACK_SECTIONS_EN = [
  {
    name: 'Fruits & Vegetables',
    icon: '🥦',
    items: [
      'Apples', 'Bananas', 'Pears', 'Strawberries', 'Grapes', 'Lemons',
      'Oranges', 'Avocado', 'Tomatoes', 'Cucumbers', 'Peppers', 'Potatoes',
      'Onions', 'Garlic', 'Carrots', 'Broccoli', 'Cauliflower',
      'Mushrooms', 'Lettuce', 'Spinach', 'Leek', 'Chives'
    ]
  },
  {
    name: 'Bread & Pastries',
    icon: '🥨',
    items: [
      'Bread', 'Bread rolls', 'Toast', 'Baguette', 'Crispbread',
      'Croissants', 'Wraps'
    ]
  },
  {
    name: 'Milk & Cheese',
    icon: '🥛',
    items: [
      'Milk', 'Oat milk', 'Butter', 'Margarine', 'Eggs', 'Yoghurt',
      'Quark', 'Cream', 'Crème fraîche', 'Cheese', 'Cream cheese',
      'Mozzarella', 'Feta'
    ]
  },
  {
    name: 'Meat & Fish',
    icon: '🐟',
    items: [
      'Minced meat', 'Chicken', 'Sausages', 'Cold cuts', 'Ham',
      'Salmon', 'Tuna'
    ]
  },
  {
    name: 'Ingredients & Spices',
    icon: '🫙',
    items: [
      'Flour', 'Sugar', 'Salt', 'Pepper', 'Oil', 'Vinegar', 'Ketchup',
      'Mayonnaise', 'Mustard', 'Tomato paste', 'Tinned tomatoes', 'Stock',
      'Baking powder'
    ]
  },
  {
    name: 'Frozen & Convenience',
    icon: '❄️',
    items: [
      'Frozen pizza', 'Chips', 'Frozen vegetables', 'Fish fingers',
      'Ice cream', 'Ready meal'
    ]
  },
  {
    name: 'Grain Products',
    icon: '🌾',
    items: [
      'Pasta', 'Rice', 'Oats', 'Muesli', 'Cornflakes', 'Couscous',
      'Lentils'
    ]
  },
  {
    name: 'Snacks & Sweets',
    icon: '🍫',
    items: [
      'Chocolate spread', 'Chocolate', 'Biscuits', 'Crisps', 'Nuts',
      'Gummy bears', 'Cereal bars'
    ]
  },
  {
    name: 'Beverages',
    icon: '🧃',
    items: [
      'Sparkling water', 'Juice', 'Coffee', 'Tea', 'Cocoa', 'Lemonade',
      'Beer', 'Wine'
    ]
  },
  {
    name: 'Household',
    icon: '🧽',
    items: [
      'Washing-up liquid', 'Dishwasher tabs', 'Laundry detergent',
      'Kitchen roll', 'Toilet paper', 'Bin bags', 'Aluminium foil',
      'Baking paper', 'All-purpose cleaner', 'Sponges'
    ]
  },
  {
    name: 'Care & Health',
    icon: '🧴',
    items: [
      'Toothpaste', 'Toothbrushes', 'Shower gel', 'Shampoo', 'Soap',
      'Deodorant', 'Tissues', 'Plasters'
    ]
  },
  {
    name: 'Pet Supplies',
    icon: '🐾',
    items: ['Dog food', 'Cat food', 'Cat litter', 'Treats']
  }
];

const cachedCatalogs = new Map();
const pendingCatalogs = new Map();

function normalizeCatalogLocale(locale) {
  const cleaned = String(locale || '').trim();
  if (SUPPORTED_CATALOG_LOCALES.includes(cleaned)) return cleaned;
  return cleaned.toLowerCase().startsWith('en')
    ? 'en-GB'
    : DEFAULT_CATALOG_LOCALE;
}

function cleanLabel(value, fallback = '') {
  return String(value || fallback).trim().slice(0, 120);
}

function sectionIcon(name) {
  return (
    SECTION_ICONS.find(([pattern]) => pattern.test(name))?.[1] ||
    '🛒'
  );
}

function makeSectionId(name, index) {
  const slug = name
    .toLocaleLowerCase('de-DE')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `bereich-${index + 1}`;
}

export function normalizeBringCatalog(
  payload,
  source = 'bring',
  locale = DEFAULT_CATALOG_LOCALE
) {
  const catalogLocale = normalizeCatalogLocale(payload?.language || locale);
  const sectionFallbackLabel = catalogLocale.startsWith('en')
    ? 'Section'
    : 'Bereich';
  const sourceSections = Array.isArray(payload?.catalog?.sections)
    ? payload.catalog.sections
    : [];
  const seen = new Set();
  const sections = sourceSections
    .map((section, sectionIndex) => {
      const name = cleanLabel(
        section?.name || section?.sectionId,
        `${sectionFallbackLabel} ${sectionIndex + 1}`
      );
      const icon = sectionIcon(name);
      const items = (Array.isArray(section?.items) ? section.items : [])
        .map((item, itemIndex) => {
          const itemName = cleanLabel(item?.name || item?.itemId);
          const normalizedName = itemName.toLocaleLowerCase('de-DE');
          if (!itemName || seen.has(normalizedName)) return null;
          seen.add(normalizedName);
          return {
            id: cleanLabel(item?.itemId, `${sectionIndex}-${itemIndex}`),
            name: itemName,
            category: name,
            icon: shoppingItemIcon(itemName, icon)
          };
        })
        .filter(Boolean);
      return {
        id: makeSectionId(name, sectionIndex),
        name,
        icon,
        items
      };
    })
    .filter(section => section.items.length > 0);

  return {
    locale: cleanLabel(payload?.language, locale),
    source,
    sections,
    total: sections.reduce((sum, section) => sum + section.items.length, 0),
    updatedAt: Date.now()
  };
}

function fallbackCatalog(locale = DEFAULT_CATALOG_LOCALE) {
  const catalogLocale = normalizeCatalogLocale(locale);
  const fallbackSections = catalogLocale === 'en-GB'
    ? FALLBACK_SECTIONS_EN
    : FALLBACK_SECTIONS_DE;
  return normalizeBringCatalog(
    {
      language: catalogLocale,
      catalog: {
        sections: fallbackSections.map(section => ({
          sectionId: section.name,
          name: section.name,
          items: section.items.map(name => ({ itemId: name, name }))
        }))
      }
    },
    'fallback',
    catalogLocale
  );
}

async function fetchLiveCatalog(locale) {
  const client = new BringApi({ mail: '', password: '' });
  let timer;
  try {
    return await Promise.race([
      client.loadCatalog(locale),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Bring!-Katalog Zeitüberschreitung')),
          CATALOG_TIMEOUT_MS
        );
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBringCatalog(locale = DEFAULT_CATALOG_LOCALE) {
  const catalogLocale = normalizeCatalogLocale(locale);
  const cached = cachedCatalogs.get(catalogLocale);
  if (cached && Date.now() - cached.updatedAt < CATALOG_TTL_MS) {
    return cached;
  }
  if (pendingCatalogs.has(catalogLocale)) {
    return pendingCatalogs.get(catalogLocale);
  }

  const pending = (async () => {
    try {
      const liveCatalog = normalizeBringCatalog(
        await fetchLiveCatalog(catalogLocale),
        'bring',
        catalogLocale
      );
      if (liveCatalog.total === 0) {
        throw new Error('Bring!-Katalog ist leer');
      }
      cachedCatalogs.set(catalogLocale, liveCatalog);
    } catch (error) {
      if (!cachedCatalogs.has(catalogLocale)) {
        cachedCatalogs.set(catalogLocale, fallbackCatalog(catalogLocale));
      }
      console.warn(`Bring!-Katalog nicht erreichbar: ${error.message}`);
    } finally {
      pendingCatalogs.delete(catalogLocale);
    }
    return cachedCatalogs.get(catalogLocale);
  })();
  pendingCatalogs.set(catalogLocale, pending);
  return pending;
}
