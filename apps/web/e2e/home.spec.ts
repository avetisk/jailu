import { expect, test } from "@playwright/test"

test("home page renders the app heading", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "jailu" })).toBeVisible()
})

test("the language toggle switches the tagline between EN and FR", async ({ page }) => {
  await page.goto("/")

  // English by default (navigator locale in CI is en-US).
  await expect(page.getByText(/coming together slice by slice/u)).toBeVisible()

  await page.getByRole("button", { name: /language|langue/iu }).click()

  await expect(page.getByText(/raccourcisseur/u)).toBeVisible()
})
