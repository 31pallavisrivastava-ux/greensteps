interface BlockOptionProps {
  selected?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  compact?: boolean
}

export function BlockOption({
  selected,
  onClick,
  children,
  className = '',
  compact,
}: BlockOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected ?? false}
      onClick={onClick}
      className={`block-option ${selected ? 'block-option-selected' : ''} ${
        compact ? 'block-option-compact' : ''
      } ${className}`}
    >
      {children}
    </button>
  )
}

export function BlockSection({
  label,
  labelId,
  children,
}: {
  label: string
  labelId?: string
  children: React.ReactNode
}) {
  const id = labelId ?? `section-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <section className="space-y-2" aria-labelledby={id}>
      <p id={id} className="block-label">
        {label}
      </p>
      {children}
    </section>
  )
}

export function BlockGrid({
  children,
  labelledBy,
}: {
  children: React.ReactNode
  labelledBy?: string
}) {
  return (
    <div className="block-grid" role="radiogroup" aria-labelledby={labelledBy}>
      {children}
    </div>
  )
}
