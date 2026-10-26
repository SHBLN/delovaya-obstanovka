const advantages = [
  {
    title: 'Низкие цены',
    text: 'Мы являемся первыми импортерами в РБ и поэтому не имеем заоблачных наценок.',
  },
  {
    title: 'Выгодные условия',
    text: 'Мы предлагаем выгодные условия рассрочки под 0%, забирайте сейчас, платите потом.',
  },
  {
    title: 'Доставка',
    text: 'Вы можете забрать кресло сами или оформить доставку у нашего менеджера.',
  },
  {
    title: 'Гарантия',
    text: 'Мы предоставляем 24 месяца гарантии согласно договору на все наши кресла.',
  },
]

export function AdvantagesSection() {
  return (
    <section id="delivery" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {advantages.map((advantage) => (
          <div key={advantage.title} className="rounded-3xl border border-navy/10 bg-white p-6 sm:p-8">
            <p className="chip">Преимущества</p>
            <h2 className="mt-4 text-3xl font-semibold text-navy">{advantage.title}</h2>
            <div className="mt-4 space-y-2 text-sm leading-relaxed text-navy/75 sm:text-base">
              <p>{advantage.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
