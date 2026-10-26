import { expect, test } from '@playwright/test'
import {
  authDialog,
  clearAuthStorage,
  createTestUser,
  expectBoardsPageForUser,
  fillLoginForm,
  fillRegisterForm,
  loginViaUi,
  openLoginModal,
  openRegisterModal,
  registerUserViaUi,
  signOutFromBoards,
  submitLogin,
  submitRegister,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await clearAuthStorage(page)
})

test.describe('Auth — happy path', () => {
  test('registration with valid data opens boards and shows profile', async ({ page }) => {
    const user = createTestUser('reg-happy')

    const outcome = await registerUserViaUi(page, user)
    test.skip(
      outcome === 'email_confirmation',
      'Supabase requires email confirmation — instant session not available in this project',
    )

    await expectBoardsPageForUser(page, user.displayName)
    await expect(page.getByText(`Профиль: ${user.role}`)).toBeVisible()
  })

  test('login after sign-out restores session and boards access', async ({ page }) => {
    const user = createTestUser('login-happy')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await signOutFromBoards(page)
    await loginViaUi(page, user.email, user.password)
    await expectBoardsPageForUser(page, user.displayName)
  })

  test('session survives full page reload on /boards', async ({ page }) => {
    const user = createTestUser('reload')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expectBoardsPageForUser(page, user.displayName)
  })
})

test.describe('Auth — validation (client)', () => {
  test('register shows error when passwords do not match', async ({ page }) => {
    const user = createTestUser('val-mismatch')
    await openRegisterModal(page)
    await fillRegisterForm(page, user, 'AnotherPass1!')
    await submitRegister(page)

    const dialog = authDialog(page)
    await expect(dialog.getByRole('alert')).toHaveText('Пароли не совпадают.')
    await expect(page).toHaveURL('/')
  })

  test('register rejects password shorter than 6 characters', async ({ page }) => {
    const user = createTestUser('val-short')
    user.password = 'abc12'
    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await submitRegister(page)

    await expect(authDialog(page).getByRole('alert')).toHaveText(
      'Пароль должен быть не короче 6 символов.',
    )
  })

  test('switching auth tab clears previous validation error', async ({ page }) => {
    await openRegisterModal(page)
    const user = createTestUser('val-tab')
    await fillRegisterForm(page, user, 'x')
    await submitRegister(page)
    await expect(authDialog(page).getByRole('alert')).toBeVisible()

    await authDialog(page).getByRole('button', { name: 'Вход', exact: true }).click()
    await expect(authDialog(page).getByRole('alert')).toHaveCount(0)
  })
})

test.describe('Auth — negative / credentials', () => {
  test('login with wrong password shows localized error', async ({ page }) => {
    const user = createTestUser('neg-wrong-pw')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await signOutFromBoards(page)
    await openLoginModal(page)
    await fillLoginForm(page, user.email, 'WrongPassword99!')
    await submitLogin(page)

    await expect(authDialog(page).getByRole('alert')).toHaveText('Неверный email или пароль.')
    await expect(page).toHaveURL('/')
  })

  test('login with unknown email shows invalid credentials message', async ({ page }) => {
    await openLoginModal(page)
    await fillLoginForm(page, `nobody-${Date.now()}@e2e-aivibe.local`, 'E2eSecure1!')
    await submitLogin(page)

    await expect(authDialog(page).getByRole('alert')).toHaveText('Неверный email или пароль.')
  })

  test('duplicate registration shows already registered error', async ({ page }) => {
    const user = createTestUser('dup')
    user.email = `dup-reg-${user.email}`

    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await submitRegister(page)

    const dialog = authDialog(page)
    const duplicateAlert = dialog.getByRole('alert').filter({ hasText: /уже зарегистрирован/i })
    const boardsHeading = page.getByRole('heading', { name: 'Доски задач' })

    await expect(duplicateAlert.or(boardsHeading)).toBeVisible({ timeout: 45_000 })

    if (await boardsHeading.isVisible()) {
      await signOutFromBoards(page)
    }

    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await submitRegister(page)

    await expect(dialog.getByRole('alert')).toHaveText('Пользователь с таким email уже зарегистрирован.')
  })
})

