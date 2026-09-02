import { test, expect } from "@playwright/test";

test.describe("Catalog", () => {
  test("Add product button is disabled until required fields are valid", async ({ page }) => {
    await page.goto("/products");
    const submit = page.getByRole("button", { name: /add product/i });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Name").fill("Sample Item");
    await page.getByLabel("Price").fill("9.99");
    await page.getByLabel("Stock").fill("5");

    await expect(submit).toBeEnabled();
  });

  test("removing a product asks for confirmation first", async ({ page }) => {
    await page.goto("/products");
    const removeButtons = page.getByRole("button", { name: /remove/i });
    if (await removeButtons.count() === 0) test.skip();

    await removeButtons.first().click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
  });
});
