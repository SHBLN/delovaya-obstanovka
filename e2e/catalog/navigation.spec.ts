import { expect, test, type Page } from '@playwright/test'
import { openCatalog, sectionGeometry, waitForScrollSettled } from './helpers'

const SECTIONS = [
  { link: 'Каталог', id: 'catalog' },
  { link: 'О нас', id: 'about' },
  { link: 'Доставка', id: 'delivery' },
  { link: 'Контакты', id: 'contacts' },
] as const

/** Раздел должен оказаться сразу под закреплённой шапкой, а не под ней и не далеко внизу. */
async function expectSectionAtHeader(page: Page, id: string) {
  await waitForScrollSettled(page)
  const geometry = await sectionGeometry(page, id)
  expect(geometry.sectionTop, `«${id}» спрятан под шапкой`).toBeGreaterThanOrEqual(geometry.headerBottom - 4)
  if (geometry.headingTop !== null) {
    expect(geometry.headingTop, `заголовок «${id}» спрятан под шапкой`).toBeGreaterThanOrEqual(geometry.headerBottom - 4)
  }
  if (!geometry.atPageBottom) {
    expect(geometry.sectionTop, `«${id}» не доскроллен до шапки`).toBeLessThanOrEqual(geometry.headerBottom + 80)
  }
}

test.describe('Навигация по якорям (десктоп)', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  for (const { link, id } of SECTIONS) {
    test(`пункт меню «${link}» приводит к разделу #${id} под шапкой и обновляет адрес`, async ({ page }) => {
      await page.getByRole('banner').getByRole('link', { name: link, exact: true }).click()
      await expectSectionAtHeader(page, id)
      await expect(page).toHaveURL(new RegExp(`#${id}$`))
    })

    test(`ссылка «${link}» в подвале приводит к тому же разделу`, async ({ page }) => {
      await page.getByRole('contentinfo').getByRole('link', { name: link, exact: true }).click()
      await expectSectionAtHeader(page, id)
    })
  }

  test('повторный клик по тому же пункту и переходы в произвольном порядке не сбивают позицию', async ({ page }) => {
    const nav = page.getByRole('banner')
    await nav.getByRole('link', { name: 'Контакты', exact: true }).click()
    await expectSectionAtHeader(page, 'contacts')
    await nav.getByRole('link', { name: 'Контакты', exact: true }).click()
    await expectSectionAtHeader(page, 'contacts')
    await nav.getByRole('link', { name: 'Каталог', exact: true }).click()
    await expectSectionAtHeader(page, 'catalog')
    await nav.getByRole('link', { name: 'О нас', exact: true }).click()
    await expectSectionAtHeader(page, 'about')
    await nav.getByRole('link', { name: 'Доставка', exact: true }).click()
    await expectSectionAtHeader(page, 'delivery')
  })

  test('быстрые клики по разным пунктам: итог соответствует последнему клику', async ({ page }) => {
    const nav = page.getByRole('banner')
    await nav.getByRole('link', { name: 'Контакты', exact: true }).click()
    await nav.getByRole('link', { name: 'О нас', exact: true }).click()
    await nav.getByRole('link', { name: 'Доставка', exact: true }).click()
    await expectSectionAtHeader(page, 'delivery')
  })

  test('навигация работает на отфильтрованном списке (высота страницы изменилась)', async ({ page }) => {
    await page.getByLabel('Поиск по названию').fill('сенатор')
    await page.getByRole('banner').getByRole('link', { name: 'Контакты', exact: true }).click()
    await expectSectionAtHeader(page, 'contacts')
  })

  test('кнопка «Смотреть каталог» на первом экране доводит до каталога, заголовок не спрятан под шапкой', async ({ page }) => {
    await page.getByRole('link', { name: 'Смотреть каталог' }).click()
    await expectSectionAtHeader(page, 'catalog')
  })

  test('логотип возвращает к началу страницы, заголовок первого экрана виден под шапкой', async ({ page }) => {
    await page.getByRole('banner').getByRole('link', { name: 'Контакты', exact: true }).click()
    await expectSectionAtHeader(page, 'contacts')
    await page.getByRole('banner').getByRole('link', { name: 'Логотип Деловая обстановка' }).click()
    await waitForScrollSettled(page)
    const headerBottom = await page.evaluate(() => document.querySelector('header')!.getBoundingClientRect().bottom)
    const h1Top = await page.getByRole('heading', { level: 1 }).evaluate((el) => el.getBoundingClientRect().top)
    expect(h1Top).toBeGreaterThanOrEqual(headerBottom - 4)
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  })

  test('шапка остаётся закреплённой и не перекрывает содержимое при обычной прокрутке', async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }))
    const top = await page.getByRole('banner').evaluate((el) => el.getBoundingClientRect().top)
    expect(top).toBe(0)
  })

  test('[BUG?] «Политика конфиденциальности» ведёт на страницу/документ политики, а не на верх страницы', async ({ page }) => {
    const href = await page.getByRole('contentinfo').getByRole('link', { name: 'Политика конфиденциальности' }).getAttribute('href')
    expect(href, 'ссылка-пустышка: ведёт на якорь этой же страницы').not.toMatch(/^#/)
  })
})