test.describe('Auth — route protection & unauthenticated access', () => {
  test('direct navigation to /boards redirects anonymous user to landing', async ({ page }) => {
    await page.goto('/boards')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('banner').getByRole('button', { name: 'Начать бесплатно' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Доски задач' })).toHaveCount(0)
  })

  test('authenticated user can open /boards by URL', async ({ page }) => {
    const user = createTestUser('direct-url')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await page.goto('/boards')
    await expectBoardsPageForUser(page, user.displayName)
  })
})

test.describe('Auth — loading & double submit', () => {
  test('login submit disables button and shows loading label', async ({ page }) => {
    const user = createTestUser('loading')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await signOutFromBoards(page)

    let releaseHeldRequest!: () => void
    const holdTokenRequest = new Promise<void>((resolve) => {
      releaseHeldRequest = resolve
    })

    await page.route('**/auth/v1/token**', async (route) => {
      await holdTokenRequest
      await route.continue()
    })

    await openLoginModal(page)
    await fillLoginForm(page, user.email, user.password)

    const dialog = authDialog(page)
    const submit = dialog.getByRole('button', { name: 'Войти', exact: true })

    const tokenRequest = page.waitForRequest(
      (req) => req.url().includes('/auth/v1/token') && req.method() === 'POST',
    )
    void submit.click()
    await tokenRequest
    const loadingSubmit = dialog.getByRole('button', { name: 'Входим…' })
    await expect(loadingSubmit).toBeDisabled()
    await expect(loadingSubmit).toBeVisible()
    releaseHeldRequest()
    await expect(page).toHaveURL(/\/boards/, { timeout: 45_000 })
  })

  test('rapid double click on login sends only one token request', async ({ page }) => {
    const user = createTestUser('double')
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await signOutFromBoards(page)
    await openLoginModal(page)
    await fillLoginForm(page, user.email, user.password)

    let tokenPosts = 0
    page.on('request', (req) => {
      if (req.url().includes('/auth/v1/token') && req.method() === 'POST') {
        tokenPosts += 1
      }
    })

    const submit = authDialog(page).getByRole('button', { name: 'Войти', exact: true })
    await submit.dblclick()
    await expect(page).toHaveURL(/\/boards/, { timeout: 45_000 })

    expect(tokenPosts).toBe(1)
  })
})

test.describe('Auth — API error surface', () => {
  test('failed auth API shows user-visible error in modal', async ({ page }) => {
    await page.route('**/auth/v1/token?grant_type=password**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'server_error', error_description: 'upstream down' }),
      }),
    )

    await openLoginModal(page)
    await fillLoginForm(page, 'any@e2e-aivibe.local', 'E2eSecure1!')
    await submitLogin(page)

    await expect(authDialog(page).getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL('/')
  })
})

test.describe('Auth — email confirmation path', () => {
  test('when Supabase returns no session, user sees confirm-email message and login tab', async ({
    page,
  }) => {
    const user = createTestUser('confirm-flow')
    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await submitRegister(page)

    const dialog = authDialog(page)
    const confirmStatus = dialog.getByRole('status').filter({ hasText: /Проверьте почту|подтвердите email/i })
    const boardsHeading = page.getByRole('heading', { name: 'Доски задач' })
    const errorAlert = dialog.getByRole('alert')

    await expect(confirmStatus.or(boardsHeading).or(errorAlert)).toBeVisible({ timeout: 45_000 })

    if (await errorAlert.isVisible()) {
      const message = (await errorAlert.textContent()) ?? ''
      test.skip(message.includes('много попыток') || /rate limit/i.test(message), 'Supabase rate limit')
      throw new Error(`Unexpected registration error: ${message}`)
    }

    if (await boardsHeading.isVisible()) {
      await expectBoardsPageForUser(page, user.displayName)
      return
    }

    await expect(confirmStatus).toContainText(/Проверьте почту|подтвердите email/i)
    await expect(dialog.getByRole('heading', { name: /Вход в AiVibeBoard/i })).toBeVisible()
  })
})
