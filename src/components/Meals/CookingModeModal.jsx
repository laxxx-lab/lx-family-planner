import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { handleImgError, DEFAULT_RECIPE_IMAGE } from '../../utils/imageFallback';
import { X, Play, Pause, RotateCcw, Clock, ShoppingBag, CheckSquare, Users, Flame, BellRing } from 'lucide-react';
import {
  getInstructionDurationMinutes,
  parseInstructionSteps
} from '../../../shared/recipeInstructions.js';

export default function CookingModeModal({ recipe, onClose }) {
  const { t } = useTranslation('meals');
  const { addMealIngredientsToShopping, showToast } = useFamily();

  if (!recipe) return null;

  // Portions State & Base Portion
  const basePortions = parseInt(recipe.servings) || 4;
  const [portions, setPortions] = useState(basePortions);

  // Completed Steps State
  const [completedSteps, setCompletedSteps] = useState([]);

  // Kitchen Timer State
  const [customTimerMinutes, setCustomTimerMinutes] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Parse instruction steps into an array of individual sentences
  const steps = parseInstructionSteps(recipe.instructions);
  const stepProgress = steps.length
    ? Math.round((completedSteps.length / steps.length) * 100)
    : 0;

  // Scale ingredient quantities based on portion multiplier
  const portionMultiplier = portions / (basePortions || 1);

  const scaleIngredientStr = (ingStr) => {
    if (typeof ingStr !== 'string') return String(ingStr || '');
    if (portionMultiplier === 1) return ingStr;
    // Scale only a leading decimal quantity or range, never package sizes
    // or other digits in the description. Imported fractions are normalized.
    return ingStr.replace(
      /^(\d+(?:[.,]\d+)?)(?:\s*([-–])\s*(\d+(?:[.,]\d+)?))?(?=\s|[a-zA-Zµμ]|$)/u,
      (_match, first, separator, last) => {
        const scale = amount => String(Number(
          (Number(amount.replace(',', '.')) * portionMultiplier).toFixed(6)
        )).replace('.', ',');
        return last ? scale(first) + separator + scale(last) : scale(first);
      }
    );
  };

  const rawIngredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : typeof recipe.ingredients === 'string' ? recipe.ingredients.split('\n') : [];

  const scaledIngredients = rawIngredients.map(ing => scaleIngredientStr(ing));

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play();
            } catch (e) {}

            showToast(t('cookingMode.timer.finishedTitle'), t('cookingMode.timer.finishedBody', { title: recipe.title }), 'star');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const startTimerWithMinutes = (minutes) => {
    const mins = Number(minutes);
    if (isNaN(mins) || mins <= 0) return;
    const secs = Math.round(mins * 60);
    setTimerSeconds(secs);
    setIsTimerRunning(true);
    showToast(t('cookingMode.timer.startedTitle'), t('cookingMode.timer.startedBody', { count: mins }), 'info');
  };

  const formatTimerTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleStepCompleted = (stepIdx) => {
    if (completedSteps.includes(stepIdx)) {
      setCompletedSteps(prev => prev.filter(i => i !== stepIdx));
    } else {
      setCompletedSteps(prev => [...prev, stepIdx]);
    }
  };

  const handleAddAllToShopping = () => {
    if (scaledIngredients.length === 0) return;
    addMealIngredientsToShopping(scaledIngredients);
    showToast(t('cookingMode.ingredients.addedTitle'), t('cookingMode.ingredients.addedBody', { count: scaledIngredients.length, title: recipe.title }), 'success');
  };

  const recipeImageUrl = typeof recipe.image === 'string' && recipe.image ? recipe.image : DEFAULT_RECIPE_IMAGE;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 300 }}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 880, width: '100%', maxHeight: '92vh' }}>
        
        {/* MODAL HEADER */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#059669', color: 'white', padding: '6px 12px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={16} /> {t('cookingMode.activeBadge')}
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              {recipe.title}
            </h2>
          </div>

          <button className="icon-circle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* RECIPE HERO IMAGE & METRICS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
          <div style={{ position: 'relative', height: 180, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <img
              src={recipeImageUrl}
              onError={e => handleImgError(e, DEFAULT_RECIPE_IMAGE)}
              alt={recipe.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* TIMER & PORTIONS CONTROL BOX */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            
            {/* PORTION SCALER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={18} style={{ color: 'var(--primary)' }} /> {t('cookingMode.adjustPortions')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="icon-circle-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setPortions(Math.max(1, portions - 1))}
                >
                  -
                </button>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', minWidth: 28, textAlign: 'center' }}>
                  {portions}
                </span>
                <button
                  className="icon-circle-btn"
                  style={{ width: 32, height: 32 }}
                  onClick={() => setPortions(portions + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* INTEGRATED KITCHEN TIMER */}
            <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, color: '#d97706' }}>
                  <BellRing size={16} /> {t('cookingMode.timer.title')}
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.4rem', color: isTimerRunning ? '#ef4444' : 'var(--text-main)' }}>
                  {formatTimerTime(timerSeconds)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="form-input"
                  style={{ width: 70, minHeight: 36, padding: '4px 8px', fontSize: '0.85rem' }}
                  value={customTimerMinutes}
                  onChange={e => setCustomTimerMinutes(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>{t('cookingMode.timer.minutesUnit')}</span>

                {!isTimerRunning ? (
                  <button
                    className="btn-primary"
                    style={{ flex: 1, minHeight: 36, padding: '4px 10px', fontSize: '0.85rem', justifyContent: 'center', background: '#059669' }}
                    onClick={() => startTimerWithMinutes(customTimerMinutes)}
                  >
                    <Play size={14} /> {t('cookingMode.timer.start')}
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, minHeight: 36, padding: '4px 10px', fontSize: '0.85rem', justifyContent: 'center', color: '#ef4444' }}
                    onClick={() => setIsTimerRunning(false)}
                  >
                    <Pause size={14} /> {t('cookingMode.timer.stop')}
                  </button>
                )}

                <button
                  className="icon-circle-btn"
                  style={{ width: 36, height: 36 }}
                  onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }}
                  title={t('cookingMode.timer.resetTitle')}
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN WORKFLOW: INGREDIENTS & STEPS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          
          {/* COLUMN 1: INGREDIENTS LIST */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#059669' }}>
                <ShoppingBag size={20} /> {t('cookingMode.ingredients.title', { count: scaledIngredients.length })}
              </h3>
              <button
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.8rem', color: '#059669', borderColor: '#059669' }}
                onClick={handleAddAllToShopping}
              >
                {t('cookingMode.ingredients.addToList')}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
              {scaledIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span>•</span>
                  <span>{ing}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COLUMN 2: STEP-BY-STEP INSTRUCTIONS */}
          <div className="cooking-steps-panel">
            <div className="cooking-steps-heading">
              <h3>
                <CheckSquare size={20} /> {t('cookingMode.steps.title')}
              </h3>
              <span>
                {t('cookingMode.steps.progress', { completed: completedSteps.length, total: steps.length })}
              </span>
            </div>

            <div
              className="cooking-steps-progress"
              role="progressbar"
              aria-label={t('cookingMode.steps.progressAria')}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={stepProgress}
            >
              <span style={{ width: `${stepProgress}%` }} />
            </div>

            <div className="cooking-steps-list">
              {steps.map((stepText, idx) => {
                const isDone = completedSteps.includes(idx);
                const durationMinutes =
                  getInstructionDurationMinutes(stepText);
                const isParallel =
                  /\b(?:während|in der zwischenzeit|gleichzeitig)\b/i.test(
                    stepText
                  );

                return (
                  <article
                    key={idx}
                    className={`cooking-step-card ${
                      isDone ? 'completed' : ''
                    } ${isParallel ? 'parallel' : ''}`}
                  >
                    <button
                      type="button"
                      className="cooking-step-main"
                      onClick={() => toggleStepCompleted(idx)}
                      aria-pressed={isDone}
                    >
                      <span className="cooking-step-number">
                        {idx + 1}
                      </span>
                      <span className="cooking-step-copy">
                        {stepText}
                        {isParallel && (
                          <small>{t('cookingMode.steps.parallelHint')}</small>
                        )}
                      </span>
                      <CheckSquare
                        className="cooking-step-check"
                        size={18}
                      />
                    </button>
                    {durationMinutes > 0 && (
                      <button
                        type="button"
                        className="cooking-step-timer"
                        onClick={() =>
                          startTimerWithMinutes(durationMinutes)
                        }
                      >
                        <Clock size={14} />
                        {t('cookingMode.steps.stepTimer', { minutes: durationMinutes })}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
