import { toLocalDateString } from "./date";

const REVIEW_INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
};

function addDays(baseDate, daysToAdd) {
  const date = baseDate instanceof Date ? new Date(baseDate) : new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

export function getNextReviewDate(level) {
  if (!level || level <= 0) {
    return null;
  }

  const normalizedLevel = Math.min(level, 4);
  return toLocalDateString(addDays(new Date(), REVIEW_INTERVALS[normalizedLevel]));
}

export function isDueForReview(nextReviewDate) {
  if (!nextReviewDate) {
    return true;
  }

  return nextReviewDate <= toLocalDateString();
}

export function getNewLevel(currentLevel = 0, remembered = true) {
  if (!remembered) {
    return 1;
  }

  return Math.min((currentLevel ?? 0) + 1, 4);
}
