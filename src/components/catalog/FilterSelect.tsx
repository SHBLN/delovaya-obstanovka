import { useEffect, useRef, useState } from 'react'

export type FilterOption = { value: string; label: string }

export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const closeOnOutside = (event: globalThis.MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={`relative rounded-2xl border border-navy/8 bg-white/80 p-3 shadow-sm backdrop-blur-sm ${
        open ? 'z-30' : 'z-10'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-navy/50">{label}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="mt-2 flex w-full items-center justify-between gap-3 rounded-xl border border-navy/10 bg-[#fffdf9] px-3.5 py-2.5 text-left text-sm font-medium text-navy transition-soft hover:border-accent/40 hover:shadow-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 shrink-0 text-navy/45 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <path
            fill="currentColor"
            d="M5.3 7.7a1 1 0 0 1 1.4 0L10 11l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z"
          />
        </svg>
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-3 right-3 top-[calc(100%-4px)] z-40 max-h-60 overflow-y-auto rounded-xl border border-navy/10 bg-white p-1.5 shadow-hero"
        >
          {options.map((option) => {
            const isActive = option.value === value
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-soft ${
                    isActive
                      ? 'bg-accent/15 font-semibold text-navy'
                      : 'text-navy/75 hover:bg-[#f7f2ea] hover:text-navy'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
