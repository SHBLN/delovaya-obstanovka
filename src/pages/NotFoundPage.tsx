import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f2ea] px-4 text-center text-[#35322e]">
      <p className="chip">Ошибка 404</p>
      <h1 className="mt-4 text-3xl font-semibold text-navy sm:text-4xl">Страница не найдена</h1>
      <p className="mt-3 max-w-md text-base text-navy/70">
        Возможно, ссылка устарела или в адресе опечатка. Перейдите в каталог — там все кресла и стулья «Деловой обстановки».
      </p>
      <Link
        to="/"
        className="mt-7 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-soft hover:bg-navy-light"
      >
        Вернуться в каталог
      </Link>
    </main>
  )
}
