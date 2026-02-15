import { describe, expect, it } from "vitest";
import uiPlugin from "./index";

describe("ui plugin", () => {
  it("has install function", () => {
    expect(typeof uiPlugin.install).toBe("function");
  });
});
