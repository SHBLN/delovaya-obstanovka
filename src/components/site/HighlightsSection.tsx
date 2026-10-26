const highlights = [
  'Большой выбор моделей',
  'Помощь с подбором',
  'Доставка по Минску',
  'Доставка Европочтой',
  'Доставка СДЭК',
  'Гарантия качества',
]

export function HighlightsSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
      {highlights.map((item) => (
        <div key={item} className="rounded-2xl border border-navy/10 bg-white p-4 text-sm font-semibold text-navy/80">
          {item}
        </div>
      ))}
    </section>
  )
}
