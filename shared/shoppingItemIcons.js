const GENERIC_SHOPPING_ICONS = new Set(['🛒', '🥛', '🥘', '✓']);

const ITEM_ICON_RULES = [
  [/butter|margarine/, '🧈'],
  [/eier|egg|oeuf|huevo|uov|eieren|jajk/, '🥚'],
  [/milch|milk|lait|leche|latte|melk|mleko/, '🥛'],
  [/kase|kaese|cheese|fromage|queso|formaggio|kaas|ser/, '🧀'],
  [/joghurt|yoghurt|yogurt|yaourt|jogurt/, '🥣'],
  [/sahne|cream|creme|cr[eè]me|slagroom|smietana/, '🍶'],
  [/brot|broetchen|semmel|schrippe|baguette|toast|croissant|bread|bakery|pan|pain|pane|brood|chleb/, '🍞'],
  [/apfel|apple|manzana|pomme|mela|appel|jablko/, '🍎'],
  [/banane|banana|platano|banan/, '🍌'],
  [/birne|pear|pera|poire|grusz/, '🍐'],
  [/erdbeer|strawberr|fresa|fraise|fragol|aardbei|truskawk/, '🍓'],
  [/traube|grape|uva|druif|winogron/, '🍇'],
  [/zitrone|lemon|limon|citron|cytryn/, '🍋'],
  [/orange|mandarine|clementine/, '🍊'],
  [/avocado/, '🥑'],
  [/tomate|tomato|pomidor/, '🍅'],
  [/gurke|cucumber|pepino|concombre|komkommer|ogorek/, '🥒'],
  [/paprika|pepper|pimiento|poivron|peper|papryka/, '🫑'],
  [/kartoffel|potato|patata|pomme de terre|aardappel|ziemniak/, '🥔'],
  [/zwiebel|onion|cebolla|oignon|cipolla|ui|cebula/, '🧅'],
  [/knoblauch|garlic|ajo|ail|aglio|knoflook|czosnek/, '🧄'],
  [/karotte|mohre|moehre|carrot|zanahoria|carotte|wortel|marchew/, '🥕'],
  [/brokkoli|broccoli/, '🥦'],
  [/blumenkohl|cauliflower|coliflor|chou fleur|bloemkool|kalafior/, '🥦'],
  [/pilz|mushroom|champignon|fungo|paddenstoel|grzyb/, '🍄'],
  [/salat|lettuce|ensalada|laitue|insalata|sla|sa[łl]ata|spinat/, '🥬'],
  [/lauch|porree|leek|puerro|poireau|prei/, '🫛'],
  [/fleisch|meat|carne|viande|vlees|mieso|hack|hahnchen|chicken|kurczak|wurst|sausage/, '🥩'],
  [/fisch|fish|poisson|pescado|pesce|vis|ryb|lachs|salmon|thunfisch|tuna/, '🐟'],
  [/nudel|pasta|spaghetti|makaron/, '🍝'],
  [/reis|rice|arroz|riso|ryz/, '🍚'],
  [/mehl|flour|farina|bloem|maka/, '🌾'],
  [/zucker|sugar|azucar|sucre|suiker|cukier/, '🍬'],
  [/salz|salt|sal|sel|zout/, '🧂'],
  [/ol|oel|oil|aceite|olio|olie/, '🫗'],
  [/ketchup|senf|mustard|mayonnaise|mayo|sauce|sos/, '🥫'],
  [/tiefkuhl|frozen|surgel|congele|mrozon|pizza|pommes|eis|ice cream/, '❄️'],
  [/schokolade|chocolate|chocolat|cioccolato|chocolade|czekolad|nougat|keks|cookie|biscuit|chips/, '🍫'],
  [/nuss|nut|noix|nuez|noten|orzech/, '🥜'],
  [/wasser|water|eau|acqua|woda/, '💧'],
  [/kaffee|coffee|cafe|caffe|koffie|kawa/, '☕'],
  [/tee|tea|the|herbata/, '🫖'],
  [/saft|juice|jus|succo|sap/, '🧃'],
  [/bier|beer|biere|birra|piwo/, '🍺'],
  [/wein|wine|vin|vino|wijn/, '🍷'],
  [/toilettenpapier|toilet paper|papier toilette|toiletpapier|papier toaletowy/, '🧻'],
  [/waschmittel|laundry|detergent|pranie/, '🧺'],
  [/spulmittel|washing up|dish soap|vaisselle|afwas|naczyn/, '🧽'],
  [/zahnpasta|toothpaste|dentifrice|pasta de dientes|tandpasta|pasta do zebow/, '🪥'],
  [/shampoo|duschgel|shower gel|soap|seife|savon|jabon|zeep|mydlo/, '🧴'],
  [/hundefutter|dog food|karma.*pies/, '🐕'],
  [/katzenfutter|cat food|karma.*kot|katzenstreu|cat litter/, '🐈']
];

function normalizedName(value) {
  return String(value || '')
    .toLocaleLowerCase('de-DE')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss');
}

/**
 * Returns a recognisable product icon for a shopping item. The catalog itself
 * contains departments only, so it must not decide the icon for every item in
 * a department.
 */
export function shoppingItemIcon(name, fallback = '🛒') {
  const value = normalizedName(name);
  if (!value) return fallback;
  return ITEM_ICON_RULES.find(([pattern]) => pattern.test(value))?.[1] || fallback;
}

/**
 * Keeps intentional custom symbols while upgrading old category/default icons
 * (for example the former milk-glass icon for butter and eggs).
 */
export function displayShoppingItemIcon(name, storedIcon, fallback = '🛒') {
  const matchingIcon = shoppingItemIcon(name, '');
  if (matchingIcon) return matchingIcon;
  const icon = String(storedIcon || '').trim();
  return icon && !GENERIC_SHOPPING_ICONS.has(icon) ? icon : fallback;
}
