'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { before, test } = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const outputRoot = path.join(root, '.test-output');
const output = path.join(outputRoot, 'public');
const hexoBin = path.join(root, 'node_modules', 'hexo', 'bin', 'hexo');

function generated(relativePath) {
  return path.join(output, ...relativePath.split('/'));
}

function readHtml(relativePath) {
  return fs.readFileSync(generated(relativePath), 'utf8');
}

function countMatches(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function generateSite(targetRoot, configFile) {
  fs.rmSync(targetRoot, { recursive: true, force: true });
  fs.mkdirSync(targetRoot, { recursive: true });
  const result = spawnSync(process.execPath, [
    hexoBin,
    'generate',
    '--config',
    `_config.yml,${configFile}`,
    '--output',
    targetRoot
  ], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(
    result.status,
    0,
    `Hexo generation failed.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
  );
  assert.doesNotMatch(
    `${result.stdout}\n${result.stderr}`,
    /\b(?:ERROR|FATAL)\b/,
    'Hexo logged a rendering error despite returning a zero exit status'
  );
  return result;
}

before(() => {
  generateSite(outputRoot, 'test/portfolio-test.yml');
});

test('generates portfolio routes and a paginated blog index', () => {
  const routes = [
    'index.html',
    'about/index.html',
    'resume/index.html',
    'achievements/index.html',
    'blog/index.html',
    'blog/page/2/index.html'
  ];

  for (const route of routes) {
    assert.ok(fs.existsSync(generated(route)), `missing generated route: /${route}`);
  }

  const home = readHtml('index.html');
  assert.match(home, /data-portfolio-page="home"/);
  assert.doesNotMatch(home, /class="main-inner index posts-expand"/);
});

test('preserves an existing post permalink, tags, and archives', () => {
  const stableRoutes = [
    '2026/01/23/Discription/index.html',
    'tags/index.html',
    'archives/index.html'
  ];

  for (const route of stableRoutes) {
    assert.ok(fs.existsSync(generated(route)), `regressed route: /${route}`);
  }
});

test('keeps Utterances on posts and excludes it from portfolio listings', () => {
  const post = readHtml('2026/01/23/Discription/index.html');
  assert.match(post, /comments utterances-container/);
  assert.match(post, /js\/third-party\/comments\/utterances\.js/);

  const pages = [
    'index.html',
    'about/index.html',
    'resume/index.html',
    'achievements/index.html',
    'blog/index.html'
  ];

  for (const page of pages) {
    const html = readHtml(page);
    assert.doesNotMatch(html, /comments utterances-container/, `unexpected comments on /${page}`);
  }
});

test('renders the portfolio home sections in the required order', () => {
  const home = readHtml('index.html');
  const sections = ['intro', 'skills', 'achievements', 'posts', 'contact'];
  let previous = -1;

  for (const section of sections) {
    const position = home.indexOf(`data-home-section="${section}"`);
    assert.ok(position > previous, `home section is missing or out of order: ${section}`);
    previous = position;
  }

  assert.equal(countMatches(home, /data-featured-achievement/g), 3);
  assert.equal(countMatches(home, /data-latest-post/g), 3);
});

test('uses an initial avatar fallback and omits unconfigured optional controls', () => {
  const home = readHtml('index.html');
  const resume = readHtml('resume/index.html');

  assert.match(home, /portfolio-avatar--fallback[^>]*>\s*示\s*</);
  assert.doesNotMatch(home, /<img[^>]+class="[^"]*portfolio-avatar/);
  assert.doesNotMatch(resume, /data-resume-download/);
});

test('renders static about and structured resume content', () => {
  const about = readHtml('about/index.html');
  assert.match(about, /example@example\.com/);
  assert.match(about, /138-0000-0000/);
  assert.doesNotMatch(about, /mailto:|tel:/);

  const resume = readHtml('resume/index.html');
  for (const section of ['experience', 'education', 'skills', 'projects']) {
    assert.match(resume, new RegExp(`data-resume-section="${section}"`));
  }
  assert.match(resume, /示例科技公司/);
  assert.match(resume, /示例大学/);
});

test('loads theme initialization before body paint and renders a toggle', () => {
  const home = readHtml('index.html');
  const scriptPosition = home.indexOf('src="/js/portfolio.js"');
  const bodyPosition = home.indexOf('<body');

  assert.ok(scriptPosition > -1 && scriptPosition < bodyPosition, 'theme script must load in the head');
  assert.match(home, /<button[^>]+data-theme-toggle/);
  assert.match(home, /aria-label="切换为深色主题"/);
  assert.ok(fs.existsSync(generated('js/portfolio.js')));
});

test('builds the three-token rounded responsive visual system', () => {
  const css = fs.readFileSync(generated('css/main.css'), 'utf8');
  const tokens = [...new Set(css.match(/--portfolio-[a-z-]+/g) || [])].sort();

  assert.deepEqual(tokens, ['--portfolio-accent', '--portfolio-bg', '--portfolio-text']);
  assert.match(css, /html\[data-theme=['"]?light['"]?\]/);
  assert.match(css, /html\[data-theme=['"]?dark['"]?\]/);
  assert.match(css, /\.portfolio-card[^{]*\{[^}]*border-radius:/s);
  assert.match(css, /\.portfolio-grid[^{]*\{[^}]*grid-template-columns:/s);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('renders valid achievement filters, cards, templates, and one drawer', () => {
  const html = readHtml('achievements/index.html');

  for (const filter of ['all', 'article', 'copyright', 'patent']) {
    assert.match(html, new RegExp(`data-achievement-filter="${filter}"`));
  }
  assert.match(html, /data-achievement-filter="all"[^>]+aria-pressed="true"/);
  assert.equal(countMatches(html, /data-achievement-card/g), 4);
  assert.equal(countMatches(html, /<template[^>]+data-achievement-template/g), 4);
  assert.equal(countMatches(html, /<dialog[^>]+data-achievement-dialog/g), 1);
  assert.doesNotMatch(html, /证书预览|附件预览|achievement-image/);
});

test('renders a ten-post reverse-chronological blog page with native tag links', () => {
  const html = readHtml('blog/index.html');
  const dates = [...html.matchAll(/data-blog-date="([^"]+)"/g)].map(match => match[1]);

  assert.equal(countMatches(html, /data-blog-card/g), 10);
  assert.equal(dates.length, 10);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(countMatches(html, /data-blog-summary/g), 10);
  assert.equal(countMatches(html, /data-blog-detail/g), 10);
  assert.match(html, /data-blog-tag[^>]+href="\/tags\//);
  assert.match(html, /<nav class="pagination">/);

  const secondPage = readHtml('blog/page/2/index.html');
  assert.equal(countMatches(secondPage, /data-blog-card/g), 10);
  assert.match(secondPage, /class="[^"]*prev[^"]*"|rel="prev"/);
});

test('omits optional portfolio controls when their data is missing', () => {
  const dataPath = path.join(root, 'source', '_data', 'portfolio.yml');
  const original = fs.readFileSync(dataPath, 'utf8');
  const fallbackRoot = path.join(root, '.test-output-fallback');

  try {
    const data = yaml.load(original);
    delete data.profile.avatar;
    delete data.contact.email;
    delete data.contact.phone;
    delete data.resume.pdf;
    for (const item of data.achievements) {
      delete item.role;
      delete item.url;
    }
    fs.writeFileSync(dataPath, yaml.dump(data), 'utf8');
    generateSite(fallbackRoot, 'test/portfolio-fallback.yml');

    const fallbackPublic = path.join(fallbackRoot, 'public');
    const home = fs.readFileSync(path.join(fallbackPublic, 'index.html'), 'utf8');
    const about = fs.readFileSync(path.join(fallbackPublic, 'about', 'index.html'), 'utf8');
    const resume = fs.readFileSync(path.join(fallbackPublic, 'resume', 'index.html'), 'utf8');
    const achievements = fs.readFileSync(path.join(fallbackPublic, 'achievements', 'index.html'), 'utf8');

    assert.match(home, /portfolio-avatar--fallback/);
    assert.doesNotMatch(about, /<dt>邮箱<\/dt>|<dt>电话<\/dt>/);
    assert.doesNotMatch(resume, /data-resume-download/);
    assert.doesNotMatch(achievements, /<dt>职责<\/dt>|查看外部链接/);
  } finally {
    fs.writeFileSync(dataPath, original, 'utf8');
  }
});
