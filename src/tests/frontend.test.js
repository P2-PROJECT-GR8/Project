import { beforeEach, describe, expect, test, vi } from "vitest";
import { validateRegName } from "../public/js/register.js";

vi.mock("../public/js/navRenderer.js", () => ({
  basicRenderHeader: () => {},
  renderHeader: () => {},
}));

describe("Validate input when registering username", () => {
  test("Empty username", () => {
    expect(validateRegName("")).toBe("Please type desired username!");
  });

  test("Too short username", () => {
    expect(validateRegName("A")).toBe(
      "Invalid username. Usernames must be between 2 and 10 characters long",
    );
  });

  test("Too long username", () => {
    expect(validateRegName("Alexandrian")).toBe(
      "Invalid username. Usernames must be between 2 and 10 characters long",
    );
  });
  test("Floating values", () => {
    expect(validateRegName("  ")).toBeNull();
  });
});

describe("register button request", () => {
  test("Will call the register button, with the correct data", async () => {
    document.body.innerHTML = `<input id="registerUserNameInput" />
        <button id="createUser"></button>
        <div id="ErrorMsg"></div>`;
    // Arrange

    // Act
    await import("../public/js/login.js");

    document.dispatchEvent(new Event("DOMContentLoaded"));

    const input = document.getElementById("registerUserNameInput");
    input.value = "testuser";

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "ok" }),
      }),
    );

    const button = document.getElementById("createUser");
    button.click();

    // Assert
    expect(fetch).toHaveBeenCalled();

    expect(fetch.mock.calls[0][0]).toBe("/register");

    expect(fetch.mock.calls[0][1].method).toBe("POST");

    const body = fetch.mock.calls[0][1].body;
    const parsed = JSON.parse(body);

    expect(parsed.userName).toBe("testuser");
    expect(parsed.login).toBe(true);
  });
});
