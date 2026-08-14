(function portfolioModule(globalObject, factory) {
  'use strict';

  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (globalObject && globalObject.document) {
    globalObject.PortfolioUI = api;
    api.initialize(globalObject);
  }
}(typeof window === 'undefined' ? undefined : window, function createPortfolioApi() {
  'use strict';

  const STORAGE_KEY = 'portfolio-theme';

  function normalizeTheme(value) {
    return value === 'dark' ? 'dark' : 'light';
  }

  function readStoredTheme(storage) {
    try {
      return normalizeTheme(storage && storage.getItem(STORAGE_KEY));
    } catch (_error) {
      return 'light';
    }
  }

  function writeStoredTheme(storage, theme) {
    try {
      if (!storage) return false;
      storage.setItem(STORAGE_KEY, normalizeTheme(theme));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function nextTheme(theme) {
    return normalizeTheme(theme) === 'dark' ? 'light' : 'dark';
  }

  function applyAchievementFilter(cards, buttons, emptyState, selectedFilter) {
    const filter = ['article', 'copyright', 'patent'].includes(selectedFilter)
      ? selectedFilter
      : 'all';
    let visible = 0;

    for (const card of cards) {
      const matches = filter === 'all' || card.dataset.achievementType === filter;
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const button of buttons) {
      button.setAttribute('aria-pressed', String(button.dataset.achievementFilter === filter));
    }
    if (emptyState) emptyState.hidden = visible !== 0;
    return visible;
  }

  function openAchievementDialog(dialog, template, trigger) {
    if (!dialog || !template) return false;
    const content = dialog.querySelector('[data-achievement-dialog-content]');
    if (!content) return false;
    content.replaceChildren(template.content.cloneNode(true));
    dialog.__portfolioTrigger = trigger;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    return true;
  }

  function closeAchievementDialog(dialog) {
    if (!dialog) return;
    const trigger = dialog.__portfolioTrigger;
    if (dialog.open && typeof dialog.close === 'function') {
      dialog.close();
    } else if (typeof dialog.removeAttribute === 'function') {
      dialog.removeAttribute('open');
    }
    dialog.__portfolioTrigger = undefined;
    if (trigger && typeof trigger.focus === 'function') trigger.focus();
  }

  function syncUtterances(windowObject, theme) {
    const frame = windowObject.document.querySelector('.utterances-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      type: 'set-theme',
      theme: normalizeTheme(theme) === 'dark' ? 'github-dark' : 'github-light'
    }, '*');
  }

  function applyTheme(windowObject, theme) {
    const selected = normalizeTheme(theme);
    const root = windowObject.document.documentElement;
    const toggle = windowObject.document.querySelector('[data-theme-toggle]');

    root.setAttribute('data-theme', selected);
    if (toggle) {
      const dark = selected === 'dark';
      toggle.setAttribute('aria-pressed', String(dark));
      toggle.setAttribute('aria-label', dark ? '切换为浅色主题' : '切换为深色主题');
      const label = toggle.querySelector('[data-theme-label]');
      if (label) label.textContent = dark ? '浅色' : '深色';
    }
    syncUtterances(windowObject, selected);
    return selected;
  }

  function bindThemeToggle(windowObject) {
    const toggle = windowObject.document.querySelector('[data-theme-toggle]');
    if (!toggle || toggle.dataset.themeBound === 'true') return;
    toggle.dataset.themeBound = 'true';
    applyTheme(windowObject, windowObject.document.documentElement.getAttribute('data-theme'));
    toggle.addEventListener('click', () => {
      const selected = nextTheme(windowObject.document.documentElement.getAttribute('data-theme'));
      applyTheme(windowObject, selected);
      writeStoredTheme(windowObject.localStorage, selected);
    });
  }

  function bindAchievements(documentObject) {
    const root = documentObject.querySelector('[data-achievements-root]');
    if (!root || root.dataset.achievementsBound === 'true') return;
    root.dataset.achievementsBound = 'true';

    const cards = [...root.querySelectorAll('[data-achievement-card]')];
    const buttons = [...root.querySelectorAll('[data-achievement-filter]')];
    const templates = [...root.querySelectorAll('[data-achievement-template]')];
    const emptyState = root.querySelector('[data-achievement-empty]');
    const dialog = root.querySelector('[data-achievement-dialog]');
    const closeButton = root.querySelector('[data-achievement-dialog-close]');

    for (const button of buttons) {
      button.addEventListener('click', () => {
        applyAchievementFilter(cards, buttons, emptyState, button.dataset.achievementFilter);
      });
    }
    for (const card of cards) {
      card.addEventListener('click', () => {
        const template = templates.find(item => (
          item.dataset.achievementTemplate === card.dataset.achievementId
        ));
        openAchievementDialog(dialog, template, card);
      });
    }
    if (closeButton) closeButton.addEventListener('click', () => closeAchievementDialog(dialog));
    if (dialog) {
      dialog.addEventListener('click', event => {
        if (event.target === dialog) closeAchievementDialog(dialog);
      });
      dialog.addEventListener('cancel', event => {
        event.preventDefault();
        closeAchievementDialog(dialog);
      });
      documentObject.addEventListener('keydown', event => {
        if (event.key === 'Escape' && dialog.open) {
          event.preventDefault();
          closeAchievementDialog(dialog);
        }
      });
    }
    applyAchievementFilter(cards, buttons, emptyState, 'all');
  }

  function enhanceNavigationToggle(documentObject) {
    const toggle = documentObject.querySelector('.site-nav-toggle .toggle');
    if (!toggle || toggle.dataset.portfolioKeyboardBound === 'true') return false;
    toggle.dataset.portfolioKeyboardBound = 'true';
    toggle.setAttribute('tabindex', '0');
    toggle.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle.click();
    });
    return true;
  }

  function bindPageInteractions(windowObject) {
    bindThemeToggle(windowObject);
    bindAchievements(windowObject.document);
    enhanceNavigationToggle(windowObject.document);
  }

  function initialize(windowObject) {
    applyTheme(windowObject, readStoredTheme(windowObject.localStorage));
    if (windowObject.document.readyState === 'loading') {
      windowObject.document.addEventListener('DOMContentLoaded', () => bindPageInteractions(windowObject), { once: true });
    } else {
      bindPageInteractions(windowObject);
    }
    windowObject.document.addEventListener('pjax:success', () => bindPageInteractions(windowObject));
  }

  return {
    normalizeTheme,
    readStoredTheme,
    writeStoredTheme,
    nextTheme,
    applyAchievementFilter,
    openAchievementDialog,
    closeAchievementDialog,
    applyTheme,
    bindThemeToggle,
    bindAchievements,
    enhanceNavigationToggle,
    syncUtterances,
    initialize
  };
}));
