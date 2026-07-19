import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { axe } from "jest-axe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";

const login = vi.fn();
const loginWithoutTotp = vi.fn();

vi.mock("../contexts/useAuth", () => ({
  useAuth: () => ({ login, loginWithoutTotp }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    login.mockReset();
    loginWithoutTotp.mockReset();
    loginWithoutTotp.mockResolvedValue({ needsTotp: false, employeeId: 7 });
    login.mockResolvedValue({
      employee_id: 7,
      employee_code: "EMP007",
      full_name: "Test Employee",
      role: "employee",
    });
  });

  it("has no automated accessibility violations", async () => {
    const { container } = render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("labels every credential and supports the full TOTP login flow", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);

    await user.type(screen.getByLabelText("Employee Code"), "emp007");
    await user.type(screen.getByLabelText("Password"), "strong-password");
    await user.type(screen.getByLabelText("Authenticator Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(loginWithoutTotp).toHaveBeenCalledWith("EMP007", "strong-password");
    expect(login).toHaveBeenCalledWith("EMP007", "strong-password", "123456");
  });

  it("exposes password visibility as an accessible toggle", async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const password = screen.getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeVisible();
  });
});
