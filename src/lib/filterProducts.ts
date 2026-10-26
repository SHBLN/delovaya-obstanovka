import { ALL_COLORS, ALL_MATERIALS, type Category, type Product } from '../data/products'

export type PriceSort = 'default' | 'asc' | 'desc'

export type ProductFilters = {
  category: Category
  material: string
  color: string
  query: string
  priceSort: PriceSort
}

const normalize = (text: string) => text.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()

// Названия Metta/Samurai можно искать и по-русски, и по-латински — независимо от того, как они записаны в каталоге.
const toRussian = (text: string) => text.replace(/Metta/gi, 'Метта').replace(/Samurai/gi, 'Самурай')
const toLatin = (text: string) => text.replace(/Метта/gi, 'Metta').replace(/Самурай/gi, 'Samurai')

const searchableText = (product: Product) =>
  normalize(`${product.name} ${product.sku} ${toRussian(product.name)} ${toLatin(product.name)}`)

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = normalize(filters.query)

  const filtered = products.filter((product) => {
    const categoryMatch = filters.category === 'Все' || product.category === filters.category
    const materialMatch = filters.material === ALL_MATERIALS || product.materials.includes(filters.material)
    const colorMatch = filters.color === ALL_COLORS || product.colors.includes(filters.color)
    const searchMatch = query === '' || query.split(' ').every((word) => searchableText(product).includes(word))
    return categoryMatch && materialMatch && colorMatch && searchMatch
  })

  if (filters.priceSort === 'asc') {
    return [...filtered].sort((a, b) => a.price - b.price)
  }
  if (filters.priceSort === 'desc') {
    return [...filtered].sort((a, b) => b.price - a.price)
  }
  return filtered
}
