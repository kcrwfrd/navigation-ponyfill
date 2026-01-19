import { test, expect, type Page } from '@playwright/test'

const POST_NAME = 'Getting Started with React Server Components'

test.describe('Post Page', () => {
  test.describe('Back Button', () => {
    test('should take you back to the home page when you came from home page', async ({
      page,
    }) => {
      await page.goto('/')
      await page.getByRole('link', { name: POST_NAME }).click()
      await expect(page).toHaveURL('/posts/1')

      const prevLength = await page.evaluate(() => window.history.length)

      await back(page)

      await expect(page).toHaveURL('/')
      const currentLength = await page.evaluate(() => window.history.length)
      expect(currentLength).toBe(prevLength)

      await page.goForward()
      await expect(page).toHaveURL('/posts/1')
    })

    test('should take you back to the user profile when you came from there', async ({
      page,
    }) => {
      await page.goto('/users/1')
      await page.getByRole('link', { name: POST_NAME }).click()
      await expect(page).toHaveURL('/posts/1')

      const prevLength = await page.evaluate(() => window.history.length)

      await back(page)

      await expect(page).toHaveURL('/users/1')
      const currentLength = await page.evaluate(() => window.history.length)
      expect(currentLength).toBe(prevLength)

      await page.goForward()
      await expect(page).toHaveURL('/posts/1')
    })
  })
})

async function back(page: Page) {
  const promise = page.evaluate(popstate)
  await page.getByRole('link', { name: 'Go back' }).click()
  await promise
}

async function popstate() {
  return new Promise<void>((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true })
  })
}
