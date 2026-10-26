import type { Product } from '../../data/products'
import { PriceInByn } from '../PriceInByn'

export function ProductCard({ product, onOpen }: { product: Product; onOpen: (product: Product) => void }) {
  return (
    <article className="group hover-lift rounded-3xl border border-navy/10 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:gap-6">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-2xl border border-navy/8 bg-gradient-to-b from-white via-[#fffdf9] to-[#f0e8dc] p-3 sm:aspect-auto sm:w-[min(100%,320px)] sm:min-h-[240px] md:w-[360px] md:min-h-[260px]">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-contain transition-soft group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-navy/50">{product.sku}</p>
              <h3 className="mt-1 text-lg font-semibold text-navy sm:text-xl">{product.name}</h3>
            </div>
            <span className="shrink-0 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-navy/70">
              {product.category}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-navy/70 sm:text-base">{product.shortDescription}</p>
          <p className="mt-3 text-sm text-navy/70">
            Материалы: <span className="font-medium">{product.materials.join(', ')}</span>
          </p>
          <p className="mt-1 text-sm text-navy/70">
            Цвета: <span className="font-medium">{product.colors.join(', ')}</span>
          </p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
            <PriceInByn price={product.price} className="text-xl font-bold text-navy sm:text-2xl" />
            <button
              type="button"
              onClick={() => onOpen(product)}
              className="rounded-full border border-navy/20 px-4 py-2 text-sm font-semibold text-navy transition-soft hover:border-navy/40 hover:bg-surface"
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
