import { EMAIL, EMAIL_LINK, messengers, PHONE_LINK } from '../../data/contacts'
import { MessengerIcon } from '../contacts/MessengerIcon'
import { PhoneLabel } from '../contacts/PhoneLabel'

export function ContactsSection() {
  return (
    <section id="contacts" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-5">
        <div className="rounded-3xl border border-navy/10 bg-white p-6 sm:p-8">
          <p className="chip">Контакты</p>
          <h2 className="mt-4 text-3xl font-semibold text-navy">Свяжитесь с нами</h2>
          <a href={PHONE_LINK} className="mt-4 block text-3xl font-bold text-navy sm:text-4xl">
            <PhoneLabel />
          </a>
          <ul className="mt-5 space-y-3 text-sm text-navy/80">
            {messengers.map((messenger) => (
              <li key={messenger.name}>
                <a
                  href={messenger.href}
                  target={messenger.href.startsWith('https') ? '_blank' : undefined}
                  rel="noreferrer"
                  aria-label={`Написать в ${messenger.name}`}
                  className="group inline-flex items-center gap-3 font-semibold text-navy transition-soft hover:text-accent"
                >
                  <MessengerIcon messenger={messenger} className="h-9 w-9 transition-soft group-hover:scale-105" />
                  <span className="w-20 text-navy/65">{messenger.name}</span>
                  <span>
                    <PhoneLabel />
                  </span>
                </a>
              </li>
            ))}
            <li>
              <a
                href={EMAIL_LINK}
                aria-label="Написать на электронную почту"
                className="group inline-flex items-center gap-3 font-semibold text-navy transition-soft hover:text-accent"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white transition-soft group-hover:scale-105">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <span className="w-20 text-navy/65">Почта</span>
                <span className="min-w-0 break-all">{EMAIL}</span>
              </a>
            </li>
          </ul>
          <p className="mt-4 text-base font-bold text-navy">График работы: ежедневно с 9:00 до 21:00, без выходных</p>
          <a
            href={PHONE_LINK}
            className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-button transition-soft hover:bg-accent-dark"
          >
            Позвонить
          </a>
        </div>
      </div>
    </section>
  )
}
