const SORT_FIELD_MAP = {
  due_date: 'dueDate',
  dueDate: 'dueDate',
  priority: 'priority',
  created_at: 'createdAt',
  createdAt: 'createdAt',
};

function buildTaskWhere({ status, priority, due_date_from, due_date_to, q }) {
  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;

  if (due_date_from || due_date_to) {
    where.dueDate = {};
    if (due_date_from) where.dueDate.gte = new Date(due_date_from);
    if (due_date_to) where.dueDate.lte = new Date(due_date_to);
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

function buildTaskOrderBy({ sort_by, sort_order }) {
  const field = SORT_FIELD_MAP[sort_by] || 'createdAt';
  const order = sort_order === 'asc' ? 'asc' : 'desc';

  return { [field]: order };
}

module.exports = { buildTaskWhere, buildTaskOrderBy, SORT_FIELD_MAP };
