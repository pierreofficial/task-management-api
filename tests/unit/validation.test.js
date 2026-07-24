const {
  isValidDueDate,
  isValidStatus,
  isValidPriority,
  isValidStatusTransition,
} = require('../../src/utils/validation');
const { buildTaskOrderBy } = require('../../src/utils/taskQuery');

describe('isValidDueDate', () => {
  test('returns true when due date is null', () => {
    expect(isValidDueDate(null)).toBe(true);
  });

  test('returns true when due date is undefined', () => {
    expect(isValidDueDate(undefined)).toBe(true);
  });

  test('returns true when due date is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isValidDueDate(today)).toBe(true);
  });

  test('returns true when due date is in the future', () => {
    expect(isValidDueDate('2030-01-01')).toBe(true);
  });

  test('returns false when due date is in the past', () => {
    expect(isValidDueDate('2020-01-01')).toBe(false);
  });
});

describe('isValidStatus / isValidPriority', () => {
  test('accepts valid statuses', () => {
    expect(isValidStatus('todo')).toBe(true);
    expect(isValidStatus('in_progress')).toBe(true);
    expect(isValidStatus('done')).toBe(true);
  });

  test('rejects invalid status', () => {
    expect(isValidStatus('cancelled')).toBe(false);
  });

  test('accepts valid priorities', () => {
    expect(isValidPriority('low')).toBe(true);
    expect(isValidPriority('medium')).toBe(true);
    expect(isValidPriority('high')).toBe(true);
  });

  test('rejects invalid priority', () => {
    expect(isValidPriority('urgent')).toBe(false);
  });
});

describe('isValidStatusTransition', () => {
  test('allows todo -> in_progress', () => {
    expect(isValidStatusTransition('todo', 'in_progress')).toBe(true);
  });

  test('allows done -> todo (reopening)', () => {
    expect(isValidStatusTransition('done', 'todo')).toBe(true);
  });

  test('rejects invalid status value', () => {
    expect(isValidStatusTransition('todo', 'cancelled')).toBe(false);
  });
});

describe('buildTaskOrderBy', () => {
  test('maps snake_case due_date to dueDate', () => {
    expect(buildTaskOrderBy({ sort_by: 'due_date', sort_order: 'asc' })).toEqual({
      dueDate: 'asc',
    });
  });

  test('maps snake_case created_at to createdAt', () => {
    expect(buildTaskOrderBy({ sort_by: 'created_at', sort_order: 'desc' })).toEqual({
      createdAt: 'desc',
    });
  });

  test('accepts camelCase sort fields', () => {
    expect(buildTaskOrderBy({ sort_by: 'dueDate', sort_order: 'asc' })).toEqual({
      dueDate: 'asc',
    });
  });

  test('defaults unknown sort_by to createdAt desc', () => {
    expect(buildTaskOrderBy({ sort_by: 'title' })).toEqual({ createdAt: 'desc' });
  });
});
