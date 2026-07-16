import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useState } from "react";

import { PasswordField } from "./password-field";

function PasswordHarness({ requirements = false }: { requirements?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <PasswordField
      label="Kata sandi"
      value={value}
      onChange={setValue}
      autoComplete="new-password"
      showRequirements={requirements}
    />
  );
}

describe("PasswordField", () => {
  it("toggles password visibility without changing its value", () => {
    render(<PasswordHarness />);
    const input = screen.getByLabelText("Kata sandi");
    fireEvent.change(input, { target: { value: "Password-Aman12!" } });

    expect(input).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Tampilkan kata sandi" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("Password-Aman12!");
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan kata sandi" }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("updates every password requirement dynamically while typing", () => {
    render(<PasswordHarness requirements />);
    const input = screen.getByLabelText("Kata sandi");
    const requirements = screen.getByRole("list", { name: "Ketentuan kata sandi" });

    expect(requirements.querySelectorAll("li.met")).toHaveLength(0);
    fireEvent.change(input, { target: { value: "Password-Aman12!" } });
    expect(requirements.querySelectorAll("li.met")).toHaveLength(6);
  });
});
