import { expect, test } from '@playwright/test'
import { cardsLocator, collectProblems, foundCount, openCatalog, readCards } from './helpers'

test.describe('Каталог: целостность данных', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('счётчик «Найдено моделей» совпадает с числом карточек', async ({ page }) => {
    const cards = await cardsLocator(page).count()
    expect(cards).toBeGreaterThan(0)
    expect(await foundCount(page)).toBe(cards)
  })

  test('у каждой карточки есть название, артикул, категория, цена > 0, материалы и цвета', async ({ page }) => {
    const cards = await readCards(page)
    for (const card of cards) {
      const label = `${card.sku} / ${card.name}`
      expect(card.name, label).not.toBe('')
      expect(card.sku, label).not.toBe('')
      expect(card.category, label).not.toBe('')
      expect(Number.isFinite(card.price) && card.price > 0, `цена: ${label}`).toBe(true)
      expect(card.materials.length, `материалы: ${label}`).toBeGreaterThan(0)
      expect(card.colors.length, `цвета: ${label}`).toBeGreaterThan(0)
    }
  })

  test('цены в разумных пределах (защита от опечаток вроде 98 вместо 989 или 9890)', async ({ page }) => {
    const cards = await readCards(page)
    for (const card of cards) {
      expect(card.price, `${card.sku} / ${card.name}`).toBeGreaterThanOrEqual(50)
      expect(card.price, `${card.sku} / ${card.name}`).toBeLessThanOrEqual(3000)
    }
  })

  test('артикулы уникальны, а категории принадлежат известному списку', async ({ page }) => {
    const cards = await readCards(page)
    const skus = cards.map((card) => card.sku)
    expect(new Set(skus).size, 'есть дубликаты артикулов').toBe(skus.length)
    const known = new Set(['Офисные кресла', 'Геймерские кресла', 'Кресла руководителя', 'Кухонные стулья'])
    for (const card of cards) expect(known.has(card.category), `${card.sku}: ${card.category}`).toBe(true)
  })

  test('на странице нет технического мусора: NaN, undefined, null, [object Object]', async ({ page }) => {
    const text = await page.locator('body').innerText()
    expect(text).not.toContain('NaN')
    expect(text).not.toContain('undefined')
    expect(text).not.toContain('[object Object]')
    expect(text).not.toMatch(/\bnull\b/)
  })

  test('в карточках каталога нет пункта «Гарантия» (он показывается только в «Подробнее»)', async ({ page }) => {
    const text = (await cardsLocator(page).allInnerTexts()).join('\n')
    expect(text).not.toMatch(/Гарантия/i)
  })

  test('в карточках нет слова «ткань» (везде заменено на «Текстиль») и нет одиночной «Сетка»', async ({ page }) => {
    const cards = await readCards(page)
    for (const card of cards) {
      for (const material of card.materials) {
        expect(material, `${card.sku}`).not.toMatch(/ткан/i)
        expect(material, `${card.sku}`).not.toMatch(/^сетка\b/i)
      }
    }
  })

  test('все фотографии товаров реально загружаются (нет битых картинок)', async ({ page }) => {
    test.setTimeout(180_000)
    const total = await cardsLocator(page).count()
    const broken: string[] = []
    for (let i = 0; i < total; i++) {
      const image = cardsLocator(page).nth(i).getByRole('img')
      await image.scrollIntoViewIfNeeded()
      const loaded = await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 8_000 })
        .toBe(true)
        .then(
          () => true,
          () => false,
        )
      if (!loaded) broken.push(await image.getAttribute('src').then((src) => src ?? `card #${i}`))
    }
    expect(broken, `не загрузились: ${broken.join(', ')}`).toEqual([])
  })

  test('при полной прокрутке страницы нет ошибок консоли и ответов 4xx/5xx', async ({ page }) => {
    const problems = collectProblems(page)
    await page.reload()
    await expect(page.getByRole('article').first()).toBeVisible()
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y <= height; y += 700) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForLoadState('networkidle')
    }
    // Шрифты Google недоступны в изолированной среде — это не ошибка приложения.
    const own = problems.filter((entry) => !/fonts\.(googleapis|gstatic)\.com/.test(entry) && !/ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|BLOCKED)/.test(entry))
    expect(own).toEqual([])
  })
})
