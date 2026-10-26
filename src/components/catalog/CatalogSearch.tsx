export function CatalogSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="mb-3 rounded-2xl border border-navy/8 bg-white/80 p-3 shadow-sm backdrop-blur-sm sm:mb-4">
      <label htmlFor="catalog-search" className="text-xs font-semibold uppercase tracking-[0.1em] text-navy/50">
        Поиск по названию
      </label>
      <div className="relative mt-2">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/45"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="catalog-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Например: Атлант, Samurai, Метта"
          autoComplete="off"
          className="w-full rounded-xl border border-navy/10 bg-[#fffdf9] py-2.5 pl-10 pr-10 text-sm font-medium text-navy placeholder:font-normal placeholder:text-navy/40 transition-soft hover:border-accent/40 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25 [&::-webkit-search-cancel-button]:hidden"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Очистить поиск"
            className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-navy/50 transition-soft hover:bg-navy/10 hover:text-navy"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  )
}
