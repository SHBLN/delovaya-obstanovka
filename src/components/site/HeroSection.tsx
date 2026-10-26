import { ManagerContactButton } from '../contacts/ManagerContactButton'

export function HeroSection() {
  return (
    <section id="hero" className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:items-center lg:px-8 lg:py-16">
      <div className="motion-fade-in">
        <h1 className="text-4xl font-semibold leading-tight text-navy sm:text-5xl">
          Кресла и стулья для дома и офиса
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-navy/75 sm:text-lg">
          Подберём кресло под Ваш интерьер и задачи: от классических моделей до игровых кресел. Поможем с выбором
          цвета и комплектующих.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition-soft hover:bg-navy-light"
          >
            Смотреть каталог
          </a>
          <ManagerContactButton
            panelClassName="left-0 top-full mt-3"
            className="rounded-full border border-navy/20 bg-white px-6 py-3 text-sm font-semibold text-navy transition-soft hover:border-navy/40"
          />
        </div>
      </div>
      <div className="motion-scale-in">
        <img
          src="/hero-chair-photo-square.jpg"
          alt="Игровое кресло у рабочего стола в домашнем кабинете"
          className="aspect-square w-full rounded-3xl object-cover shadow-hero"
        />
      </div>
    </section>
  )
}
