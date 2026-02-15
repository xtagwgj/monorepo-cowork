import { describe, expect, it } from "vitest";

describe("electron app", () => {
  it("basic test", () => {
    expect("electron").toContain("lect");
  });
});
