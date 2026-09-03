import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Link2,
  LoaderCircle,
  PackageOpen,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import BringAccountModal from './BringAccountModal';
import {
  displayShoppingItemIcon,
  shoppingItemIcon
} from '../../../shared/shoppingItemIcons.js';

const POPULAR_NAMES = [
  ['Eier', 'Eggs'],
  ['Milch', 'Milk'],
  ['Butter', 'Butter'],
  ['Käse', 'Cheese'],
  ['Joghurt', 'Yoghurt'],
  ['Brötchen', 'Bread roll'],
  ['Brot', 'Bread'],
  ['Bananen', 'Bananas'],
  ['Äpfel', 'Apples'],
  ['Tomaten', 'Tomatoes'],
  ['Gurken', 'Cucumber'],
  ['Kartoffeln', 'Potatoes'],
  ['Lauch', 'Leek'],
  ['Nudeln', 'Pasta'],
  ['Reis', 'Rice'],
  ['Mineralwasser', 'Water'],
  ['Kaffee', 'Coffee'],
  ['Nougatcreme', 'Nougat cream'],
  ['Toilettenpapier', 'Toilet paper'],
  ['Spülmittel', 'Washing-up liquid']
];

const PERSONAL_FAVORITES = {
  de: [
    {
      id: 'custom-nutella',
      name: 'Nutella',
      category: 'Snacks & Süsswaren',
      icon: '🍫',
      aliases: 'nougatcreme nuss nougat aufstrich'
    },
    {
      id: 'custom-porree',
      name: 'Porree',
      category: 'Obst & Gemüse',
      icon: '🥦',
      aliases: 'lauch poree'
    }
  ],
  en: [
    {
      id: 'custom-nutella',
      name: 'Nutella',
      category: 'Snacks & Sweets',
      icon: '🍫',
      aliases: 'nougat cream chocolate spread'
    }
  ]
};

const NAME_ALIASES = {
  lauch: 'porree poree',
  nougatcreme: 'nutella nuss nougat aufstrich',
  brotchen: 'semmel schrippe weck'
};

function normalizeSearch(value) {
  return String(value || '')
    .toLocaleLowerCase('de-DE')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .trim();
}

