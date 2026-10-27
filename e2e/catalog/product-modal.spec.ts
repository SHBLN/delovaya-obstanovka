import { expect, test } from '@playwright/test'
import {
  PHONE_DIGITS,
  blockExternalNavigation,
  cardsLocator,
  categoryChip,
  modal,
  openCatalog,
  openModalFor,
  readCards,
  search,
  waitForScrollSettled,
} from './helpers'

test.describe('Окно «Подробнее»', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('показывает те же название, артикул и цену, что и карточка, плюс гарантию 24 месяца', async ({ page }) => {
    const cards = await readCards(page)
    for (const index of [0, Math.floor(cards.length / 2), cards.length - 1]) {
      const card = cards[index]
      await openModalFor(page, index)
      const dialog = modal(page)
      await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(card.name)
      await expect(dialog).toContainText(card.sku, { ignoreCase: true })
      const text = await dialog.innerText()
      expect(text.replace(/\u00a0/g, ' ')).toMatch(new RegExp(`${card.price}\\s*\\n?белорусских`))
      await expect(dialog.getByText('Гарантия', { exact: true })).toBeVisible()
      await expect(dialog.getByText('24 месяца')).toBeVisible()
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    }
  })

  test('окно КАЖДОГО товара совпадает с его карточкой (название, артикул, цена) и содержит гарантию 24 месяца', async ({ page }) => {
    test.setTimeout(180_000)
    const cards = await readCards(page)
    for (const [i, card] of cards.entries()) {
      await openModalFor(page, i)
      const dialog = modal(page)
      const label = `${card.sku} / ${card.name}`
      await expect(dialog.getByRole('heading', { level: 3 }), label).toHaveText(card.name)
      await expect(dialog, label).toContainText(card.sku, { ignoreCase: true })
      await expect(dialog, label).toContainText('24 месяца')
      const compact = (await dialog.innerText()).replace(/\s/g, '')
      expect(compact, `цена в окне: ${label}`).toContain(`${card.price}белорусских`)
      await dialog.getByRole('button', { name: 'Закрыть', exact: true }).click()
      await expect(dialog).toHaveCount(0)
    }
  })

  test('закрывается кнопкой «Закрыть» и кликом по затемнённому фону', async ({ page }) => {
    await openModalFor(page, 0)
    await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).click()
    await expect(modal(page)).toHaveCount(0)

    await openModalFor(page, 0)
    await page.mouse.click(4, 4)
    await expect(modal(page)).toHaveCount(0)
  })

  test('клик внутри окна не закрывает его', async ({ page }) => {
    await openModalFor(page, 0)
    await modal(page).getByRole('heading', { level: 3 }).click()
    await modal(page).getByText('Каркас').click()
    await expect(modal(page)).toBeVisible()
  })

  test('[BUG?] клавиша Escape закрывает окно', async ({ page }) => {
    await openModalFor(page, 0)
    await page.keyboard.press('Escape')
    await expect(modal(page)).toHaveCount(0)
  })

  test('[BUG?] окно помечено как диалог (role="dialog", aria-modal) для программ экранного доступа', async ({ page }) => {
    await openModalFor(page, 0)
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('[BUG?] пока окно открыто, страница под ним не прокручивается', async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }))
    await openModalFor(page, 5)
    // Playwright подводит карточку плавной прокруткой — ждём её конца, чтобы не принять её за прокрутку пользователя.
    await waitForScrollSettled(page)
    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.move(4, 400)
    await page.mouse.wheel(0, 900)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 2_000 }).toBe(before)
  })

  test('после закрытия позиция прокрутки и открытый поиск не сбиваются', async ({ page }) => {
    await search(page, 'атлант')
    await openModalFor(page, 1)
    // Playwright подводит карточку к центру экрана плавной прокруткой — ждём её конца, иначе позиция «плывёт».
    await waitForScrollSettled(page)
    const before = await page.evaluate(() => window.scrollY)
    await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).click()
    await expect(modal(page)).toHaveCount(0)
    await waitForScrollSettled(page)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
    await expect(page.getByLabel('Поиск по названию')).toHaveValue('атлант')
  })

  test('открывается именно тот товар, по которому кликнули, в отфильтрованном списке (нет сдвига индексов)', async ({ page }) => {
    await categoryChip(page, 'Кресла руководителя').click()
    await search(page, 'сенатор')
    await expect(cardsLocator(page)).toHaveCount(1)
    await openModalFor(page, 0)
    await expect(modal(page).getByRole('heading', { level: 3 })).toHaveText('Сенатор Экстра')
  })

  test('последовательное открытие разных товаров не оставляет данных предыдущего', async ({ page }) => {
    const cards = await readCards(page)
    await openModalFor(page, 0)
    await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).click()
    await openModalFor(page, 2)
    const dialog = modal(page)
    await expect(dialog.getByRole('heading', { level: 3 })).toHaveText(cards[2].name)
    await expect(dialog).toContainText(cards[2].sku, { ignoreCase: true })
    await expect(dialog).not.toContainText(cards[0].sku, { ignoreCase: true })
    await expect(dialog.getByRole('img').first()).toHaveAttribute('alt', cards[2].name)
  })

  test('двойной клик по «Подробнее» оставляет окно открытым (оно не мигает и не закрывается вторым кликом)', async ({ page }) => {
    await cardsLocator(page).nth(3).getByRole('button', { name: 'Подробнее' }).dblclick()
    await expect(modal(page)).toHaveCount(1)
    // Даём анимации и возможным отложенным обработчикам отработать.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    await expect(modal(page)).toBeVisible()
  })

  test('кнопки связи в окне ведут на правильный номер и почта/телефон не расходятся', async ({ page }) => {
    await openModalFor(page, 0)
    await blockExternalNavigation(page)
    const dialog = modal(page)
    await expect(dialog.getByRole('link', { name: 'Позвонить менеджеру' })).toHaveAttribute('href', `tel:+${PHONE_DIGITS}`)
    await expect(dialog.getByRole('link', { name: /Telegram/ })).toHaveAttribute('href', new RegExp(PHONE_DIGITS))
    await expect(dialog.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', new RegExp(`phone=${PHONE_DIGITS}`))
    await expect(dialog.getByRole('link', { name: /Viber/ })).toHaveCount(0)
  })

  test('клавиатура: «Подробнее» открывается Enter-ом, «Закрыть» закрывает', async ({ page }) => {
    await cardsLocator(page).first().getByRole('button', { name: 'Подробнее' }).focus()
    await page.keyboard.press('Enter')
    await expect(modal(page)).toBeVisible()
    await modal(page).getByRole('button', { name: 'Закрыть', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(modal(page)).toHaveCount(0)
  })

  test('[BUG?] фокус не уходит за окно: Tab из последнего элемента остаётся внутри диалога', async ({ page }) => {
    await openModalFor(page, 0)
    const insideCount = await modal(page).locator('a, button').count()
    for (let i = 0; i < insideCount + 3; i++) await page.keyboard.press('Tab')
    const focusInside = await page.evaluate(() => document.querySelector('[data-testid="product-modal"]')?.contains(document.activeElement))
    expect(focusInside).toBe(true)
  })
})

test.describe('Окно «Подробнее» на телефоне', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('панель помещается в экран, кнопка закрытия доступна, нижние кнопки достижимы прокруткой внутри окна', async ({ page }) => {
    await openCatalog(page)
    await openModalFor(page, 0)
    const close = modal(page).getByRole('button', { name: 'Закрыть', exact: true })
    await expect(close).toBeInViewport()
    const call = modal(page).getByRole('link', { name: 'Позвонить менеджеру' })
    await call.scrollIntoViewIfNeeded()
    await expect(call).toBeInViewport()
    const box = (await modal(page).getByRole('heading', { level: 3 }).boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
    await close.click()
    await expect(modal(page)).toHaveCount(0)
  })
})
