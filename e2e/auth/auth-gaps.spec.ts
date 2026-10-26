import { expect, test } from '@playwright/test'
import {
  authDialog,
  clearAuthStorage,
  createTestUser,
  expectBoardsPageForUser,
  fillRegisterForm,
  openRegisterModal,
  registerUserViaUi,
  submitRegister,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await clearAuthStorage(page)
})

/** Second-pass scenarios: ways to break auth that basic flows might miss. */
test.describe('Auth — gap coverage (second pass)', () => {
  test('register trims display name in welcome message on boards', async ({ page }) => {
    const user = createTestUser('trim-name')
    user.displayName = '  Trim Me  '
    const outcome = await registerUserViaUi(page, user)
    test.skip(outcome === 'email_confirmation', 'Email confirmation required')

    await expectBoardsPageForUser(page, 'Trim Me')
  })

  test('closing modal with Escape does not authenticate user', async ({ page }) => {
    const user = createTestUser('escape')
    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await page.keyboard.press('Escape')
    await expect(authDialog(page)).toHaveCount(0)
    await page.goto('/boards')
    await expect(page).toHaveURL('/')
  })

  test('register with empty display name still submits when browser validation bypassed', async ({
    page,
  }) => {
    const user = createTestUser('empty-name')
    await openRegisterModal(page)
    await fillRegisterForm(page, user)
    await authDialog(page).getByLabel('Имя').fill('')
    await authDialog(page).getByLabel('Имя').evaluate((el) => el.removeAttribute('required'))
    await submitRegister(page)

    const alert = authDialog(page).getByRole('alert')
    const boards = page.getByRole('heading', { name: 'Доски задач' })
    await expect(alert.or(boards)).toBeVisible({ timeout: 45_000 })
  })
})
