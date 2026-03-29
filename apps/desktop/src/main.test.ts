import { describe, expect, it } from "vitest";

describe("desktop app", () => {
  it("basic test", () => {
    expect("tauri").toContain("aur");
  });
});
