import { beforeEach, describe, expect, test } from "vitest";
import { validateRegName } from "../public/js/register.js";
import { registerBtn } from "../public/js/login.js";

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
  });
});
