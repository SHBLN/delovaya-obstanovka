import { PHONE_ICON_PATH } from '../../data/contacts'
import { ContactMenu } from './ContactMenu'
import { ManagerContactButton } from './ManagerContactButton'

// Закреплённые элементы связи: круглая кнопка на компьютере и нижняя панель на телефоне.
export function FloatingContact() {
  return (
    <>
      <ContactMenu
        wrapperClassName="fixed bottom-5 right-5 z-[110] hidden sm:block"
        panelClassName="bottom-full right-0 mb-3"
        renderTrigger={({ open, toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label="Связаться с менеджером"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-button transition-soft hover:bg-accent-dark"
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden>
                <path d={PHONE_ICON_PATH} />
              </svg>
            )}
          </button>
        )}
      />

      <div data-testid="mobile-contact-bar" className="fixed inset-x-0 bottom-0 z-[110] border-t border-navy/15 bg-[#f7f2ea]/95 p-3 backdrop-blur sm:hidden">
        <ManagerContactButton
          panelClassName="bottom-full right-0 mb-3"
          className="flex w-full items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-button"
        />
      </div>
    </>
  )
}
