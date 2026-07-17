import { expect, test } from "@playwright/test";

test("family auth, onboarding, multi-profile CRUD, and logout session", async ({
  page,
}) => {
  const email = `family-${Date.now()}@example.com`;

  page.on("response", async (response) => {
    if (response.status() >= 400) {
      console.log(
        `${response.status()} ${response.url()} ${await response.text()}`,
      );
    }
  });

  await page.goto("/register");
  await expect(page).toHaveURL(/\/register\/role/);

  await page
    .getByRole("radio", { name: /Keluarga & caregiver/ })
    .click();

  await page
    .getByRole("button", { name: "Lanjutkan pendaftaran" })
    .click();

  await expect(page).toHaveURL(/\/register\/account\?role=family/);

  await page.getByLabel("Nama Anda").fill("Ibu Rani");
  await page.getByLabel("Email").fill(email);

  await page
    .getByRole("textbox", {
      name: "Kata sandi",
      exact: true,
    })
    .fill("Password-Aman12!");

  await page.getByLabel(/Saya menyetujui/).check();

  await page
    .getByRole("button", { name: "Buat akun keluarga" })
    .click();

  await expect(page).toHaveURL(/\/app\/onboarding/);

  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "rangkul_session",
  );

  await page.getByLabel("Nama panggilan").fill("Adit");
  await page.getByLabel(/Tahun lahir/).fill("2020");
  await page.getByLabel("Hubungan Anda").selectOption("parent");

  await page.reload();

  await expect(
    page.getByText("Draft onboarding dipulihkan."),
  ).toBeVisible();

  await expect(page.getByLabel("Nama panggilan")).toHaveValue("Adit");

  await page.getByRole("button", { name: "Lanjut" }).click();

  await page.getByLabel("Komunikasi", { exact: true }).check();

  await page.getByRole("button", { name: "Lanjut" }).click();

  await page.getByLabel("Dukungan visual").check();
  await page.getByLabel("Lingkungan lebih tenang").check();

  await page.getByRole("button", { name: "Lanjut" }).click();

  await page
    .getByPlaceholder(/lebih nyaman/)
    .fill("Lebih nyaman dengan instruksi singkat.");

  await page.getByRole("button", { name: "Lanjut" }).click();

  await page.getByLabel(/Saya berwenang/).check();

  await page
    .getByRole("button", { name: "Selesaikan profil" })
    .click();

  await expect(page).toHaveURL(/\/app\/dashboard/);
  await expect(page.getByRole("heading", { name: "Adit" })).toBeVisible();
  await expect(page.getByText("Kelengkapan profil")).toBeVisible();

  await page
    .getByRole("link", { name: "Tambah atau kelola profil" })
    .click();

  await page
    .getByRole("button", {
      name: "Tambah orang yang didampingi",
    })
    .click();

  await page.getByLabel("Nama panggilan").fill("Naya");
  await page.getByLabel("Hubungan Anda").selectOption("guardian");
  await page.getByLabel("Belajar").check();
  await page.getByLabel("Instruksi singkat").check();
  await page.getByLabel(/Saya berwenang/).check();

  await page
    .getByRole("button", { name: "Simpan profil" })
    .click();

  await expect(page.getByText("Naya", { exact: true })).toBeVisible();

  const nayaCard = page.locator("article", {
    hasText: "Naya",
  });

  await nayaCard
    .getByRole("button", { name: "Edit profil" })
    .click();

  await page.getByLabel("Nama panggilan").fill("Naya Putri");

  await page
    .getByRole("button", { name: "Simpan perubahan" })
    .click();

  await expect(
    page.getByText("Naya Putri", { exact: true }),
  ).toBeVisible();

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  const nayaPutriCard = page.locator("article", {
    hasText: "Naya Putri",
  });

  await nayaPutriCard
    .getByRole("button", { name: "Hapus profil" })
    .click();

  await expect(nayaPutriCard).not.toBeVisible();
  await expect(page.getByText("Adit", { exact: true })).toBeVisible();

  await page
    .locator("header")
    .getByRole("button", {
      name: "Keluar",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/login/);

  await page.goto("/app/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("admin login and facility external-data CRUD", async ({ page }) => {
  await page.goto("/admin/login");

  await page.getByLabel("Email Admin").fill("admin@rangkul.id");

  await page
    .getByRole("textbox", {
      name: "Kata sandi Admin",
      exact: true,
    })
    .fill("Password-Admin12!");

  await page
    .getByRole("button", { name: "Masuk sebagai Admin" })
    .click();

  await expect(page).toHaveURL(/\/admin$/);

  await page
    .getByLabel("Nama", { exact: true })
    .fill("RS Demo Rangkul");

  await page
    .getByRole("textbox", {
      name: "Layanan, pisahkan dengan koma",
    })
    .fill("Terapi okupasi, Psikologi");

  await page.getByLabel("Alamat").fill("Jl. Demo No. 1");
  await page.getByLabel("Kota").fill("Bandung");
  await page.getByLabel("Provinsi").fill("Jawa Barat");
  await page.getByLabel("Nama sumber").fill("Data Demo");
  await page
    .getByLabel("URL sumber")
    .fill("https://example.com/source");

  await page
    .getByRole("button", { name: "Simpan fasilitas" })
    .click();

  const facility = page.locator("article", {
    hasText: "RS Demo Rangkul",
  });

  await expect(facility).toBeVisible();

  await facility
    .getByRole("button", {
      name: "Edit",
      exact: true,
    })
    .click();

  await page.getByLabel(/Tampilkan kepada keluarga/).uncheck();

  await page
    .getByRole("button", { name: "Simpan fasilitas" })
    .click();

  await expect(facility).toContainText("Nonaktif");

  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await facility
    .getByRole("button", {
      name: "Hapus",
      exact: true,
    })
    .click();

  await expect(facility).not.toBeVisible();

  await page
    .locator("header")
    .getByRole("button", {
      name: "Keluar",
      exact: true,
    })
    .click();

  await expect(page).toHaveURL(/\/admin\/login/);
});
