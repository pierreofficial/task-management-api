const VALID_STATUSES = ['todo', 'in_progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

function isValidDueDate(dueDate) {
  if (!dueDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) >= today;
}

function isValidStatus(status) {
  return VALID_STATUSES.includes(status);
}

function isValidPriority(priority) {
  return VALID_PRIORITIES.includes(priority);
}

function isValidStatusTransition(oldStatus, newStatus) {
  return isValidStatus(newStatus);
}

module.exports = {
  VALID_STATUSES,
  VALID_PRIORITIES,
  isValidDueDate,
  isValidStatus,
  isValidPriority,
  isValidStatusTransition,
};
