import { expect, test } from '@playwright/test'
import { PHONE_DIGITS, cardsLocator, modal, openCatalog, openModalFor, sectionGeometry, waitForScrollSettled } from './helpers'

// Сценарии, где пользователь делает что-то в неожиданном порядке или меняет условия «на лету».

test.describe('Неожиданный порядок действий', () => {
  test('смена размера окна с открытым меню связи: меню шапки не остаётся «висеть» на телефонной раскладке', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await openCatalog(page)
    await page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' }).click()
    await expect(page.getByTestId('contact-menu')).toBeVisible()
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByTestId('contact-menu')).toBeHidden()
  })

  test('смена размера окна с открытым мобильным меню: на десктопе остаётся обычная навигация', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await openCatalog(page)
    await page.getByRole('button', { name: 'Меню' }).click()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.getByRole('button', { name: 'Меню' })).toBeHidden()
    await expect(page.getByRole('banner').getByRole('navigation')).toHaveCount(1)
    await expect(page.getByRole('banner').getByRole('link', { name: 'Каталог', exact: true })).toBeVisible()
  })

  test('поворот телефона с открытым окном товара: панель остаётся в пределах экрана', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await openCatalog(page)
    await openModalFor(page, 0)
    await page.setViewportSize({ width: 667, height: 375 })
    const close = modal(page).getByRole('button', { name: 'Закрыть', exact: true })
    await expect(close).toBeInViewport()
    await close.click()
    await expect(modal(page)).toHaveCount(0)
  })

  test('открыть окно товара, затем меню связи в шапке: меню не прячется под затемнением и работает', async ({ page }) => {
    await openCatalog(page)
    await openModalFor(page, 0)
    // Затемнение перекрывает страницу: кнопка шапки не должна быть доступна для клика «сквозь» окно.
    const headerButton = page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' })
    await expect(headerButton).toBeVisible()
    const covered = await headerButton.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
      return top !== el && !el.contains(top)
    })
    expect(covered, 'элементы под окном не должны быть доступны для клика').toBe(true)
  })

  test('навигация по якорю при открытом поиске без результатов (страница короткая): раздел всё равно показывается под шапкой', async ({ page }) => {
    await openCatalog(page)
    await page.getByLabel('Поиск по названию').fill('qqqq-нет-таких')
    await expect(page.getByText('Ничего не найдено')).toBeVisible()
    await page.getByRole('banner').getByRole('link', { name: 'Контакты', exact: true }).click()
    await waitForScrollSettled(page)
    const geometry = await sectionGeometry(page, 'contacts')
    expect(geometry.sectionTop).toBeGreaterThanOrEqual(geometry.headerBottom - 4)
    await expect(page.locator('#contacts')).toBeInViewport()
  })

  for (const id of ['catalog', 'about', 'delivery', 'contacts']) {
    test(`ручное изменение хэша на странице (#${id}) показывает раздел под шапкой`, async ({ page }) => {
      await openCatalog(page)
      await page.evaluate((hash) => {
        window.location.hash = hash
      }, `#${id}`)
      await waitForScrollSettled(page)
      const geometry = await sectionGeometry(page, id)
      expect(geometry.sectionTop, 'заголовок раздела спрятан под закреплённой шапкой').toBeGreaterThanOrEqual(geometry.headerBottom - 4)
      expect(geometry.sectionTop).toBeLessThanOrEqual(geometry.headerBottom + 84)
    })
  }

  test('окно товара открыто, пользователь нажимает «Назад» в браузере: страница не уходит с сайта', async ({ page }) => {
    await page.goto('/?step=1')
    await openCatalog(page, '/?step=2')
    await openModalFor(page, 0)
    await page.goBack()
    await expect(page).toHaveURL(/step=1/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('WhatsApp из блока «Контакты» открывается в новой вкладке на правильный номер, текущая страница остаётся', async ({ page, context }) => {
    await context.route('https://api.whatsapp.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>wa</title>' }))
    await openCatalog(page)
    const popupPromise = context.waitForEvent('page')
    await page.locator('#contacts').getByRole('link', { name: 'Написать в WhatsApp' }).click()
    const popup = await popupPromise
    await popup.waitForLoadState()
    const url = new URL(popup.url())
    expect(url.hostname).toBe('api.whatsapp.com')
    expect(url.searchParams.get('phone')).toBe(PHONE_DIGITS)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(await popup.evaluate(() => window.opener === null), 'новая вкладка не должна иметь доступ к window.opener').toBe(true)
  })

  test('быстрое чередование «Подробнее» → закрыть → «Подробнее» на разных товарах не оставляет двух окон', async ({ page }) => {
    await openCatalog(page)
    for (const index of [0, 1, 2, 1, 0]) {
      await cardsLocator(page).nth(index).getByRole('button', { name: 'Подробнее' }).click()
      await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).click()
    }
    await expect(modal(page)).toHaveCount(0)
    await cardsLocator(page).nth(4).getByRole('button', { name: 'Подробнее' }).click()
    await expect(modal(page)).toHaveCount(1)
  })
})
