import { expect, test } from "@playwright/test"

test("home page renders the app heading", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "jai.lu" })).toBeVisible()
})

test("the language toggle switches the tagline between EN and FR", async ({ page }) => {
  await page.goto("/")

  // English by default (navigator locale in CI is en-US).
  await expect(page.getByText(/shorter is better/u)).toBeVisible()

  await page.getByRole("button", { name: /language|langue/iu }).click()

  await expect(page.getByText(/plus court/u)).toBeVisible()
})
