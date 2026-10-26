import { expect, test } from '@playwright/test'
import { cardsLocator, modal, openCatalog } from './helpers'

test.describe('Устойчивость к сбоям сети и окружения', () => {
  test('если ни одно фото товара не загрузилось, каталог всё равно работает: названия, цены, «Подробнее»', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/products/**', (route) => route.abort('failed'))

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const first = cardsLocator(page).first()
    await expect(first).toBeVisible()
    await expect(first.getByRole('heading', { level: 3 })).not.toBeEmpty()
    await expect(first).toContainText('белорусских рублей')

    await first.getByRole('button', { name: 'Подробнее' }).click()
    await expect(modal(page)).toBeVisible()
    await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).click()
    await expect(modal(page)).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('если логотип или фото первого экрана недоступны, шапка и навигация остаются рабочими', async ({ page }) => {
    await page.route(/logo-delovaya|hero-chair/, (route) => route.abort('failed'))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByRole('banner').getByRole('link', { name: 'Контакты', exact: true }).click()
    await expect(page).toHaveURL(/#contacts$/)
    await expect(page.locator('#contacts')).toBeInViewport()
  })

  test('шрифты Google недоступны (запрос отклонён): страница читаема и функциональна', async ({ page }) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort('blockedbyclient'))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.getByLabel('Поиск по названию').fill('сенатор')
    await expect(cardsLocator(page)).toHaveCount(1)
  })

  test('[BUG?] шрифты Google отвечают очень медленно (8 с): содержимое появляется быстро, а не ждёт шрифты', async ({ page }) => {
    await page.route(/fonts\.googleapis\.com/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 8_000))
      await route.abort('timedout').catch(() => {})
    })
    const started = Date.now()
    await page.goto('/', { waitUntil: 'commit' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 4_000 })
    expect(Date.now() - started).toBeLessThan(5_000)
  })

  test('нет запросов к сторонним сервисам, кроме шрифтов (аналитика, Supabase от старого проекта и т. п.)', async ({ page }) => {
    const hosts = new Set<string>()
    page.on('request', (request) => hosts.add(new URL(request.url()).hostname))
    await openCatalog(page)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.waitForLoadState('networkidle')
    const allowed = new Set(['127.0.0.1', 'localhost', 'fonts.googleapis.com', 'fonts.gstatic.com'])
    expect([...hosts].filter((host) => !allowed.has(host))).toEqual([])
  })

  test('сайт работает без JavaScript-ошибок при быстрой серии действий пользователя', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await openCatalog(page)
    for (let round = 0; round < 3; round++) {
      await page.getByRole('button', { name: 'Геймерские кресла', exact: true }).click()
      await page.getByLabel('Поиск по названию').fill('геймер')
      await cardsLocator(page).first().getByRole('button', { name: 'Подробнее' }).click()
      await page.keyboard.press('Escape')
      await page.mouse.click(4, 4)
      await page.getByRole('button', { name: 'Все', exact: true }).click()
      await page.getByLabel('Поиск по названию').fill('')
    }
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('офлайн после загрузки: уже загруженная страница продолжает фильтровать и искать (нет запросов к API)', async ({ page, context }) => {
    await openCatalog(page)
    await context.setOffline(true)
    await page.getByLabel('Поиск по названию').fill('сенатор')
    await expect(cardsLocator(page)).toHaveCount(1)
    await page.getByRole('button', { name: 'Все', exact: true }).click()
    await context.setOffline(false)
  })
})
