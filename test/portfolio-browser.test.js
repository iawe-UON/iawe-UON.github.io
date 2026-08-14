'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  normalizeTheme,
  readStoredTheme,
  writeStoredTheme,
  nextTheme,
  applyAchievementFilter,
  openAchievementDialog,
  closeAchievementDialog,
  enhanceNavigationToggle,
  syncUtterances
} = require('../source/js/portfolio.js');

test('theme normalization defaults to light and accepts only known themes', () => {
  assert.equal(normalizeTheme(), 'light');
  assert.equal(normalizeTheme(''), 'light');
  assert.equal(normalizeTheme('system'), 'light');
  assert.equal(normalizeTheme('light'), 'light');
  assert.equal(normalizeTheme('dark'), 'dark');
});

test('stored theme restoration degrades to light when storage is unavailable', () => {
  assert.equal(readStoredTheme({ getItem: () => 'dark' }), 'dark');
  assert.equal(readStoredTheme({ getItem: () => 'invalid' }), 'light');
  assert.equal(readStoredTheme({ getItem: () => { throw new Error('blocked'); } }), 'light');
  assert.equal(readStoredTheme(), 'light');
});

test('theme persistence never prevents the current page from switching', () => {
  const writes = [];
  assert.equal(writeStoredTheme({ setItem: (...args) => writes.push(args) }, 'dark'), true);
  assert.deepEqual(writes, [['portfolio-theme', 'dark']]);
  assert.equal(writeStoredTheme({ setItem: () => { throw new Error('blocked'); } }, 'light'), false);
  assert.equal(writeStoredTheme(undefined, 'dark'), false);
});

test('theme toggling alternates between light and dark', () => {
  assert.equal(nextTheme('light'), 'dark');
  assert.equal(nextTheme('dark'), 'light');
  assert.equal(nextTheme('invalid'), 'dark');
});

test('Utterances receives the matching GitHub light and dark themes', () => {
  const messages = [];
  const frame = { contentWindow: { postMessage: (...args) => messages.push(args) } };
  const windowObject = { document: { querySelector: () => frame } };

  syncUtterances(windowObject, 'dark');
  syncUtterances(windowObject, 'light');

  assert.deepEqual(messages, [
    [{ type: 'set-theme', theme: 'github-dark' }, '*'],
    [{ type: 'set-theme', theme: 'github-light' }, '*']
  ]);
});

test('achievement filtering updates visibility, empty state, and aria-pressed', () => {
  const cards = ['article', 'article', 'copyright'].map(type => ({
    dataset: { achievementType: type },
    hidden: false
  }));
  const buttons = ['all', 'article', 'copyright', 'patent'].map(filter => ({
    dataset: { achievementFilter: filter },
    setAttribute(name, value) { this[name] = value; }
  }));
  const empty = { hidden: true };

  assert.equal(applyAchievementFilter(cards, buttons, empty, 'copyright'), 1);
  assert.deepEqual(cards.map(card => card.hidden), [true, true, false]);
  assert.deepEqual(buttons.map(button => button['aria-pressed']), ['false', 'false', 'true', 'false']);
  assert.equal(empty.hidden, true);

  assert.equal(applyAchievementFilter(cards, buttons, empty, 'patent'), 0);
  assert.equal(empty.hidden, false);
});

test('achievement dialog clones detail content and restores trigger focus', () => {
  const content = { replaceChildren(value) { this.value = value; } };
  const dialog = {
    open: false,
    querySelector: () => content,
    showModal() { this.open = true; },
    close() { this.open = false; }
  };
  const template = { content: { cloneNode: () => 'cloned-detail' } };
  const trigger = { focused: false, focus() { this.focused = true; } };

  openAchievementDialog(dialog, template, trigger);
  assert.equal(dialog.open, true);
  assert.equal(content.value, 'cloned-detail');

  closeAchievementDialog(dialog);
  assert.equal(dialog.open, false);
  assert.equal(trigger.focused, true);
});

test('mobile navigation toggle is keyboard focusable and responds to Enter or Space', () => {
  const handlers = {};
  const toggle = {
    dataset: {},
    attributes: {},
    clicks: 0,
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, handler) { handlers[name] = handler; },
    click() { this.clicks += 1; }
  };
  const documentObject = { querySelector: () => toggle };

  assert.equal(enhanceNavigationToggle(documentObject), true);
  assert.equal(toggle.attributes.tabindex, '0');

  for (const key of ['Enter', ' ']) {
    let prevented = false;
    handlers.keydown({ key, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
  }
  assert.equal(toggle.clicks, 2);

  handlers.keydown({ key: 'Escape', preventDefault() { throw new Error('unexpected'); } });
  assert.equal(toggle.clicks, 2);
  assert.equal(enhanceNavigationToggle(documentObject), false);
});
