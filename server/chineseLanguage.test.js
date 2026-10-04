import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, normalizeLanguage } from '../src/i18n/index.js';
import { resources } from '../src/i18n/resources.js';
import { createTranslator } from './i18n.js';
import i18n from '../src/i18n/index.js';
import { getActiveLocale, getWeekdayNames } from '../src/utils/formatting.js';

test('Chinese is optional and German remains the default language', () => {
  assert.equal(DEFAULT_LANGUAGE, 'de');
  assert.equal(SUPPORTED_LANGUAGES.includes('zh'), true);
  assert.equal(normalizeLanguage('zh-CN'), 'zh');
  assert.equal(normalizeLanguage('de-DE'), 'de');
  assert.equal(resources.zh.auth.login.familyStep.familyNamePlaceholder, '输入家庭名称');
  assert.equal(createTranslator('zh')('errors.insufficientStars'), '星星不足');
});

test('Chinese weekdays and dates follow the selected language', () => {
  const previous = i18n.language;
  i18n.language = 'zh';
  try {
    assert.equal(getActiveLocale(), 'zh-CN');
    assert.equal(getWeekdayNames()[0], '星期一');
  } finally {
    i18n.language = previous;
  }
});
