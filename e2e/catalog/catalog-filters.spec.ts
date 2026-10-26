import { expect, test } from '@playwright/test'
import {
  CATEGORIES,
  categoryChip,
  cardsLocator,
  chooseFilter,
  expectResultCount,
  filterOptions,
  filterTrigger,
  foundCount,
  openCatalog,
  readCards,
  search,
} from './helpers'

test.describe('Каталог: категории', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('каждая категория показывает только свои товары, а сумма по категориям равна общему числу', async ({ page }) => {
    const total = await foundCount(page)
    let sum = 0
    for (const category of CATEGORIES) {
      await categoryChip(page, category).click()
      await expect(page.getByText(/Найдено моделей:/)).not.toHaveText(`Найдено моделей: ${total}`)
      const cards = await readCards(page)
      expect(cards.length, category).toBeGreaterThan(0)
      for (const card of cards) expect(card.category, `${card.sku} в «${category}»`).toBe(category)
      expect(await foundCount(page)).toBe(cards.length)
      sum += cards.length
    }
    expect(sum, 'товары теряются или попадают в несколько категорий').toBe(total)
  })

  test('«Все» возвращает полный список после выбора категории', async ({ page }) => {
    const total = await foundCount(page)
    await categoryChip(page, 'Кухонные стулья').click()
    await expect(page.getByText(/Найдено моделей:/)).not.toHaveText(`Найдено моделей: ${total}`)
    await categoryChip(page, 'Все').click()
    await expectResultCount(page, total)
  })

  test('быстрые переключения категорий: итоговое состояние соответствует последнему клику', async ({ page }) => {
    await categoryChip(page, 'Геймерские кресла').click()
    await categoryChip(page, 'Кухонные стулья').click()
    await categoryChip(page, 'Офисные кресла').click()
    await categoryChip(page, 'Кресла руководителя').click({ clickCount: 2 })
    const cards = await readCards(page)
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) expect(card.category).toBe('Кресла руководителя')
  })
})

test.describe('Каталог: состояние выбранной категории', () => {
  test('[BUG?] выбранная категория выделена не только цветом (aria-pressed / aria-current)', async ({ page }) => {
    await openCatalog(page)
    await categoryChip(page, 'Геймерские кресла').click()
    const chip = categoryChip(page, 'Геймерские кресла')
    const pressed = await chip.getAttribute('aria-pressed')
    const current = await chip.getAttribute('aria-current')
    expect(pressed === 'true' || (current !== null && current !== 'false')).toBe(true)
  })
})

test.describe('Каталог: сортировка по цене', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('по возрастанию и по убыванию: цены упорядочены, состав товаров не меняется', async ({ page }) => {
    const original = await readCards(page)
    const originalSkus = original.map((card) => card.sku)

    await chooseFilter(page, 'Цена', 'По возрастанию')
    const asc = await readCards(page)
    expect(asc.map((card) => card.price)).toEqual([...asc.map((card) => card.price)].sort((a, b) => a - b))
    expect(asc.map((card) => card.sku).sort()).toEqual([...originalSkus].sort())

    await chooseFilter(page, 'Цена', 'По убыванию')
    const desc = await readCards(page)
    expect(desc.map((card) => card.price)).toEqual([...desc.map((card) => card.price)].sort((a, b) => b - a))
    expect(desc.map((card) => card.sku).sort()).toEqual([...originalSkus].sort())
  })

  test('«По умолчанию» возвращает исходный порядок', async ({ page }) => {
    const original = (await readCards(page)).map((card) => card.sku)
    await chooseFilter(page, 'Цена', 'По убыванию')
    await chooseFilter(page, 'Цена', 'По умолчанию')
    expect((await readCards(page)).map((card) => card.sku)).toEqual(original)
  })

  test('сортировка сохраняется при смене категории и поиске', async ({ page }) => {
    await chooseFilter(page, 'Цена', 'По возрастанию')
    await categoryChip(page, 'Офисные кресла').click()
    const office = await readCards(page)
    expect(office.every((card) => card.category === 'Офисные кресла')).toBe(true)
    expect(office.map((card) => card.price)).toEqual([...office.map((card) => card.price)].sort((a, b) => a - b))

    await search(page, 'хром')
    const found = await readCards(page)
    expect(found.length).toBeGreaterThan(1)
    expect(found.every((card) => card.category === 'Офисные кресла')).toBe(true)
    expect(found.map((card) => card.price)).toEqual([...found.map((card) => card.price)].sort((a, b) => a - b))
  })
})

