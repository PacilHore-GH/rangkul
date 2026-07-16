import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { api, push } = vi.hoisted(() => ({ api: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api", () => ({ api, ApiError: class ApiError extends Error {} }));

import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  beforeEach(() => {
    api.mockReset();
    push.mockReset();
  });

  it("shows a validation exception and does not submit an invalid email", () => {
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test123@mailashiodoiashd" } });
    fireEvent.change(screen.getByLabelText(/Kata sandi/), { target: { value: "password-aman12" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Masukkan alamat email yang valid");
    expect(api).not.toHaveBeenCalled();
  });

  it("rejects a weak password on registration before calling the API", () => {
    render(<AuthForm mode="register" />);
    fireEvent.change(screen.getByLabelText("Nama Anda"), { target: { value: "Ibu Rani" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ibu@mail.com" } });
    fireEvent.change(screen.getByLabelText(/Kata sandi/), { target: { value: "password1234" } });
    fireEvent.click(screen.getByLabelText(/Saya menyetujui/));
    fireEvent.click(screen.getByRole("button", { name: "Buat akun keluarga" }));

    expect(screen.getByRole("alert")).toHaveTextContent("huruf besar, huruf kecil, angka, dan simbol");
    expect(api).not.toHaveBeenCalled();
  });

  it("sends normalized and sanitized registration fields", async () => {
    api.mockResolvedValue({ has_profile: false, onboarding_completed: false });
    render(<AuthForm mode="register" />);
    fireEvent.change(screen.getByLabelText("Nama Anda"), { target: { value: " <b>Ibu</b>\u0000  Rani " } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " IBU@MAIL.COM " } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "Password-Aman12!" } });
    fireEvent.click(screen.getByLabelText(/Saya menyetujui/));
    fireEvent.click(screen.getByRole("button", { name: "Buat akun keluarga" }));

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
    const request = api.mock.calls[0][1];
    expect(JSON.parse(request.body)).toMatchObject({
      email: "ibu@mail.com",
      full_name: "Ibu Rani",
      password: "Password-Aman12!",
    });
  });

  it("uses the onboarding milestone instead of profile existence after login", async () => {
    api.mockResolvedValue({ has_profile: false, onboarding_completed: true });
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ibu@mail.com" } });
    fireEvent.change(screen.getByLabelText("Kata sandi"), { target: { value: "Password-Aman12!" } });
    fireEvent.click(screen.getByRole("button", { name: "Masuk" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/app/dashboard"));
    expect(push).not.toHaveBeenCalledWith("/app/onboarding");
  });
});
