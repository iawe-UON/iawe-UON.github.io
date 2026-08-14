'use strict';

const achievementTypes = new Set(['article', 'copyright', 'patent']);
const requiredAchievementFields = ['id', 'type', 'title', 'date', 'status', 'summary'];

function isPresent(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isValidAchievement(item) {
  return Boolean(
    item &&
    achievementTypes.has(item.type) &&
    requiredAchievementFields.every(field => isPresent(item[field]))
  );
}

function validAchievements(items, options = {}) {
  const achievements = Array.isArray(items) ? items : [];
  const filtered = achievements.filter(item => (
    isValidAchievement(item) && (!options.featuredOnly || item.featured === true)
  ));
  return Number.isInteger(options.limit) ? filtered.slice(0, options.limit) : filtered;
}

module.exports = {
  isValidAchievement,
  validAchievements
};
