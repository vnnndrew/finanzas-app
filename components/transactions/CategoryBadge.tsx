import { CATEGORY_CONFIG } from '@/types'
import type { Category } from '@/types'

export function CategoryBadge({ category }: { category: Category }) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.otro
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontFamily: 'var(--font-syne)',
      fontWeight: 500,
      background: config.color + '18',
      color: config.color,
      border: `1px solid ${config.color}30`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: '10px' }}>{config.icon}</span>
      {config.label}
    </span>
  )
}
