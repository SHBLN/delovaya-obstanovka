import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PHONE_LINK, messengers, PHONE_ICON_PATH } from '../../data/contacts'
import { MessengerIcon } from './MessengerIcon'

// Кнопка, по нажатию на которую раскрывается список способов связи (мессенджеры + звонок).
export function ContactMenu({
  wrapperClassName,
  panelClassName,
  renderTrigger,
}: {
  wrapperClassName: string
  panelClassName: string
  renderTrigger: (state: { open: boolean; toggle: () => void }) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const itemClass =
    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-navy transition-soft hover:bg-accent/10'

  return (
    <div ref={wrapperRef} className={wrapperClassName}>
      {renderTrigger({ open, toggle: () => setOpen((prev) => !prev) })}
      {open ? (
        <div data-testid="contact-menu" className={`absolute z-[120] w-64 rounded-2xl border border-navy/10 bg-white p-2 shadow-xl ${panelClassName}`}>
          {messengers.map((messenger) => (
            <a
              key={messenger.name}
              href={messenger.href}
              target={messenger.href.startsWith('https') ? '_blank' : undefined}
              rel="noreferrer"
              className={itemClass}
              onClick={() => setOpen(false)}
            >
              <MessengerIcon messenger={messenger} className="h-9 w-9" />
              Написать в {messenger.name}
            </a>
          ))}
          <a href={PHONE_LINK} className={itemClass} onClick={() => setOpen(false)}>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-[55%] w-[55%] fill-white">
                <path d={PHONE_ICON_PATH} />
              </svg>
            </span>
            Позвонить
          </a>
        </div>
      ) : null}
    </div>
  )
}
