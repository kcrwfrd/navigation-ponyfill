import { test, expect } from '@playwright/test'

test.describe('Hashchange Navigation', () => {
  test.describe('Hash Link Navigation', () => {
    test('clicking hash link updates canGoBack to true', async ({ page }) => {
      // Navigate directly to user page
      await page.goto('/users/1')
      await expect(page.getByText('canGoBack: false')).toBeVisible()

      // Click a hash link
      await page.getByRole('link', { name: 'Posts' }).click()

      // URL should have hash
      await expect(page).toHaveURL('/users/1#posts')

      // canGoBack should now be true since we have a history entry
      await expect(page.getByText('canGoBack: true')).toBeVisible()
    })

    test('hash navigation shows correct previousPath', async ({ page }) => {
      await page.goto('/users/1')

      // Click hash link
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      // previousPath should be the page without hash
      await expect(page.getByText('prev: /users/1')).toBeVisible()
    })

    test('multiple hash navigations increment history', async ({ page }) => {
      await page.goto('/users/1')
      const initialLength = await page.evaluate(() => window.history.length)

      // Click multiple hash links
      await page.getByRole('link', { name: 'Profile' }).click()
      await expect(page).toHaveURL('/users/1#profile')

      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      await page.getByRole('link', { name: 'Stats' }).click()
      await expect(page).toHaveURL('/users/1#stats')

      // History length should have increased by 3
      const finalLength = await page.evaluate(() => window.history.length)
      expect(finalLength).toBe(initialLength + 3)

      // canGoBack should be true
      await expect(page.getByText('canGoBack: true')).toBeVisible()
    })
  })

  test.describe('Browser Back/Forward with Hash', () => {
    test('browser back from hash returns to page without hash', async ({
      page,
    }) => {
      await page.goto('/users/1')
      await expect(page.getByText('canGoBack: false')).toBeVisible()

      // Click hash link
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')
      await expect(page.getByText('canGoBack: true')).toBeVisible()

      // Go back
      await page.goBack()

      // Should return to page without hash
      await expect(page).toHaveURL('/users/1')
      await expect(page.getByText('canGoBack: false')).toBeVisible()
    })

    test('browser forward returns to hash entry (traverse, not push)', async ({
      page,
    }) => {
      await page.goto('/users/1')

      // Navigate to hash
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      const lengthAfterHash = await page.evaluate(() => window.history.length)

      // Go back
      await page.goBack()
      await expect(page).toHaveURL('/users/1')

      // Go forward - should traverse to existing entry, not create new one
      await page.goForward()
      await expect(page).toHaveURL('/users/1#posts')
      await expect(page.getByText('canGoBack: true')).toBeVisible()

      // History length should be unchanged (traverse, not push)
      const lengthAfterForward = await page.evaluate(
        () => window.history.length,
      )
      expect(lengthAfterForward).toBe(lengthAfterHash)
    })

    test('back through multiple hash entries', async ({ page }) => {
      await page.goto('/users/1')

      // Build up hash navigation chain
      await page.getByRole('link', { name: 'Profile' }).click()
      await expect(page).toHaveURL('/users/1#profile')

      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      await page.getByRole('link', { name: 'Stats' }).click()
      await expect(page).toHaveURL('/users/1#stats')

      // Go back through all entries
      await page.goBack()
      await expect(page).toHaveURL('/users/1#posts')

      await page.goBack()
      await expect(page).toHaveURL('/users/1#profile')

      await page.goBack()
      await expect(page).toHaveURL('/users/1')

      // canGoBack should now be false
      await expect(page.getByText('canGoBack: false')).toBeVisible()
    })
  })

  test.describe('Hash + Page Navigation', () => {
    test('page navigation after hash preserves history', async ({ page }) => {
      // Start at home
      await page.goto('/')

      // Navigate to user page (use first match to avoid ambiguity)
      await page.getByRole('link', { name: 'Alex Thompson' }).first().click()
      await expect(page).toHaveURL('/users/1')

      // Click hash link
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      // Navigate to a post from the user page
      await page
        .getByRole('link', { name: 'Getting Started with React' })
        .click()
      await expect(page).toHaveURL('/posts/1')

      // Go back should return to hash entry
      await page.goBack()
      await expect(page).toHaveURL('/users/1#posts')

      // Go back again should return to user page without hash
      await page.goBack()
      await expect(page).toHaveURL('/users/1')
    })

    test('hash navigation after in-app navigation works correctly', async ({
      page,
    }) => {
      await page.goto('/')

      // In-app navigation to user page (use first match to avoid ambiguity)
      await page.getByRole('link', { name: 'Alex Thompson' }).first().click()
      await expect(page).toHaveURL('/users/1')
      await expect(page.getByText('canGoBack: true')).toBeVisible()
      await expect(page.getByText('prev: /')).toBeVisible()

      // Hash navigation
      await page.getByRole('link', { name: 'Stats' }).click()
      await expect(page).toHaveURL('/users/1#stats')
      await expect(page.getByText('canGoBack: true')).toBeVisible()
      await expect(page.getByText('prev: /users/1')).toBeVisible()
    })
  })

  test.describe('Direct URL Access with Hash', () => {
    test('direct navigation to URL with hash shows correct state', async ({
      page,
    }) => {
      // Navigate directly to URL with hash
      await page.goto('/users/1#posts')

      // Should be at the hash URL
      await expect(page).toHaveURL('/users/1#posts')

      // canGoBack should be false (direct access)
      await expect(page.getByText('canGoBack: false')).toBeVisible()

      // No previous path should be shown
      await expect(page.getByText(/prev:/)).not.toBeVisible()
    })

    test('hash navigation after direct hash access works', async ({ page }) => {
      // Navigate directly to URL with hash
      await page.goto('/users/1#posts')
      await expect(page.getByText('canGoBack: false')).toBeVisible()

      // Click another hash link
      await page.getByRole('link', { name: 'Stats' }).click()
      await expect(page).toHaveURL('/users/1#stats')

      // canGoBack should now be true
      await expect(page.getByText('canGoBack: true')).toBeVisible()

      // Go back should return to original hash
      await page.goBack()
      await expect(page).toHaveURL('/users/1#posts')
    })
  })

  test.describe('Same Hash Click', () => {
    test('clicking same hash link multiple times does not add entries', async ({
      page,
    }) => {
      await page.goto('/users/1')

      // Click hash link
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      const lengthAfterFirst = await page.evaluate(() => window.history.length)

      // Click same hash link again
      await page.getByRole('link', { name: 'Posts' }).click()
      await expect(page).toHaveURL('/users/1#posts')

      // History length should be unchanged
      const lengthAfterSecond = await page.evaluate(() => window.history.length)
      expect(lengthAfterSecond).toBe(lengthAfterFirst)
    })
  })
})
