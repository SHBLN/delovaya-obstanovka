import { type Messenger } from '../../data/contacts'

export function MessengerIcon({ messenger, className = 'h-8 w-8' }: { messenger: Messenger; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{ backgroundColor: messenger.color }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%] fill-white">
        <path d={messenger.path} />
      </svg>
    </span>
  )
}