test.describe('Прямые переходы по URL', () => {
  for (const { id } of SECTIONS) {
    test(`открытие /#${id} сразу показывает нужный раздел под шапкой`, async ({ page }) => {
      await page.goto(`/#${id}`)
      await expect(page.getByRole('article').first()).toBeVisible()
      await expectSectionAtHeader(page, id)
    })
  }

  test('перезагрузка страницы на якоре возвращает к тому же разделу', async ({ page }) => {
    await openCatalog(page)
    await page.getByRole('banner').getByRole('link', { name: 'О нас', exact: true }).click()
    await expectSectionAtHeader(page, 'about')
    await page.reload()
    await expect(page.getByRole('article').first()).toBeVisible()
    await expectSectionAtHeader(page, 'about')
  })

  test('несуществующий якорь /#nope не ломает страницу', async ({ page }) => {
    await page.goto('/#nope')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('адрес с параметрами (utm, мусор) открывает каталог', async ({ page }) => {
    await page.goto('/?utm_source=test&q=%E0%A4%A')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  for (const path of ['/nonexistent', '/login', '/boards', '/catalog/atlant', '/index.html']) {
    test(`[BUG?] неизвестный адрес ${path} не показывает пустую страницу (каталог или понятная страница 404)`, async ({ page }) => {
      await page.goto(path)
      const body = page.locator('body')
      await expect(body).toContainText(/Кресла и стулья|не найден|404/i)
      await expect(page.getByRole('link').first()).toBeVisible()
    })
  }
})

test.describe('Навигация на телефоне', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('меню открывается и закрывается кнопкой, внутри все пункты и контакты', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Меню' })
    const menu = page.getByRole('banner').getByRole('navigation')
    await expect(menu).toBeHidden()
    await toggle.click()
    await expect(menu).toBeVisible()
    for (const { link } of SECTIONS) await expect(menu.getByRole('link', { name: link, exact: true })).toBeVisible()
    await toggle.click()
    await expect(menu).toBeHidden()
  })

  for (const { link, id } of SECTIONS) {
    test(`в мобильном меню «${link}» закрывает меню и приводит к разделу #${id}`, async ({ page }) => {
      await page.getByRole('button', { name: 'Меню' }).click()
      await page.getByRole('banner').getByRole('navigation').getByRole('link', { name: link, exact: true }).click()
      await expect(page.getByRole('banner').getByRole('navigation')).toBeHidden()
      await expectSectionAtHeader(page, id)
    })
  }

  test('открытое меню не перекрывает закрытие: после перехода повторное открытие снова работает', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'Меню' })
    await toggle.click()
    await page.getByRole('banner').getByRole('navigation').getByRole('link', { name: 'Доставка', exact: true }).click()
    await expectSectionAtHeader(page, 'delivery')
    await toggle.click()
    await expect(page.getByRole('banner').getByRole('navigation')).toBeVisible()
  })

  test('мобильная шапка после прокрутки остаётся закреплённой и не закрывает заголовки разделов', async ({ page }) => {
    await page.getByRole('button', { name: 'Меню' }).click()
    await page.getByRole('banner').getByRole('navigation').getByRole('link', { name: 'О нас', exact: true }).click()
    await expectSectionAtHeader(page, 'about')
  })
})