function uniqueByName(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = normalizeSearch(item.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function searchableText(item) {
  const key = normalizeSearch(item.name);
  return `${key} ${normalizeSearch(item.aliases)} ${NAME_ALIASES[key] || ''}`;
}

function rankMatch(item, query) {
  const name = normalizeSearch(item.name);
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (searchableText(item).includes(query)) return 2;
  return 3;
}

export default function BringShoppingList() {
  const { t, i18n } = useTranslation('shopping');
  const personalFavorites = i18n.language?.startsWith('en')
    ? PERSONAL_FAVORITES.en
    : PERSONAL_FAVORITES.de;
  const {
    shoppingItems,
    toggleShoppingSelected,
    toggleShoppingInCart,
    addShoppingItem,
    bringCredentials,
    bringCatalog,
    fetchBringCatalog,
    setIsBringModalOpen,
    fetchBringLiveItems
  } = useFamily();

  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState('1x');
  const [activeSection, setActiveSection] = useState('popular');
  const [addingName, setAddingName] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showRecent, setShowRecent] = useState(false);

  useEffect(() => {
    fetchBringCatalog();
  }, [fetchBringCatalog]);

  const catalogItems = useMemo(
    () =>
      (bringCatalog.sections || []).flatMap(section =>
        section.items.map(item => ({
          ...item,
          sectionId: section.id,
          category: section.name,
          icon: shoppingItemIcon(item.name, item.icon || section.icon)
        }))
      ),
    [bringCatalog.sections]
  );

  const rememberedItems = useMemo(
    () =>
      shoppingItems.map(item => ({
        id: `remembered-${item.id}`,
        name: item.name,
        category: item.category || t('catalog.customCategory'),
        icon: displayShoppingItemIcon(item.name, item.icon),
        aliases: ''
      })),
    [shoppingItems, t]
  );

  const allChoices = useMemo(
    () =>
      uniqueByName([
        ...personalFavorites,
        ...catalogItems,
        ...rememberedItems
      ]),
    [catalogItems, personalFavorites, rememberedItems]
  );

  const popularItems = useMemo(() => {
    const byName = new Map(
      allChoices.map(item => [normalizeSearch(item.name), item])
    );
    return uniqueByName([
      ...POPULAR_NAMES
        .map(names =>
          names.map(name => byName.get(normalizeSearch(name))).find(Boolean)
        )
        .filter(Boolean),
      ...personalFavorites
    ]);
  }, [allChoices, personalFavorites]);

  const visibleCatalog = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (normalizedQuery) {
      return allChoices
        .filter(item => searchableText(item).includes(normalizedQuery))
        .sort(
          (left, right) =>
            rankMatch(left, normalizedQuery) - rankMatch(right, normalizedQuery) ||
            left.name.localeCompare(right.name, 'de-DE')
        )
        .slice(0, 60);
    }
    if (activeSection === 'popular') return popularItems;
    return allChoices
      .filter(item => item.sectionId === activeSection)
      .slice(0, 80);
  }, [activeSection, allChoices, popularItems, query]);

  const activeItems = shoppingItems.filter(
    item => item.isSelected && !item.inCart
  );
  const recentItems = shoppingItems.filter(item => item.inCart);
  const activeNames = new Set(
    activeItems.map(item => normalizeSearch(item.name))
  );

  const addChoice = async item => {
    const cleanName = item.name.trim();
    if (!cleanName || addingName) return;

    const existing = shoppingItems.find(
      entry => normalizeSearch(entry.name) === normalizeSearch(cleanName)
    );
    setAddingName(cleanName);
    try {
      let result;
      if (existing?.inCart) {
        result = await toggleShoppingInCart(existing.id);
      } else if (existing && !existing.isSelected) {
        result = await toggleShoppingSelected(existing.id);
      } else if (!existing || !existing.isSelected) {
        result = await addShoppingItem({
          name: cleanName,
          category: item.category || 'Eigene Artikel',
          icon: item.icon || '🛒',
          quantity: quantity.trim() || '1x'
        });
      }

      if (result !== null) {
        setQuery('');
      }
    } finally {
      setAddingName('');
    }
  };

  const submitCustomItem = async event => {
    event.preventDefault();
    const cleanName = query.trim();
    if (!cleanName) return;
    const exactMatch = allChoices.find(
      item => normalizeSearch(item.name) === normalizeSearch(cleanName)
    );
    const currentSection = bringCatalog.sections?.find(
      section => section.id === activeSection
    );
    await addChoice(
      exactMatch || {
        id: `custom-${normalizeSearch(cleanName)}`,
        name: cleanName,
        category: currentSection?.name || 'Eigene Artikel',
          icon: shoppingItemIcon(cleanName, currentSection?.icon || '🛒')
      }
    );
  };

  const syncBring = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetchBringLiveItems();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="market-page">
      <section className="market-hero">
        <div className="market-hero-copy">
          <span className="market-eyebrow">
            <Sparkles size={15} />
            {t('hero.eyebrow')}
          </span>
          <h1>{t('hero.title')}</h1>
          <p>{t('hero.subtitle')}</p>
          <div className="market-status-row">
            <span className={`market-status ${bringCredentials.isConnected ? 'live' : ''}`}>
              {bringCredentials.isConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
              {bringCredentials.isConnected
                ? t('hero.statusLive', { listName: bringCredentials.listName })
                : t('hero.statusLocal')}
            </span>
            <span className="market-status catalog">
              <PackageOpen size={15} />
              {t('hero.catalogItems', { total: bringCatalog.total || '…' })}
            </span>
          </div>
        </div>

        <div className="market-hero-actions">
          {bringCredentials.isConnected && (
            <button
              type="button"
              className="market-icon-action"
              onClick={syncBring}
              disabled={syncing}
            >
              <RefreshCw size={18} className={syncing ? 'spin' : ''} />
              {syncing ? t('hero.syncing') : t('hero.refreshBring')}
            </button>
          )}
          <button
            type="button"
            className="market-icon-action secondary"
            onClick={() => setIsBringModalOpen(true)}
          >
            {bringCredentials.isConnected ? <Smartphone size={18} /> : <Link2 size={18} />}
            {bringCredentials.isConnected ? t('hero.connection') : t('hero.connectBring')}
          </button>
        </div>
      </section>

      <section className="market-search-card">
        <form className="market-search-form" onSubmit={submitCustomItem}>
          <div className="market-search-input">
            <Search size={22} />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('search.placeholder')}
              aria-label={t('search.searchAria')}
              autoComplete="off"
            />
          </div>
          <label className="market-quantity">
            <span>{t('search.quantityLabel')}</span>
            <input
              value={quantity}
              onChange={event => setQuantity(event.target.value)}
              aria-label={t('search.quantityAria')}
              placeholder="1x"
            />
          </label>
          <button
            type="submit"
            className="market-add-button"
            disabled={!query.trim() || Boolean(addingName)}
          >
            {addingName ? <LoaderCircle size={19} className="spin" /> : <Plus size={19} />}
            {t('common:actions.add')}
          </button>
        </form>
        <p className="market-search-hint">
          {t('search.hint')}
        </p>
      </section>

      <section className="market-list-section">
        <div className="market-section-heading">
          <div>
            <span className="market-kicker">{t('list.kicker')}</span>
            <h2>{t('list.title')}</h2>
          </div>
          <span className="market-count">{activeItems.length}</span>
        </div>

        {activeItems.length === 0 ? (
          <div className="market-empty">
            <span>🧺</span>
            <strong>{t('list.emptyTitle')}</strong>
            <p>{t('list.emptyHint')}</p>
          </div>
        ) : (
          <div className="market-active-grid">
            {activeItems.map(item => (
              <button
                type="button"
                key={item.id}
                className="market-active-item"
                onClick={event => toggleShoppingInCart(item.id, event)}
              >
                <span className="market-item-icon">{displayShoppingItemIcon(item.name, item.icon)}</span>
                <span className="market-item-copy">
                  <strong>{item.name}</strong>
                  <small>{item.quantity || '1x'}</small>
                </span>
                <span className="market-check"><Check size={17} /></span>
              </button>
            ))}
          </div>
        )}

        {recentItems.length > 0 && (
          <div className="market-recent">
            <button
              type="button"
              className="market-recent-toggle"
              onClick={() => setShowRecent(value => !value)}
              aria-expanded={showRecent}
            >
              <span>
                <RotateCcw size={17} />
                {t('list.recentToggle', { count: recentItems.length })}
              </span>
              {showRecent ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {showRecent && (
              <div className="market-recent-list">
                {recentItems.slice(0, 40).map(item => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={event => toggleShoppingInCart(item.id, event)}
                  >
                    <span>{displayShoppingItemIcon(item.name, item.icon, '✓')}</span>
                    <span>{item.name}</span>
                    <small>{t('list.backToList')}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="market-catalog-section">
        <div className="market-section-heading catalog-heading">
          <div>
            <span className="market-kicker">
              {bringCatalog.source === 'bring' ? t('catalog.sourceBring') : t('catalog.sourceDefault')}
            </span>
            <h2>{query ? t('catalog.resultsFor', { query }) : t('catalog.quickAdd')}</h2>
          </div>
          <span className="market-result-count">{t('catalog.shownCount', { count: visibleCatalog.length })}</span>
        </div>

        {!query && (
          <div className="market-departments" aria-label={t('catalog.departmentsAria')}>
            <button
              type="button"
              className={activeSection === 'popular' ? 'active' : ''}
              onClick={() => setActiveSection('popular')}
            >
              <span>⭐</span>
              {t('catalog.popular')}
            </button>
            {(bringCatalog.sections || []).map(section => (
              <button
                type="button"
                key={section.id}
                className={activeSection === section.id ? 'active' : ''}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.icon}</span>
                {section.name}
              </button>
            ))}
          </div>
        )}

        {visibleCatalog.length > 0 ? (
          <div className="market-catalog-grid">
            {visibleCatalog.map(item => {
              const alreadyActive = activeNames.has(normalizeSearch(item.name));
              const isAdding = addingName === item.name;
              return (
                <button
                  type="button"
                  key={`${item.category}-${item.id}-${item.name}`}
                  className={alreadyActive ? 'on-list' : ''}
                  onClick={() => addChoice(item)}
                  disabled={alreadyActive || Boolean(addingName)}
                >
                  <span className="market-catalog-icon">{displayShoppingItemIcon(item.name, item.icon)}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.category}</small>
                  </span>
                  <span className="market-catalog-action">
                    {alreadyActive ? (
                      <>
                        <Check size={16} /> {t('catalog.onList')}
                      </>
                    ) : isAdding ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <Plus size={17} />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="market-no-results">
            <Search size={26} />
            <strong>{t('catalog.noResultsTitle')}</strong>
            <p>{t('catalog.noResultsHint', { query })}</p>
          </div>
        )}
      </section>

      <BringAccountModal />
    </div>
  );
}
