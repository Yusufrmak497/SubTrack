export const CATEGORY_COLORS = {
  Cloud: '#3b82f6',
  Education: '#10b981',
  Entertainment: '#f59e0b',
  Music: '#ef4444',
  Productivity: '#8b5cf6',
}

export const DEFAULT_CATEGORY_COLOR = '#94a3b8'

export function getCategoryColor(category) {
  if (!category) {
    return DEFAULT_CATEGORY_COLOR
  }

  return CATEGORY_COLORS[category] ?? DEFAULT_CATEGORY_COLOR
}
