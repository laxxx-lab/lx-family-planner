import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { extractRecipeDocument } from './recipeImporter.js';

test('JSON-LD ingredient entities and mixed fractions become decimal quantities', () => {
  const ingredients = ['1 &frac12; TL Salz', '&#188; TL Gewürz', '½ Bund Kräuter', '1½ EL Öl', '200 g Reis', 'Salz &amp; Pfeffer'];
  const html = '<script type="application/ld+json">' + JSON.stringify({ '@type': 'Recipe', name: 'Test', recipeIngredient: ingredients }) + '</script>';
  const result = extractRecipeDocument(html, 'https://example.org/recipe');
  assert.deepEqual(result.recipe.ingredients, ['1,5 TL Salz', '0,25 TL Gewürz', '0,5 Bund Kräuter', '1,5 EL Öl', '200 g Reis', 'Salz & Pfeffer']);
});

test('actual cooking mode scaler preserves quarters and package-size notes', () => {
  const source = readFileSync(new URL('../src/components/Meals/CookingModeModal.jsx', import.meta.url), 'utf8');
  const start = source.indexOf('  const scaleIngredientStr =');
  const end = source.indexOf('\n\n  const rawIngredients', start);
  assert.ok(start >= 0 && end > start);
  const scale = multiplier => vm.runInNewContext(source.slice(start, end) + '\nscaleIngredientStr', { portionMultiplier: multiplier });
  assert.equal(scale(1)('0,25 TL Salz'), '0,25 TL Salz');
  assert.equal(scale(2)('0,25 TL Salz'), '0,5 TL Salz');
  assert.equal(scale(0.5)('0,25 TL Salz'), '0,125 TL Salz');
  assert.equal(scale(2)('1,5 TL Salz'), '3 TL Salz');
  assert.equal(scale(2)('1 Dose Bohnen (400 g)'), '2 Dose Bohnen (400 g)');
  assert.equal(scale(2)('1–2 EL Öl'), '2–4 EL Öl');
});
