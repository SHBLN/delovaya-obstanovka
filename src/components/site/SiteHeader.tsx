import { useState } from 'react'
import { PHONE_LINK } from '../../data/contacts'
import { navLinks } from '../../data/navigation'
import { createAnchorClickHandler } from '../../lib/scroll'
import { ManagerContactButton } from '../contacts/ManagerContactButton'
import { MessengerLinks } from '../contacts/MessengerLinks'
import { PhoneLabel } from '../contacts/PhoneLabel'

const sectionLinkClass = 'text-sm font-medium text-navy/70 transition-soft hover:text-navy'

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const handleAnchorClick = createAnchorClickHandler(() => setMobileMenuOpen(false))

  return (
    <header
      onClick={handleAnchorClick}
      className="sticky top-0 z-50 border-b border-[#d8cebf]/70 bg-[#f7f2ea]/95 backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <a href="#hero" className="flex items-center">
            <img
              src="/logo-delovaya-obstanovka-v2.png"
              alt="Логотип Деловая обстановка"
              className="h-14 w-auto object-contain sm:h-[72px] md:h-20"
              width={791}
              height={240}
            />
          </a>

          <div className="hidden items-center gap-4 md:flex">
            <a href={PHONE_LINK} className="text-sm font-semibold text-navy">
              <PhoneLabel />
            </a>
            <ManagerContactButton
              panelClassName="right-0 top-full mt-3"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-soft hover:bg-accent-dark"
            />
          </div>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy md:hidden"
          >
            Меню
          </button>
        </div>

        <nav className="mt-3 hidden items-center justify-center gap-8 border-t border-[#d8cebf]/70 pt-3 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className={sectionLinkClass}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      {mobileMenuOpen ? (
        <div id="mobile-menu" className="border-t border-[#d8cebf]/70 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className={sectionLinkClass}>
                {link.label}
              </a>
            ))}
            <a href={PHONE_LINK} className="pt-2 text-sm font-semibold text-navy">
              <PhoneLabel />
            </a>
            <MessengerLinks className="gap-3" iconClassName="h-10 w-10" />
            <a
              href={PHONE_LINK}
              className="mt-1 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white"
            >
              Позвонить менеджеру
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
