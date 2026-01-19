import { test, expect } from '@playwright/test'

// Post 1: "Getting Started with React Server Components" by Alex Thompson (user 1)
const POST_1_TITLE = 'Getting Started with React Server Components'
const USER_1_NAME = 'Alex Thompson'

test.describe('canGoBack Detection', () => {
  test('canGoBack is false on direct URL access', async ({ page }) => {
    // Navigate directly to a post page
    await page.goto('/posts/1')

    // Should show canGoBack: false since we navigated directly
    await expect(page.getByText('canGoBack: false')).toBeVisible()
  })

  test('canGoBack is true after in-app navigation', async ({ page }) => {
    // Start from home
    await page.goto('/')
    await expect(page.getByText('canGoBack: false')).toBeVisible()

    // Click on a post to navigate
    await page.getByRole('link', { name: POST_1_TITLE }).click()

    // Wait for navigation and check canGoBack is now true
    await expect(page).toHaveURL('/posts/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()
  })

  test('canGoBack remains true through navigation chain', async ({ page }) => {
    // Start from home
    await page.goto('/')

    // Navigate to post
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()

    // Navigate to user profile from the post page
    await page.getByRole('link', { name: USER_1_NAME }).click()
    await expect(page).toHaveURL('/users/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()
  })
})

test.describe('Smart Back Button', () => {
  test('back button not visible on home page', async ({ page }) => {
    await page.goto('/')

    // Back button should not be visible on home page
    await expect(page.getByRole('link', { name: 'Go back' })).not.toBeVisible()
  })

  test('back button visible on other pages', async ({ page }) => {
    await page.goto('/posts/1')

    // Back button should be visible on non-home pages
    await expect(page.getByRole('link', { name: 'Go back' })).toBeVisible()
  })

  test('back button uses history.back() when canGoBack is true', async ({
    page,
  }) => {
    // Navigate from home to post via in-app navigation
    await page.goto('/')
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()

    // Click back button - should use history.back()
    await page.getByRole('link', { name: 'Go back' }).click()

    // Should return to the previous page (home)
    await expect(page).toHaveURL('/')
  })

  test('back button uses fallback URL when canGoBack is false', async ({
    page,
  }) => {
    // Navigate directly to a post page
    await page.goto('/posts/1')
    await expect(page.getByText('canGoBack: false')).toBeVisible()

    // Click back button - should use fallback URL (/)
    await page.getByRole('link', { name: 'Go back' }).click()

    // Should navigate to fallback URL (home)
    await expect(page).toHaveURL('/')
  })
})

test.describe('Browser Navigation', () => {
  test('browser back button works correctly', async ({ page }) => {
    // Navigate from home to post
    await page.goto('/')
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')

    // Use browser back button
    await page.goBack()

    // Should return to home
    await expect(page).toHaveURL('/')
  })

  test('browser forward button works correctly', async ({ page }) => {
    // Navigate from home to post
    await page.goto('/')
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')

    // Go back
    await page.goBack()
    await expect(page).toHaveURL('/')

    // Go forward
    await page.goForward()
    await expect(page).toHaveURL('/posts/1')
  })

  test('navigation state updates on popstate events', async ({ page }) => {
    // Navigate home -> post -> user
    await page.goto('/')
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')
    await page.getByRole('link', { name: USER_1_NAME }).click()
    await expect(page).toHaveURL('/users/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()

    // Use browser back - should still have canGoBack: true
    await page.goBack()
    await expect(page).toHaveURL('/posts/1')
    await expect(page.getByText('canGoBack: true')).toBeVisible()

    // Go back to home
    await page.goBack()
    await expect(page).toHaveURL('/')
    await expect(page.getByText('canGoBack: false')).toBeVisible()
  })
})

test.describe('Previous Path Tracking', () => {
  test('previousPath shows correct value after navigation', async ({
    page,
  }) => {
    // Start from home
    await page.goto('/')

    // Navigate to post
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')

    // Should show previousPath as /
    await expect(page.getByText('prev: /')).toBeVisible()
  })

  test('previousPath updates through navigation chain', async ({ page }) => {
    // Start from home
    await page.goto('/')

    // Navigate to post
    await page.getByRole('link', { name: POST_1_TITLE }).click()
    await expect(page).toHaveURL('/posts/1')
    await expect(page.getByText('prev: /')).toBeVisible()

    // Navigate to user
    await page.getByRole('link', { name: USER_1_NAME }).click()
    await expect(page).toHaveURL('/users/1')

    // previousPath should be the post page
    await expect(page.getByText('prev: /posts/1')).toBeVisible()
  })

  test('previousPath is not shown on direct URL access', async ({ page }) => {
    // Navigate directly to a post page
    await page.goto('/posts/1')

    // There should be no prev: text shown (no previous path)
    await expect(page.getByText(/prev:/)).not.toBeVisible()
  })
})
