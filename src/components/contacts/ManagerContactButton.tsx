import { ContactMenu } from './ContactMenu'

// Кнопка «Позвонить менеджеру»: по нажатию раскрывает список способов связи.
export function ManagerContactButton({
  className,
  panelClassName,
  wrapperClassName = 'relative',
}: {
  className: string
  panelClassName: string
  wrapperClassName?: string
}) {
  return (
    <ContactMenu
      wrapperClassName={wrapperClassName}
      panelClassName={panelClassName}
      renderTrigger={({ open, toggle }) => (
        <button type="button" onClick={toggle} aria-expanded={open} className={className}>
          Позвонить менеджеру
        </button>
      )}
    />
  )
}
