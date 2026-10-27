import { expect, type Locator, type Page } from '@playwright/test'

export const PHONE_DIGITS = '375445420007'
export const EMAIL = 'delovaya-obstanovka@yandex.by'

export const CATEGORIES = ['Офисные кресла', 'Геймерские кресла', 'Кресла руководителя', 'Кухонные стулья'] as const

export type CardInfo = {
  sku: string
  name: string
  category: string
  price: number
  materials: string[]
  colors: string[]
}

export async function openCatalog(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('article').first()).toBeVisible()
}

export const cardsLocator = (page: Page) => page.getByRole('article')

/** Читает карточки так, как их видит пользователь (по тексту), без привязки к CSS-классам. */
export async function readCards(page: Page): Promise<CardInfo[]> {
  return cardsLocator(page).evaluateAll((cards) =>
    cards.map((card) => {
      const lines = (card as HTMLElement).innerText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const priceIndex = lines.findIndex((line) => line.startsWith('белорусских рублей'))
      const materialsLine = lines.find((line) => line.startsWith('Материалы:')) ?? ''
      const colorsLine = lines.find((line) => line.startsWith('Цвета:')) ?? ''
      const split = (line: string, prefix: string) =>
        line
          .slice(prefix.length)
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
      return {
        sku: lines[0] ?? '',
        name: lines[1] ?? '',
        category: lines[2] ?? '',
        price: Number((lines[priceIndex - 1] ?? '').replace(/\D/g, '')),
        materials: split(materialsLine, 'Материалы:'),
        colors: split(colorsLine, 'Цвета:'),
      }
    }),
  )
}

export async function foundCount(page: Page): Promise<number> {
  const text = (await page.getByText(/Найдено моделей:/).innerText()) ?? ''
  return Number(text.replace(/\D/g, ''))
}

/** Дожидается, пока счётчик и число карточек совпадут с ожидаемым. */
export async function expectResultCount(page: Page, expected: number) {
  await expect(page.getByText(/Найдено моделей:/)).toHaveText(`Найдено моделей: ${expected}`)
  await expect(cardsLocator(page)).toHaveCount(expected)
}

export const searchInput = (page: Page) => page.getByLabel('Поиск по названию')

export async function search(page: Page, query: string) {
  await searchInput(page).fill(query)
}

export const filterTrigger = (page: Page, label: 'Цена' | 'Материал' | 'Цвет'): Locator =>
  page.getByText(label, { exact: true }).locator('xpath=following-sibling::button')

export async function chooseFilter(page: Page, label: 'Цена' | 'Материал' | 'Цвет', option: string) {
  await filterTrigger(page, label).click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(filterTrigger(page, label)).toContainText(option)
}

export async function filterOptions(page: Page, label: 'Цена' | 'Материал' | 'Цвет'): Promise<string[]> {
  await filterTrigger(page, label).click()
  const options = await page.getByRole('option').allInnerTexts()
  await filterTrigger(page, label).click()
  await expect(page.getByRole('option')).toHaveCount(0)
  return options.map((option) => option.trim())
}

export const categoryChip = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

export const modal = (page: Page) => page.getByTestId('product-modal')

export async function openModalFor(page: Page, index = 0) {
  await cardsLocator(page).nth(index).getByRole('button', { name: 'Подробнее' }).click()
  await expect(modal(page)).toBeVisible()
}

/** Ждёт, пока прокрутка остановится (ленивые картинки меняют высоту страницы по пути). */
export async function waitForScrollSettled(page: Page) {
  await page.waitForLoadState('networkidle')
  let last = -1
  let stable = 0
  await expect
    .poll(
      async () => {
        const y = await page.evaluate(() => window.scrollY)
        stable = y === last ? stable + 1 : 0
        last = y
        return stable
      },
      { intervals: [100], timeout: 15_000 },
    )
    .toBeGreaterThanOrEqual(5)
}

export async function sectionGeometry(page: Page, id: string) {
  return page.evaluate((sectionId) => {
    const header = document.querySelector('header')!.getBoundingClientRect()
    const section = document.getElementById(sectionId)!
    const heading = section.querySelector('h1, h2')
    const atPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
    return {
      headerBottom: header.bottom,
      sectionTop: section.getBoundingClientRect().top,
      headingTop: heading ? heading.getBoundingClientRect().top : null,
      atPageBottom,
    }
  }, id)
}

/** Подавляет реальный переход по tel:/mailto:/tg://, не мешая обработчикам приложения. */
export async function blockExternalNavigation(page: Page) {
  await page.evaluate(() => {
    document.addEventListener(
      'click',
      (event) => {
        const link = (event.target as HTMLElement).closest('a')
        const href = link?.getAttribute('href') ?? ''
        if (link && !href.startsWith('#')) event.preventDefault()
      },
      true,
    )
  })
}

export function collectProblems(page: Page) {
  const problems: string[] = []
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error: ${message.text()}`)
  })
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`)
  })
  page.on('requestfailed', (request) => problems.push(`requestfailed: ${request.url()}`))
  return problems
}