test.describe('Каталог: фильтры «Материал» и «Цвет»', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('список материалов не содержит скрытых и заменённых вариантов', async ({ page }) => {
    const options = await filterOptions(page, 'Материал')
    expect(options[0]).toBe('Все материалы')
    expect(options).toContain('Дышащая сетка')
    expect(options).toContain('Текстиль')
    expect(options.filter((option) => /флок/i.test(option))).toEqual(['Флок (микрофибра/велюр)'])
    for (const option of options) {
      expect(option, 'одиночная «Сетка»').not.toMatch(/^сетка$/i)
      expect(option, '«Ткань» заменена на «Текстиль»').not.toMatch(/ткан/i)
      expect(option, 'LED убран из фильтра').not.toMatch(/led/i)
      expect(option, 'крестовины и подлокотники скрыты').not.toMatch(/крестовин|подлокотник/i)
    }
    expect(new Set(options).size, 'дубликаты в списке').toBe(options.length)
  })

  test('каждый материал из списка даёт непустой результат, и все карточки содержат этот материал', async ({ page }) => {
    const options = (await filterOptions(page, 'Материал')).filter((option) => option !== 'Все материалы')
    const total = await foundCount(page)
    for (const option of options) {
      await chooseFilter(page, 'Материал', option)
      const cards = await readCards(page)
      expect(cards.length, `«${option}» ничего не находит`).toBeGreaterThan(0)
      expect(cards.length, `«${option}» вернул больше товаров, чем есть в каталоге`).toBeLessThanOrEqual(total)
      for (const card of cards) expect(card.materials, `${card.sku} при «${option}»`).toContain(option)
    }
  })

  test('каждый товар достижим хотя бы через один пункт фильтра «Материал» (ничего не потеряно)', async ({ page }) => {
    const all = (await readCards(page)).map((card) => card.sku)
    const reachable = new Set<string>()
    const options = (await filterOptions(page, 'Материал')).filter((option) => option !== 'Все материалы')
    for (const option of options) {
      await chooseFilter(page, 'Материал', option)
      for (const card of await readCards(page)) reachable.add(card.sku)
    }
    const lost = all.filter((sku) => !reachable.has(sku))
    expect(lost, `товары, которые нельзя найти через фильтр материалов: ${lost.join(', ')}`).toEqual([])
  })

  test('каждый цвет из списка даёт непустой результат, и все карточки содержат этот цвет', async ({ page }) => {
    const options = (await filterOptions(page, 'Цвет')).filter((option) => option !== 'Все цвета')
    expect(options.length).toBeGreaterThan(1)
    for (const option of options) {
      await chooseFilter(page, 'Цвет', option)
      const cards = await readCards(page)
      expect(cards.length, `«${option}» ничего не находит`).toBeGreaterThan(0)
      for (const card of cards) expect(card.colors, `${card.sku} при «${option}»`).toContain(option)
    }
  })

  test('сброс «Все материалы» / «Все цвета» возвращает полный список', async ({ page }) => {
    const total = await foundCount(page)
    await chooseFilter(page, 'Материал', 'Экокожа')
    await chooseFilter(page, 'Цвет', 'Черный')
    expect(await foundCount(page)).toBeLessThan(total)
    await chooseFilter(page, 'Материал', 'Все материалы')
    await chooseFilter(page, 'Цвет', 'Все цвета')
    await expectResultCount(page, total)
  })

  test('комбинация категория + материал + цвет + поиск = пересечение условий', async ({ page }) => {
    await categoryChip(page, 'Офисные кресла').click()
    await chooseFilter(page, 'Материал', 'Дышащая сетка')
    await chooseFilter(page, 'Цвет', 'Черный')
    await search(page, 'хром')
    const cards = await readCards(page)
    expect(cards.length).toBeGreaterThan(0)
    for (const card of cards) {
      expect(card.category).toBe('Офисные кресла')
      expect(card.materials).toContain('Дышащая сетка')
      expect(card.colors).toContain('Черный')
      expect(`${card.name} ${card.sku}`.toLowerCase()).toContain('хром')
    }
  })

  test('пустой результат: сообщение, счётчик 0, а после снятия условий список возвращается и фильтры сохранены', async ({ page }) => {
    const total = await foundCount(page)
    await chooseFilter(page, 'Материал', 'Экокожа')
    const withMaterial = await foundCount(page)
    await search(page, 'такого-товара-нет-zzz')
    await expectResultCount(page, 0)
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
    await expect(filterTrigger(page, 'Материал')).toContainText('Экокожа')

    await search(page, '')
    await expect(page.getByText('Ничего не найдено')).toBeHidden()
    await expectResultCount(page, withMaterial)
    expect(withMaterial).toBeLessThan(total)
  })

  test('при пустом результате сообщение не остаётся на экране после выбора другой категории', async ({ page }) => {
    await search(page, 'qqqq')
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
    await search(page, '')
    await categoryChip(page, 'Геймерские кресла').click()
    await expect(page.getByText('Ничего не найдено')).toBeHidden()
    expect(await cardsLocator(page).count()).toBeGreaterThan(0)
  })
})

test.describe('Каталог: поведение выпадающих списков', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('открывается по клику, закрывается повторным кликом и кликом вне списка', async ({ page }) => {
    const trigger = filterTrigger(page, 'Материал')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('listbox')).toBeVisible()
    await trigger.click()
    await expect(page.getByRole('listbox')).toHaveCount(0)

    await trigger.click()
    await page.getByRole('heading', { name: 'Выберите подходящую модель' }).click()
    await expect(page.getByRole('listbox')).toHaveCount(0)
  })

  test('одновременно открыт только один список', async ({ page }) => {
    await filterTrigger(page, 'Материал').click()
    await filterTrigger(page, 'Цвет').click()
    await expect(page.getByRole('listbox')).toHaveCount(1)
    await expect(filterTrigger(page, 'Материал')).toHaveAttribute('aria-expanded', 'false')
  })

  test('выбранный пункт помечен aria-selected, выбор закрывает список', async ({ page }) => {
    await filterTrigger(page, 'Цвет').click()
    await page.getByRole('option', { name: 'Белый', exact: true }).click()
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await filterTrigger(page, 'Цвет').click()
    await expect(page.getByRole('option', { name: 'Белый', exact: true })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('option', { name: 'Все цвета', exact: true })).toHaveAttribute('aria-selected', 'false')
  })

  test('[BUG?] клавиша Escape закрывает открытый список (как в меню связи)', async ({ page }) => {
    await filterTrigger(page, 'Материал').click()
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toHaveCount(0)
  })

  test('список управляется с клавиатуры: Enter на кнопке открывает, Tab доходит до пунктов, Enter выбирает', async ({ page }) => {
    await filterTrigger(page, 'Цвет').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toBeVisible()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('listbox')).toHaveCount(0)
    await expect(filterTrigger(page, 'Цвет')).not.toContainText('Все цвета')
  })
})
