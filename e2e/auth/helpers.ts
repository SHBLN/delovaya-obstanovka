import { expect, type Page } from '@playwright/test'

export type TestUser = {
  email: string
  password: string
  displayName: string
  role: string
}

export function createTestUser(prefix = 'pw'): TestUser {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  return {
    email: `${prefix}-${id}@e2e-aivibe.local`,
    password: 'E2eSecure1!',
    displayName: `E2E ${id}`,
    role: 'QA инженер',
  }
}

export function authDialog(page: Page) {
  return page.getByRole('dialog')
}

export async function openLoginModal(page: Page) {
  await page.goto('/')
  await page.getByRole('banner').getByRole('button', { name: 'Войти', exact: true }).click()
  await expect(authDialog(page).getByRole('heading', { name: /Вход в AiVibeBoard/i })).toBeVisible()
}

export async function openRegisterModal(page: Page) {
  await page.goto('/')
  await page.getByRole('banner').getByRole('button', { name: 'Начать бесплатно' }).click()
  await expect(authDialog(page).getByRole('heading', { name: 'Регистрация' })).toBeVisible()
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  const dialog = authDialog(page)
  await dialog.getByLabel('Email').fill(email)
  await dialog.getByLabel('Пароль', { exact: true }).fill(password)
}

export async function submitLogin(page: Page) {
  const dialog = authDialog(page)
  await dialog.getByRole('button', { name: 'Войти', exact: true }).click()
}

export async function fillRegisterForm(page: Page, user: TestUser, confirmPassword?: string) {
  const dialog = authDialog(page)
  await dialog.getByLabel('Имя').fill(user.displayName)
  await dialog.getByLabel('Email').fill(user.email)
  await dialog.getByLabel('Пароль', { exact: true }).fill(user.password)
  await dialog.getByLabel('Подтверждение пароля').fill(confirmPassword ?? user.password)
  await dialog.getByLabel('Роль в команде').selectOption(user.role)
}

export async function submitRegister(page: Page) {
  await authDialog(page).getByRole('button', { name: 'Создать аккаунт' }).click()
}

/** Registers via UI; returns whether user landed on /boards (session without email confirm). */
export async function registerUserViaUi(page: Page, user: TestUser): Promise<'boards' | 'email_confirmation'> {
  await openRegisterModal(page)
  await fillRegisterForm(page, user)
  await submitRegister(page)

  const dialog = authDialog(page)
  const boardsHeading = page.getByRole('heading', { name: 'Доски задач' })

  const outcome = await Promise.race([
    boardsHeading.waitFor({ state: 'visible', timeout: 45_000 }).then(() => 'boards' as const),
    dialog
      .getByRole('status')
      .filter({ hasText: /Проверьте почту|подтвердите email/i })
      .waitFor({ state: 'visible', timeout: 45_000 })
      .then(() => 'email_confirmation' as const),
    dialog.getByRole('alert').waitFor({ state: 'visible', timeout: 45_000 }).then(async () => {
      const message = (await dialog.getByRole('alert').textContent())?.trim() ?? 'unknown error'
      throw new Error(`Registration failed: ${message}`)
    }),
  ])

  return outcome
}

export async function loginViaUi(page: Page, email: string, password: string) {
  await openLoginModal(page)
  await fillLoginForm(page, email, password)
  await submitLogin(page)
}

export async function expectBoardsPageForUser(page: Page, displayName: string) {
  await expect(page).toHaveURL(/\/boards\/?$/)
  await expect(page.getByRole('heading', { name: 'Доски задач' })).toBeVisible()
  await expect(page.getByText(new RegExp(`Добро пожаловать, ${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))).toBeVisible()
}

export async function clearAuthStorage(page: Page) {
  await page.context().clearCookies()
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function signOutFromBoards(page: Page) {
  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page.getByRole('banner').getByRole('button', { name: 'Начать бесплатно' })).toBeVisible({
    timeout: 30_000,
  })
}
