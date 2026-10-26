import { Link } from 'react-router-dom'
import { EMAIL, EMAIL_LINK, PHONE_LINK } from '../data/contacts'
import { PhoneLabel } from '../components/contacts/PhoneLabel'

export function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f2ea] px-4 py-10 text-[#35322e] sm:px-6">
      <article className="mx-auto max-w-3xl rounded-3xl border border-navy/10 bg-white p-6 sm:p-10">
        <Link to="/" className="text-sm font-semibold text-accent hover:text-accent-dark">
          ← Вернуться в каталог
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-navy sm:text-4xl">Политика конфиденциальности</h1>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-navy/80">
          <p>
            Сайт «Деловая обстановка» является каталогом мебели. На нём нет форм регистрации, личного кабинета и онлайн-оплаты, поэтому сайт
            сам не собирает и не хранит ваши персональные данные.
          </p>
          <h2 className="pt-2 text-xl font-semibold text-navy">Какие данные мы получаем</h2>
          <p>
            Данные попадают к нам только тогда, когда вы сами связываетесь с менеджером: звоните, пишете в Telegram или WhatsApp либо отправляете
            письмо на электронную почту. Это номер телефона или имя аккаунта и то, что вы сообщили в сообщении.
          </p>
          <h2 className="pt-2 text-xl font-semibold text-navy">Как мы их используем</h2>
          <p>
            Только для ответа на ваш вопрос, уточнения наличия товара и оформления заказа. Мы не передаём эти данные третьим лицам, кроме случаев,
            предусмотренных законодательством.
          </p>
          <h2 className="pt-2 text-xl font-semibold text-navy">Сторонние сервисы</h2>
          <p>
            Для отображения шрифтов страница обращается к сервису Google Fonts, а мессенджеры работают по правилам своих владельцев (Telegram,
            WhatsApp).
          </p>
          <h2 className="pt-2 text-xl font-semibold text-navy">Как удалить свои данные</h2>
          <p>
            Напишите нам или позвоните — мы удалим вашу переписку и контактные данные из наших рабочих записей.
          </p>
          <p className="font-semibold text-navy">
            Контакты:{' '}
            <a href={PHONE_LINK} className="hover:text-accent">
              <PhoneLabel />
            </a>
            ,{' '}
            <a href={EMAIL_LINK} className="hover:text-accent">
              {EMAIL}
            </a>
          </p>
        </div>
      </article>
    </main>
  )
}
