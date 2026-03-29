import { describe, expect, it } from "vitest";
import { resolveLocale } from "./useI18n";

describe("resolveLocale", () => {
  it("uses zh for chinese locales", () => {
    expect(resolveLocale("zh-CN")).toBe("zh");
    expect(resolveLocale("zh-TW")).toBe("zh");
  });

  it("falls back to en for other locales", () => {
    expect(resolveLocale("en-US")).toBe("en");
    expect(resolveLocale("ja-JP")).toBe("en");
    expect(resolveLocale(undefined)).toBe("en");
  });
});
