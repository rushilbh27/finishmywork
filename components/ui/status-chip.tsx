import { cn } from '@/lib/utils'

type StatusType = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | string

const styles: Record<string, string> = {
  OPEN: 'text-[color:var(--status-open-fg)] bg-[color:var(--status-open-bg)] border-[color:var(--status-open-border)]',
  IN_PROGRESS:
    'text-[color:var(--status-progress-fg)] bg-[color:var(--status-progress-bg)] border-[color:var(--status-progress-border)]',
  COMPLETED:
    'text-[color:var(--status-complete-fg)] bg-[color:var(--status-complete-bg)] border-[color:var(--status-complete-border)]',
}

interface StatusChipProps {
  status: string
  size?: 'sm' | 'default'
}

export function StatusChip({ status, size = 'default' }: StatusChipProps) {
  const normalized = (status ?? '').toUpperCase()
  const style =
    styles[normalized] ??
    'text-foreground/80 bg-surface/60 border-border/60'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs',
        style
      )}
    >
      {normalized || status}
    </span>
  )
}
