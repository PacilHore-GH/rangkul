import { expect, test } from "@playwright/test";

test("family auth, onboarding, multi-profile CRUD, and logout session", async ({ page }) => {
  const email = `family-${Date.now()}@example.com`;
  page.on("response", async (response) => {
    if (response.status() >= 400) {
      console.log(`${response.status()} ${response.url()} ${await response.text()}`);
    }
  });

  await page.goto("/register");
  await page.getByLabel("Nama Anda").fill("Ibu Rani");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi", exact: true }).fill("Password-Aman12!");
  await page.getByLabel(/Saya menyetujui/).check();
  await page.getByRole("button", { name: "Buat akun keluarga" }).click();

  await expect(page).toHaveURL(/\/app\/onboarding/);
  expect(await page.evaluate(() => document.cookie)).not.toContain("rangkul_session");

  await page.getByLabel("Nama panggilan").fill("Adit");
  await page.getByLabel(/Tahun lahir/).fill("2020");
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByLabel("Komunikasi", { exact: true }).check();
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByLabel("Dukungan visual").check();
  await page.getByLabel("Lingkungan lebih tenang").check();
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByPlaceholder(/lebih nyaman/).fill("Lebih nyaman dengan instruksi singkat.");
  await page.getByRole("button", { name: "Lanjut" }).click();
  await page.getByLabel(/Saya berwenang/).check();
  await page.getByRole("button", { name: "Selesaikan profil" }).click();

  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByText("Adit")).toBeVisible();
  await page.getByRole("link", { name: "Kelola dan tambah profil" }).click();

  await page.getByRole("button", { name: "Tambah orang yang didampingi" }).click();
  await page.getByLabel("Nama panggilan").fill("Naya");
  await page.getByLabel("Belajar").check();
  await page.getByLabel("Instruksi singkat").check();
  await page.getByLabel(/Saya berwenang/).check();
  await page.getByRole("button", { name: "Simpan profil" }).click();
  await expect(page.getByText("Naya")).toBeVisible();

  const nayaCard = page.locator("article", { hasText: "Naya" });
  await nayaCard.getByRole("button", { name: "Edit profil" }).click();
  await page.getByLabel("Nama panggilan").fill("Naya Putri");
  await page.getByRole("button", { name: "Simpan perubahan" }).click();
  await expect(page.getByText("Naya Putri")).toBeVisible();

  page.on("dialog", (dialog) => dialog.accept());
  await page.locator("article", { hasText: "Naya Putri" }).getByRole("button", { name: "Hapus profil" }).click();
  await expect(page.getByText("Naya Putri")).not.toBeVisible();
  await expect(page.getByText("Adit")).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
