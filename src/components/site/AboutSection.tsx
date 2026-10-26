export function AboutSection() {
  return (
    <section id="about" className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-2 md:items-center lg:px-8 lg:py-12">
      <img
        src="/products/about-atlant-chrome.jpg"
        alt="Кресло руководителя Атлант Хром в интерьере"
        className="h-[320px] w-full rounded-3xl object-cover shadow-card sm:h-[380px]"
        loading="lazy"
      />
      <div>
        <p className="chip">О магазине</p>
        <h2 className="mt-4 text-3xl font-semibold text-navy">Подбираем мебель, которая служит годами</h2>
        <p className="mt-4 text-base leading-relaxed text-navy/75">
          ООО «Деловая обстановка». Мы являемся крупнейшим поставщиком офисных кресел и стульев, а также
          комплектующих из Китая и России. Компания «Деловая обстановка» является преемником и продолжателем
          некогда известной компании «Юратэ» с более чем 20-летним стажем импорта и реализации офисной мебели
          в Беларуси. На нашем складе более 500 видов кресел, и наш ассортимент ежемесячно пополняется.
        </p>
      </div>
    </section>
  )
}
