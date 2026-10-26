import { useMemo, useState } from 'react'
import {
  ALL_COLORS,
  ALL_MATERIALS,
  categories,
  colorOptions,
  materialOptions,
  products,
  type Category,
  type Product,
} from '../../data/products'
import { filterProducts, type PriceSort } from '../../lib/filterProducts'
import { CatalogSearch } from './CatalogSearch'
import { FilterSelect } from './FilterSelect'
import { ProductCard } from './ProductCard'
import { ProductModal } from './ProductModal'

const priceSortOptions = [
  { value: 'default', label: 'По умолчанию' },
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' },
]

const materialSelectOptions = materialOptions.map((option) => ({ value: option, label: option }))
const colorSelectOptions = colorOptions.map((option) => ({ value: option, label: option }))

export function CatalogSection() {
  const [activeCategory, setActiveCategory] = useState<Category>('Все')
  const [priceSort, setPriceSort] = useState<PriceSort>('default')
  const [materialFilter, setMaterialFilter] = useState(ALL_MATERIALS)
  const [colorFilter, setColorFilter] = useState(ALL_COLORS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        category: activeCategory,
        material: materialFilter,
        color: colorFilter,
        query: searchQuery,
        priceSort,
      }),
    [activeCategory, priceSort, materialFilter, colorFilter, searchQuery],
  )

  return (
    <section id="catalog" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="chip">Каталог</p>
          <h2 className="mt-3 text-3xl font-semibold text-navy sm:text-4xl">Выберите подходящую модель</h2>
        </div>
        <p className="text-sm text-navy/65">Найдено моделей: {filteredProducts.length}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={activeCategory === category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-soft ${
              activeCategory === category
                ? 'bg-navy text-white shadow-card'
                : 'border border-navy/15 bg-white text-navy/75 hover:border-navy/35'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-[#d8cebf]/70 bg-gradient-to-br from-white via-[#fffdf9] to-[#f3ebe0] p-4 shadow-card sm:p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="h-7 w-1 rounded-full bg-accent" aria-hidden />
          <p className="text-sm font-semibold text-navy">Сортировка и фильтры</p>
        </div>
        <CatalogSearch value={searchQuery} onChange={setSearchQuery} />
        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          <FilterSelect
            label="Цена"
            value={priceSort}
            onChange={(next) => setPriceSort(next as PriceSort)}
            options={priceSortOptions}
          />
          <FilterSelect label="Материал" value={materialFilter} onChange={setMaterialFilter} options={materialSelectOptions} />
          <FilterSelect label="Цвет" value={colorFilter} onChange={setColorFilter} options={colorSelectOptions} />
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-5">
        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-navy/10 bg-white p-8 text-center shadow-card">
            <p className="text-lg font-semibold text-navy">Ничего не найдено</p>
            <p className="mt-2 text-sm text-navy/65">Попробуйте изменить запрос или сбросить фильтры.</p>
          </div>
        ) : null}
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={setSelectedProduct} />
        ))}
      </div>

      {selectedProduct ? <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} /> : null}
    </section>
  )
}
