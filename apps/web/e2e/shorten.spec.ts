import { expect, test } from "@playwright/test"

// The web e2e suite runs against the static SPA (vite preview in CI) with no API process, so the
// success/error paths mock POST /api/links at the network layer. The validation path needs no
// mock: the shared schema rejects client-side before any request is made.
const validUrl = "https://example.com/some/very/long/marketing/path?utm=1"
const shortUrl = "http://127.0.0.1:5173/Ab3xK9"

const submitButton = { name: /^(shorten|raccourcir)$/iu }

test("rejects an invalid URL client-side without calling the API", async ({ page }) => {
  let requested = false
  await page.route("**/api/links", async (route) => {
    requested = true
    await route.abort()
  })

  await page.goto("/")
  await page.getByRole("textbox").fill("not a url")
  await page.getByRole("button", submitButton).click()

  await expect(page.getByRole("alert")).toHaveText(/valid URL|URL valide/u)
  expect(requested).toBe(false)
})

test("shortens a URL and copies the minted link", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"])
  await page.route("**/api/links", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ linkCode: "Ab3xK9", url: shortUrl, originalUrl: validUrl }),
    })
  })

  await page.goto("/")
  await page.getByRole("textbox").fill(validUrl)
  await page.getByRole("button", submitButton).click()

  await expect(page.getByRole("textbox")).toHaveValue(shortUrl)

  await page.getByRole("button", { name: /^(copy|copier)$/iu }).click()
  await expect(page.getByRole("button", { name: /^(copied|copié)$/iu })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(shortUrl)
})

test("surfaces a generic error when the API request fails", async ({ page }) => {
  await page.route("**/api/links", async (route) => {
    await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({}) })
  })

  await page.goto("/")
  await page.getByRole("textbox").fill(validUrl)
  await page.getByRole("button", submitButton).click()

  await expect(page.getByRole("alert")).toHaveText(/went wrong|erreur/u)
})
