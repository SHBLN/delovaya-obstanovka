import { messengers } from '../../data/contacts'
import { MessengerIcon } from './MessengerIcon'

// Ряд кликабельных значков мессенджеров (открывают диалог сразу).
export function MessengerLinks({
  className = '',
  iconClassName = 'h-9 w-9',
  withLabels = false,
}: {
  className?: string
  iconClassName?: string
  withLabels?: boolean
}) {
  return (
    <div className={`flex items-center ${className}`}>
      {messengers.map((messenger) => (
        <a
          key={messenger.name}
          href={messenger.href}
          target={messenger.href.startsWith('https') ? '_blank' : undefined}
          rel="noreferrer"
          aria-label={`Написать в ${messenger.name}`}
          title={messenger.name}
          className={
            withLabels
              ? 'group inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white py-1.5 pl-1.5 pr-3 text-sm font-semibold text-navy transition-soft hover:border-accent/40 hover:text-accent'
              : 'transition-soft hover:scale-110'
          }
        >
          <MessengerIcon messenger={messenger} className={iconClassName} />
          {withLabels ? <span>{messenger.name}</span> : null}
        </a>
      ))}
    </div>
  )
}
