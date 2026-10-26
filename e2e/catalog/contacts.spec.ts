import { expect, test, type Page } from '@playwright/test'
import { EMAIL, PHONE_DIGITS, blockExternalNavigation, openCatalog } from './helpers'

const contactPanel = (page: Page) => page.getByTestId('contact-menu')

test.describe('Контактные данные на сайте', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('все ссылки tel: ведут на один и тот же номер', async ({ page }) => {
    const hrefs = await page.locator('a[href^="tel:"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThan(2)
    expect(new Set(hrefs)).toEqual(new Set([`tel:+${PHONE_DIGITS}`]))
  })

  test('все отображаемые номера телефона совпадают с номером в ссылках', async ({ page }) => {
    const text = (await page.locator('body').innerText()).replace(/\u00a0/g, ' ')
    const shown = [...text.matchAll(/\+375\s*\(?\d{2}\)?\s*\d{3}-\d{2}-\d{2}/g)].map((match) => match[0].replace(/\D/g, ''))
    expect(shown.length).toBeGreaterThan(3)
    for (const digits of shown) expect(digits).toBe(PHONE_DIGITS)
  })

  test('почта: везде один адрес, ссылка mailto корректна', async ({ page }) => {
    const hrefs = await page.locator('a[href^="mailto:"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(hrefs.length).toBeGreaterThanOrEqual(2)
    expect(new Set(hrefs)).toEqual(new Set([`mailto:${EMAIL}`]))
    const text = await page.locator('body').innerText()
    const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []
    expect(emails.length).toBeGreaterThanOrEqual(2)
    expect(new Set(emails)).toEqual(new Set([EMAIL]))
  })

  test('мессенджеры: Telegram и WhatsApp ведут на диалог с нужным номером; WhatsApp открывается в новой вкладке безопасно', async ({ page }) => {
    const telegram = page.locator('a[href^="tg://"]')
    const whatsapp = page.locator('a[href*="whatsapp.com"]')
    expect(await telegram.count()).toBeGreaterThan(1)
    expect(await whatsapp.count()).toBeGreaterThan(1)
    for (const href of await telegram.evaluateAll((links) => links.map((link) => link.getAttribute('href')!))) {
      expect(href).toContain(`phone=${PHONE_DIGITS}`)
    }
    for (const link of await whatsapp.all()) {
      expect(await link.getAttribute('href')).toContain(`phone=${PHONE_DIGITS}`)
      expect(await link.getAttribute('target')).toBe('_blank')
      expect(await link.getAttribute('rel')).toMatch(/noopener|noreferrer/)
    }
  })

  test('удалённые данные не вернулись: Viber, VK, адрес шоурума, карта, «заглушка»', async ({ page }) => {
    const html = await page.content()
    const text = await page.locator('body').innerText()
    expect(html.toLowerCase()).not.toContain('viber')
    for (const forbidden of [/VK\b/, /ВКонтакте/i, /Адрес шоурума/i, /Расположение магазина/i, /заглушк/i, /\bVibe\b/i]) {
      expect(text, String(forbidden)).not.toMatch(forbidden)
    }
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('график работы одинаков везде: ежедневно с 9:00 до 21:00, без выходных', async ({ page }) => {
    const text = await page.locator('body').innerText()
    const hours = [...text.matchAll(/с\s*(\d{1,2}:\d{2})\s*до\s*(\d{1,2}:\d{2})/g)].map((match) => `${match[1]}-${match[2]}`)
    expect(hours.length).toBeGreaterThanOrEqual(2)
    expect(new Set(hours)).toEqual(new Set(['9:00-21:00']))
    expect(text.match(/без выходных/g)?.length).toBeGreaterThanOrEqual(2)
  })

  test('у ссылок-иконок есть доступное имя', async ({ page }) => {
    for (const name of ['Написать в Telegram', 'Написать в WhatsApp', 'Написать на электронную почту']) {
      await expect(page.getByRole('link', { name }).first()).toBeVisible()
    }
  })
})

test.describe('Меню «Позвонить менеджеру» (десктоп)', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
    await blockExternalNavigation(page)
  })

  test('в шапке: открывается, содержит Telegram, WhatsApp и звонок с верными ссылками, без Viber', async ({ page }) => {
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = contactPanel(page)
    await expect(panel.getByRole('link')).toHaveText(['Написать в Telegram', 'Написать в WhatsApp', 'Позвонить'])
    await expect(panel.getByRole('link', { name: 'Позвонить' })).toHaveAttribute('href', `tel:+${PHONE_DIGITS}`)
    await expect(panel.getByRole('link', { name: /Telegram/ })).toHaveAttribute('href', new RegExp(PHONE_DIGITS))
    await expect(panel.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', new RegExp(PHONE_DIGITS))
  })

  test('закрывается: повторным кликом по кнопке, кликом вне меню, клавишей Escape и выбором пункта', async ({ page }) => {
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' })
    const panel = contactPanel(page)

    await trigger.click()
    await trigger.click()
    await expect(panel).toHaveCount(0)

    await trigger.click()
    await page.getByRole('heading', { level: 1 }).click()
    await expect(panel).toHaveCount(0)

    await trigger.click()
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)

    await trigger.click()
    await panel.getByRole('link', { name: 'Позвонить' }).click()
    await expect(panel).toHaveCount(0)
  })

  test('быстрые повторные клики: состояние всегда соответствует чётности кликов', async ({ page }) => {
    const trigger = page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' })
    await trigger.click({ clickCount: 3, delay: 20 })
    await expect(contactPanel(page)).toHaveCount(1)
    await trigger.click({ clickCount: 2, delay: 20 })
    await expect(contactPanel(page)).toHaveCount(1)
  })

  test('одновременно открыто только одно меню связи (шапка / первый экран / плавающая кнопка)', async ({ page }) => {
    await page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' }).click()
    await expect(contactPanel(page)).toHaveCount(1)
    await page.locator('#hero').getByRole('button', { name: 'Позвонить менеджеру' }).click()
    await expect(contactPanel(page)).toHaveCount(1)
    await page.getByRole('button', { name: 'Связаться с менеджером' }).click()
    await expect(contactPanel(page)).toHaveCount(1)
  })

  test('меню целиком помещается в окно браузера во всех трёх местах', async ({ page }) => {
    const triggers = [
      page.getByRole('banner').getByRole('button', { name: 'Позвонить менеджеру' }),
      page.locator('#hero').getByRole('button', { name: 'Позвонить менеджеру' }),
      page.getByRole('button', { name: 'Связаться с менеджером' }),
    ]
    const viewport = page.viewportSize()!
    for (const [index, trigger] of triggers.entries()) {
      await trigger.click()
      const box = (await contactPanel(page).boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      // Меню первого экрана раскрывается вниз внутри прокручиваемой страницы и может уходить за нижний край окна.
      if (index !== 1) expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
      await page.keyboard.press('Escape')
    }
  })

  test('плавающее меню остаётся рабочим после прокрутки вниз страницы', async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.getByRole('button', { name: 'Связаться с менеджером' }).click()
    await expect(contactPanel(page)).toBeVisible()
    await expect(contactPanel(page).getByRole('link', { name: 'Позвонить' })).toBeInViewport()
  })

  test('на десктопе нижняя мобильная панель скрыта, а плавающая круглая кнопка видна', async ({ page }) => {
    await expect(page.getByTestId('mobile-contact-bar')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Связаться с менеджером' })).toBeVisible()
  })
})

test.describe('Меню «Позвонить менеджеру» (телефон)', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
    await blockExternalNavigation(page)
  })

  test('нижняя панель видна, круглая кнопка скрыта, меню открывается вверх и целиком в экране', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Связаться с менеджером' })).toBeHidden()
    const bar = page.getByTestId('mobile-contact-bar')
    await expect(bar).toBeVisible()
    await bar.getByRole('button', { name: 'Позвонить менеджеру' }).click()
    const box = (await contactPanel(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
    const barBox = (await bar.boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(barBox.y + 1)
    await expect(contactPanel(page).getByRole('link')).toHaveCount(3)
  })

  test('меню первого экрана на телефоне не вылезает за правый край', async ({ page }) => {
    await page.locator('#hero').getByRole('button', { name: 'Позвонить менеджеру' }).click()
    const box = (await contactPanel(page).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
  })
})

test.describe('Кнопка «Наверх»', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('в самом верху страницы недоступна (прозрачна и не кликабельна), после прокрутки появляется', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Наверх' })
    await expect(button).toHaveCSS('opacity', '0')
    await expect(button).toHaveCSS('pointer-events', 'none')

    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
    await expect(button).toHaveCSS('opacity', '1')
    await expect(button).toHaveCSS('pointer-events', 'auto')
  })

  test('возвращает в самое начало и снова скрывается', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Наверх' })
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }))
    await expect(button).toHaveCSS('opacity', '1')
    await button.click()
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 }).toBe(0)
    await expect(button).toHaveCSS('opacity', '0')
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
  })

  test('граница показа: на небольшой прокрутке не мешает, на большой — виден', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Наверх' })
    await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'instant' }))
    await expect(button).toHaveCSS('opacity', '0')
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }))
    await expect(button).toHaveCSS('opacity', '1')
  })

  test('скрытая кнопка не получает фокус с клавиатуры (Shift+Tab из начала страницы)', async ({ page }) => {
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Shift+Tab')
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
    expect(focused).not.toBe('Наверх')
  })

  test('не перекрывает плавающую кнопку связи', async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
    const up = (await page.getByRole('button', { name: 'Наверх' }).boundingBox())!
    const contact = (await page.getByRole('button', { name: 'Связаться с менеджером' }).boundingBox())!
    const overlap = !(up.y + up.height <= contact.y || contact.y + contact.height <= up.y || up.x + up.width <= contact.x || contact.x + contact.width <= up.x)
    expect(overlap).toBe(false)
  })
})
