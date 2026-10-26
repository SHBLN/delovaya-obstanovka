import { Link } from 'react-router-dom'
import { EMAIL, EMAIL_LINK, messengers, PHONE_LINK } from '../../data/contacts'
import { navLinks } from '../../data/navigation'
import { createAnchorClickHandler } from '../../lib/scroll'
import { MessengerIcon } from '../contacts/MessengerIcon'
import { PhoneLabel } from '../contacts/PhoneLabel'

export function SiteFooter() {
  return (
    <footer onClick={createAnchorClickHandler()} className="border-t border-[#d8cebf]/70 bg-[#f2e8d9] pb-20 sm:pb-0">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="text-lg font-bold text-navy">ООО «Деловая обстановка»</p>
          <p className="mt-2 text-sm text-navy/70">Современная мебель для дома и офиса с акцентом на комфорт.</p>
        </div>
        <div className="space-y-2 text-sm">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="block text-navy/75 hover:text-navy">
              {link.label}
            </a>
          ))}
        </div>
        <div className="space-y-2 text-sm text-navy/75">
          <a href={PHONE_LINK} className="block font-semibold text-navy">
            <PhoneLabel />
          </a>
          <a href={EMAIL_LINK} className="block break-all hover:text-navy">
            {EMAIL}
          </a>
          <p>Ежедневно с 9:00 до 21:00, без выходных</p>
        </div>
        <div className="space-y-2 text-sm text-navy/75">
          <Link to="/privacy" className="block hover:text-navy">
            Политика конфиденциальности
          </Link>
          {messengers.map((messenger) => (
            <a
              key={messenger.name}
              href={messenger.href}
              target={messenger.href.startsWith('https') ? '_blank' : undefined}
              rel="noreferrer"
              className="flex items-center gap-2 hover:text-navy"
            >
              <MessengerIcon messenger={messenger} className="h-6 w-6 rounded-lg" />
              {messenger.name}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
