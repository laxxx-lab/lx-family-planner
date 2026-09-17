import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import {
  UtensilsCrossed,
  ShoppingBag,
  Edit3,
  BookOpen,
  Trash2,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import RecipeBook from './RecipeBook';
import { recipeShareTargetFromUrl } from '../../../shared/recipeShareTarget.js';
import { formatDate, getWeekdayNames } from '../../utils/formatting';
import {
  mealBelongsToWeek,
  shiftWeekStart,
  weekStartFor
} from '../../utils/mealPlanWeek.js';

// Gespeicherte Schlüssel im Speiseplan (meal.day / meal.meal) bleiben deutsch –
// nur die Anzeige wird übersetzt.
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const MEAL_TYPE_LABEL_KEYS = {
  Mittagessen: 'planner.mealTypes.lunch',
  Abendessen: 'planner.mealTypes.dinner'
};

export default function MealPlanner() {
  const { t } = useTranslation('meals');
  const {
    meals,
    updateMeal,
    deleteMeal,
    addMealIngredientsToShopping,
    savedRecipes,
    activeHousehold
  } = useFamily();
  const [subTab, setSubTab] = useState(() =>
    recipeShareTargetFromUrl(window.location.href).isShareTarget
      ? 'recipes'
      : 'plan'
  ); // 'plan' or 'recipes'
  
  // Quick Pick Modal
  const [selectedMealSlot, setSelectedMealSlot] = useState(null); // { day, meal }
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [customRecipeTitle, setCustomRecipeTitle] = useState('');
  const [customIngredientsText, setCustomIngredientsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [visibleWeekStart, setVisibleWeekStart] = useState(() => weekStartFor());

  const weekdayLabels = getWeekdayNames('long');
  const currentWeekStart = weekStartFor();
  const visibleWeekLabel = formatDate(`${visibleWeekStart}T12:00:00`, {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const dayLabelFor = day => {
    const index = DAYS.indexOf(day);
    return index >= 0 ? weekdayLabels[index] : day;
  };
  const mealLabelFor = mealType =>
    MEAL_TYPE_LABEL_KEYS[mealType] ? t(MEAL_TYPE_LABEL_KEYS[mealType]) : mealType;

  const handleStartEditSlot = (day, mealType, existingMeal) => {
    setSelectedMealSlot({ day, meal: mealType, id: existingMeal?.id || '' });
    setCustomRecipeTitle(existingMeal?.recipe || '');
    setCustomIngredientsText((existingMeal?.ingredients || []).join(', '));
    setSelectedRecipeId('');
  };

  const handleSaveMealSlot = async (e) => {
    e.preventDefault();
    if (!selectedMealSlot) return;

    let finalTitle = customRecipeTitle;
    let finalIngredients = customIngredientsText.split(',').map(s => s.trim()).filter(Boolean);

    // If recipe selected from dropdown
    if (selectedRecipeId) {
      const found = savedRecipes.find(r => r.id === selectedRecipeId);
      if (found) {
        finalTitle = found.title;
        finalIngredients = found.ingredients || [];
      }
    }

    setSaving(true);
    const saved = await updateMeal(
      selectedMealSlot.day,
      selectedMealSlot.meal,
      finalTitle.trim(),
      finalIngredients,
      visibleWeekStart
    );
    setSaving(false);
    if (saved) setSelectedMealSlot(null);
  };

  const handleAddAllToShopping = async ingredientsList => {
    await addMealIngredientsToShopping(ingredientsList);
  };

  const handleDeleteMeal = async () => {
    if (!selectedMealSlot?.id) return;
    setSaving(true);
    const deleted = await deleteMeal(selectedMealSlot.id);
    setSaving(false);
    if (deleted) setSelectedMealSlot(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-navigation bar */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className={`btn-secondary ${subTab === 'plan' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setSubTab('plan')}
          >
            <UtensilsCrossed size={18} /> {t('planner.tabs.weeklyPlan', {
              household: activeHousehold === 'familie'
                ? t('planner.households.family')
                : t('planner.households.grandparents')
            })}
          </button>
          <button
            className={`btn-secondary ${subTab === 'recipes' ? 'btn-primary' : ''}`}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setSubTab('recipes')}
          >
            <BookOpen size={18} /> {t('planner.tabs.recipeBook', { count: savedRecipes.length })}
          </button>
        </div>
      </div>

      {subTab === 'recipes' ? (
        <RecipeBook />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 20 }}>
            <h2 className="card-title" style={{ color: '#d97706', marginBottom: 6 }}>
              <UtensilsCrossed size={24} /> {t('planner.header.title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('planner.header.subtitle')}
            </p>
            <div className="meal-week-navigation">
              <button
                className="icon-circle-btn"
                onClick={() => setVisibleWeekStart(value => shiftWeekStart(value, -1))}
                aria-label={t('common:actions.back')}
              >
                <ChevronLeft size={18} />
              </button>
              <div>
                <strong><CalendarDays size={16} /> {visibleWeekLabel}</strong>
                <button
                  className="meal-week-current"
                  onClick={() => setVisibleWeekStart(currentWeekStart)}
                  disabled={visibleWeekStart === currentWeekStart}
                >
                  {t('planner.week.current')}
                </button>
              </div>
              <button
                className="icon-circle-btn"
                onClick={() => setVisibleWeekStart(value => shiftWeekStart(value, 1))}
                aria-label={t('common:actions.next')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekly Grid (Montag - Sonntag) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {DAYS.map((dayName, dayIndex) => {
              const dayMeals = meals.filter(meal =>
                meal.day === dayName &&
                mealBelongsToWeek(meal, visibleWeekStart, currentWeekStart) &&
                (meal.household || 'familie') === activeHousehold
              );
              const mittag = dayMeals.find(m => m.meal === 'Mittagessen');
              const abend = dayMeals.find(m => m.meal === 'Abendessen');
              const dayLabel = weekdayLabels[dayIndex] || dayName;

              return (
                <div key={dayName} className="card" style={{ padding: 18 }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '2px solid var(--border-color)', paddingBottom: 8, marginBottom: 14, color: 'var(--primary)' }}>
                    📅 {dayLabel}
                  </div>

                  {/* Mittagessen */}
                  <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        ☀️ {t('planner.mealTypes.lunch')}
                      </span>
                      <button
                        className="icon-circle-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() => handleStartEditSlot(dayName, 'Mittagessen', mittag)}
                        aria-label={t('planner.slots.editAria', { day: dayLabel, meal: t('planner.mealTypes.lunch') })}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>

                    {mittag?.recipe ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{mittag.recipe}</div>
                        {mittag.ingredients && mittag.ingredients.length > 0 && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', marginTop: 6, width: '100%', justifyContent: 'center' }}
                            onClick={() => handleAddAllToShopping(mittag.ingredients)}
                          >
                            <ShoppingBag size={12} /> {t('planner.slots.addIngredients', { count: mittag.ingredients.length })}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: 'true' }}>{t('planner.slots.empty')}</div>
                    )}
                  </div>

                  {/* Abendessen */}
                  <div style={{ background: 'var(--bg-subtle)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        🌙 {t('planner.mealTypes.dinner')}
                      </span>
                      <button
                        className="icon-circle-btn"
                        style={{ width: 26, height: 26 }}
                        onClick={() => handleStartEditSlot(dayName, 'Abendessen', abend)}
                        aria-label={t('planner.slots.editAria', { day: dayLabel, meal: t('planner.mealTypes.dinner') })}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>

                    {abend?.recipe ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{abend.recipe}</div>
                        {abend.ingredients && abend.ingredients.length > 0 && (
                          <button
                            className="btn-secondary"
                            style={{ padding: '3px 8px', fontSize: '0.75rem', marginTop: 6, width: '100%', justifyContent: 'center' }}
                            onClick={() => handleAddAllToShopping(abend.ingredients)}
                          >
                            <ShoppingBag size={12} /> {t('planner.slots.addIngredients', { count: abend.ingredients.length })}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', italic: 'true' }}>{t('planner.slots.empty')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUICK PICK MODAL */}
      {selectedMealSlot && (
        <div className="modal-backdrop" onClick={() => setSelectedMealSlot(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h2 className="card-title">
                {t('planner.modal.title', {
                  day: dayLabelFor(selectedMealSlot.day),
                  meal: mealLabelFor(selectedMealSlot.meal)
                })}
              </h2>
              <button className="icon-circle-btn" onClick={() => setSelectedMealSlot(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMealSlot}>
              {savedRecipes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">{t('planner.modal.chooseFromBook')}</label>
                  <select
                    className="form-select"
                    value={selectedRecipeId}
                    onChange={e => setSelectedRecipeId(e.target.value)}
                  >
                    <option value="">{t('planner.modal.recipePlaceholderOption')}</option>
                    {savedRecipes.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">{t('planner.modal.customLabel')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('planner.modal.customPlaceholder')}
                  value={customRecipeTitle}
                  onChange={e => setCustomRecipeTitle(e.target.value)}
                  required={!selectedRecipeId}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('planner.modal.ingredientsLabel')}</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder={t('planner.modal.ingredientsPlaceholder')}
                  value={customIngredientsText}
                  onChange={e => setCustomIngredientsText(e.target.value)}
                />
              </div>

              <div className="meal-modal-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? t('planner.modal.saving') : t('common:actions.save')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setSelectedMealSlot(null)}>
                  {t('common:actions.cancel')}
                </button>
                {selectedMealSlot.id && (
                  <button
                    type="button"
                    className="meal-delete-button"
                    onClick={handleDeleteMeal}
                    disabled={saving}
                  >
                    <Trash2 size={16} /> {t('planner.modal.removeEntry')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
