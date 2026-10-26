import { expect, test } from '@playwright/test'
import { openCatalog } from './helpers'

const VIEWPORTS = [
  { width: 320, height: 640 },
  { width: 375, height: 667 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]

test.describe('Адаптивность', () => {
  for (const viewport of VIEWPORTS) {
    test(`нет горизонтального переполнения на ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openCatalog(page)
      await page.waitForLoadState('networkidle')

      const overflow = await page.evaluate(() => {
        const width = document.documentElement.clientWidth
        const offenders: string[] = []
        document.querySelectorAll('header *, main *, footer *').forEach((element) => {
          const rect = element.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) return
          if (getComputedStyle(element).position === 'fixed') return
          if (rect.right > width + 1 || rect.left < -1) {
            const label = element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40) || element.tagName
            offenders.push(`${element.tagName}: ${label} (${Math.round(rect.left)}..${Math.round(rect.right)})`)
          }
        })
        return { scrollWidth: document.documentElement.scrollWidth, width, offenders: offenders.slice(0, 8) }
      })
      expect(overflow.offenders, 'элементы выходят за границы экрана').toEqual([])
      expect(overflow.scrollWidth, 'страница шире экрана').toBeLessThanOrEqual(overflow.width)
    })
  }

  test('на 320px длинная почта и номера в блоке «Контакты» помещаются в карточку', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await openCatalog(page)
    const contacts = page.locator('#contacts')
    await contacts.scrollIntoViewIfNeeded()
    const card = (await contacts.locator('div.rounded-3xl').first().boundingBox())!
    const email = (await contacts.getByText('delovaya-obstanovka@yandex.by').boundingBox())!
    expect(email.x + email.width).toBeLessThanOrEqual(card.x + card.width + 1)
  })

  test('[BUG?] на телефоне закреплённая нижняя панель не закрывает последние элементы подвала', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await openCatalog(page)
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))

    const geometry = await page.evaluate(() => {
      const bar = document.querySelector('[data-testid="mobile-contact-bar"]')!.getBoundingClientRect()
      const lastLink = [...document.querySelectorAll('footer a')].pop()!.getBoundingClientRect()
      const footerBottom = document.querySelector('footer')!.getBoundingClientRect().bottom
      return { barTop: bar.top, lastLinkBottom: lastLink.bottom, footerBottom }
    })
    expect(geometry.lastLinkBottom, 'последняя ссылка подвала спрятана под нижней панелью').toBeLessThanOrEqual(geometry.barTop)
  })

  test('на телефоне кнопка «Наверх» не залезает на нижнюю панель', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await openCatalog(page)
    await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
    const up = (await page.getByRole('button', { name: 'Наверх' }).boundingBox())!
    const bar = (await page.getByTestId('mobile-contact-bar').boundingBox())!
    expect(up.y + up.height).toBeLessThanOrEqual(bar.y)
  })

  test('на 1440px контент не растягивается бесконечно: карточка не шире 1280 + отступы', async ({ page }) => {
    await page.setViewportSize({ width: 2200, height: 1000 })
    await openCatalog(page)
    const width = (await page.getByRole('article').first().boundingBox())!.width
    expect(width).toBeLessThanOrEqual(1280)
  })
})

test.describe('Доступность и метаданные', () => {
  test.beforeEach(async ({ page }) => {
    await openCatalog(page)
  })

  test('один заголовок h1, уникальные id, язык документа — русский', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const duplicates = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
      return ids.filter((id, index) => ids.indexOf(id) !== index)
    })
    expect(duplicates).toEqual([])
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  })

  test('у всех картинок есть alt, у всех кнопок и ссылок — доступное имя', async ({ page }) => {
    const problems = await page.evaluate(() => {
      const issues: string[] = []
      document.querySelectorAll('img').forEach((img) => {
        if (!img.getAttribute('alt')?.trim()) issues.push(`img без alt: ${img.getAttribute('src')}`)
      })
      document.querySelectorAll('a, button').forEach((el) => {
        const name =
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          el.querySelector('img')?.getAttribute('alt') ||
          el.getAttribute('title')
        if (!name) issues.push(`${el.tagName} без имени: ${el.outerHTML.slice(0, 80)}`)
      })
      return issues
    })
    expect(problems).toEqual([])
  })

  test('поле поиска связано с подписью, фильтры раскрываются с корректными aria-атрибутами', async ({ page }) => {
    await expect(page.getByLabel('Поиск по названию')).toBeVisible()
    await expect(page.getByText('Цена', { exact: true }).locator('xpath=following-sibling::button')).toHaveAttribute('aria-haspopup', 'listbox')
  })

  test('мобильная кнопка «Меню» сообщает своё состояние (aria-expanded)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const toggle = page.getByRole('button', { name: 'Меню' })
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  test('[BUG?] заголовок вкладки описывает сайт (Деловая обстановка), а не чужой проект', async ({ page }) => {
    await expect(page).toHaveTitle(/Деловая обстановка/i)
  })

  test('[BUG?] у страницы есть meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description?.trim().length ?? 0).toBeGreaterThan(20)
  })

  test('[BUG?] favicon не стандартный от Vite', async ({ page }) => {
    const href = await page.locator('link[rel~="icon"]').first().getAttribute('href')
    expect(href).not.toMatch(/vite\.svg/)
  })

  test('основные действия достижимы с клавиатуры: Tab доходит до поиска, фильтров и первой кнопки «Подробнее»', async ({ page }) => {
    const reached = new Set<string>()
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab')
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        return el ? el.getAttribute('aria-label') || el.id || el.textContent?.trim().slice(0, 30) || el.tagName : ''
      })
      reached.add(label ?? '')
    }
    for (const expected of ['catalog-search', 'Подробнее', 'Все цвета']) expect([...reached].some((label) => label.includes(expected)), expected).toBe(true)
  })
})
