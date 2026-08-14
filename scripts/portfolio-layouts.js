/* global hexo */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validAchievements } = require('../lib/portfolio-data');

const layoutRoot = path.join(hexo.base_dir, 'portfolio', 'layouts');
const views = [
  ['_partials/portfolio/component', 'component'],
  ['portfolio-home', 'portfolio-home'],
  ['portfolio-about', 'portfolio-about'],
  ['portfolio-resume', 'portfolio-resume'],
  ['portfolio-achievements', 'portfolio-achievements'],
  ['portfolio-blog', 'portfolio-blog']
];

hexo.extend.helper.register('portfolio_achievements', (items, featuredOnly = false, limit) => {
  return validAchievements(items, { featuredOnly, limit });
});

hexo.extend.helper.register('portfolio_initial', name => {
  const characters = Array.from(String(name || '').trim());
  return (characters[0] || '?').toUpperCase();
});

hexo.extend.helper.register('portfolio_achievement_type', type => ({
  article: '文章',
  copyright: '软著',
  patent: '专利'
}[type] || type));

hexo.extend.filter.register('before_generate', () => {
  for (const [viewName, fileName] of views) {
    const source = fs.readFileSync(path.join(layoutRoot, `${fileName}.njk`), 'utf8');
    hexo.theme.setView(`${viewName}.njk`, source);
  }
}, 20);
