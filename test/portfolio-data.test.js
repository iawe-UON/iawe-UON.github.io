'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { validAchievements } = require('../lib/portfolio-data');

test('achievement data keeps valid types and skips incomplete records', () => {
  const records = [
    { id: 'a', type: 'article', title: 'A', date: '2026', status: '已发表', summary: '文章' },
    { id: 'c', type: 'copyright', title: 'C', date: '2025', status: '已登记', summary: '软著' },
    { id: 'p', type: 'patent', title: 'P', date: '2024', status: '审查中', summary: '专利' },
    { id: 'bad-type', type: 'certificate', title: 'X', date: '2024', status: '无效', summary: '无效' },
    { id: 'missing-summary', type: 'article', title: 'X', date: '2024', status: '无效' },
    null
  ];

  assert.deepEqual(validAchievements(records).map(item => item.id), ['a', 'c', 'p']);
  assert.deepEqual(validAchievements(records, { featuredOnly: true }), []);
  records[0].featured = true;
  assert.deepEqual(validAchievements(records, { featuredOnly: true, limit: 1 }).map(item => item.id), ['a']);
});
