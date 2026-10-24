import { describe, expect, it } from "vitest";
import { emailRetryDelayMs } from "@/lib/email/retry";

describe("emailRetryDelayMs", () => {
  it("uses capped exponential backoff", () => {
    expect(emailRetryDelayMs(1)).toBe(2 * 60_000);
    expect(emailRetryDelayMs(3)).toBe(8 * 60_000);
    expect(emailRetryDelayMs(20)).toBe(60 * 60_000);
  });
});
