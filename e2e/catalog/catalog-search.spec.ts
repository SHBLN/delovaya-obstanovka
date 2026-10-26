import { expect, test } from '@playwright/test'
import {
  categoryChip,
  cardsLocator,
  chooseFilter,
  expectResultCount,
  foundCount,
  openCatalog,
  readCards,
  search,
  searchInput,
} from './helpers'

test.describe('Поиск по названию', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('находит товары по части названия без учёта регистра, все результаты содержат запрос', async ({ page }) => {
    for (const query of ['атлант', 'АТЛАНТ', 'АтЛаНт']) {
      await search(page, query)
      const cards = await readCards(page)
      expect(cards.length, query).toBeGreaterThan(1)
      for (const card of cards) expect(card.name.toLowerCase(), query).toContain('атлант')
    }
  })

  test('результат поиска не теряет товары: число совпадений равно числу карточек с этим словом в полном списке', async ({ page }) => {
    const expected = (await readCards(page)).filter((card) => `${card.name} ${card.sku}`.toLowerCase().includes('хром')).length
    await search(page, 'хром')
    await expectResultCount(page, expected)
  })

  test('несколько слов: порядок слов не важен, лишние пробелы игнорируются', async ({ page }) => {
    await search(page, 'атлант хром')
    const direct = (await readCards(page)).map((card) => card.sku).sort()
    expect(direct.length).toBeGreaterThan(0)

    await search(page, '   хром     атлант  ')
    expect((await readCards(page)).map((card) => card.sku).sort()).toEqual(direct)
  })

  test('поиск по артикулу', async ({ page }) => {
    const [first] = await readCards(page)
    await search(page, first.sku)
    const cards = await readCards(page)
    expect(cards.map((card) => card.sku)).toContain(first.sku)
  })

  test('латинские названия находятся по-русски и по-латыни одинаково (Metta / Метта, Samurai / Самурай)', async ({ page }) => {
    await search(page, 'самурай')
    const ru = (await readCards(page)).map((card) => card.sku).sort()
    await search(page, 'samurai')
    const lat = (await readCards(page)).map((card) => card.sku).sort()
    expect(ru.length).toBeGreaterThan(0)
    expect(lat).toEqual(ru)
  })

  test('[BUG?] «metta» и «метта» находят один и тот же набор товаров Metta/Метта', async ({ page }) => {
    await search(page, 'метта')
    const ru = (await readCards(page)).map((card) => card.sku).sort()
    await search(page, 'metta')
    const lat = (await readCards(page)).map((card) => card.sku).sort()
    expect(ru.length).toBeGreaterThan(0)
    expect(lat, 'по латинскому написанию пропадают товары, названные по-русски').toEqual(ru)
  })

  test('точечные и дефисные запросы работают: «s-3.04», «su-bk130»', async ({ page }) => {
    await search(page, 's-3.04')
    expect((await readCards(page)).map((card) => card.name)).toEqual(['Metta Samurai S-3.04'])
    await search(page, 'su-bk130')
    expect((await readCards(page)).map((card) => card.name)).toEqual(['Метта SU-BK130-8'])
  })

  test('пустой и состоящий из пробелов запрос показывают все товары, а не «Ничего не найдено»', async ({ page }) => {
    const total = await foundCount(page)
    await search(page, '     ')
    await expectResultCount(page, total)
    await expect(page.getByText('Ничего не найдено')).toBeHidden()
  })

  test('спецсимволы и регулярные выражения не ломают поиск', async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    for (const query of ['.*', '(', '[a-', '\\', '+', '?', '$^', '%', "' OR 1=1 --"]) {
      await search(page, query)
      await expect(page.getByText(/Найдено моделей:/)).toBeVisible()
    }
    expect(pageErrors).toEqual([])
    await search(page, '.*')
    await expectResultCount(page, 0)
  })

  test('HTML в запросе не выполняется и не вставляется в страницу', async ({ page }) => {
    const dialogs: string[] = []
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message())
      await dialog.dismiss()
    })
    await search(page, '<img src=x onerror=alert(1)><script>alert(2)</script>')
    await expectResultCount(page, 0)
    await expect(page.locator('main img[src="x"]')).toHaveCount(0)
    expect(dialogs).toEqual([])
  })

  test('очень длинный запрос не подвешивает страницу, поле остаётся рабочим', async ({ page }) => {
    await search(page, 'а'.repeat(20_000))
    await expectResultCount(page, 0)
    await search(page, 'атлант')
    expect(await foundCount(page)).toBeGreaterThan(0)
  })

  test('кнопка очистки появляется только при вводе и сбрасывает поиск', async ({ page }) => {
    const total = await foundCount(page)
    await expect(page.getByRole('button', { name: 'Очистить поиск' })).toHaveCount(0)
    await search(page, 'сенатор')
    await expectResultCount(page, 1)
    await page.getByRole('button', { name: 'Очистить поиск' }).click()
    await expect(searchInput(page)).toHaveValue('')
    await expectResultCount(page, total)
    await expect(page.getByRole('button', { name: 'Очистить поиск' })).toHaveCount(0)
  })

  test('поиск работает вместе с категорией: товар из другой категории не показывается', async ({ page }) => {
    await categoryChip(page, 'Кухонные стулья').click()
    await search(page, 'сенатор')
    await expectResultCount(page, 0)
    await categoryChip(page, 'Кресла руководителя').click()
    await expectResultCount(page, 1)
  })

  test('поиск сохраняется при смене фильтров и категорий', async ({ page }) => {
    await search(page, 'атлант')
    const before = await foundCount(page)
    await chooseFilter(page, 'Цена', 'По убыванию')
    await categoryChip(page, 'Все').click()
    await expect(searchInput(page)).toHaveValue('атлант')
    await expectResultCount(page, before)
  })

  test('быстрый посимвольный ввод даёт тот же результат, что и вставка целиком', async ({ page }) => {
    await search(page, 'атлант стандарт')
    const pasted = (await readCards(page)).map((card) => card.sku)
    await search(page, '')
    await searchInput(page).pressSequentially('атлант стандарт', { delay: 5 })
    expect((await readCards(page)).map((card) => card.sku)).toEqual(pasted)
  })

  test('поле поиска доступно с клавиатуры и в нём работает Enter без перезагрузки страницы', async ({ page }) => {
    await searchInput(page).focus()
    await page.keyboard.type('сенатор')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/(#.*)?$/)
    await expectResultCount(page, 1)
    expect(await cardsLocator(page).count()).toBe(1)
  })

  test('после перезагрузки страницы поиск и фильтры сбрасываются, каталог показывает всё (состояние не «залипает»)', async ({ page }) => {
    const total = await foundCount(page)
    await search(page, 'сенатор')
    await expectResultCount(page, 1)
    await page.reload()
    await expectResultCount(page, total)
    await expect(searchInput(page)).toHaveValue('')
  })
})
