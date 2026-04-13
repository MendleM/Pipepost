import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCredits, hasCredits, useCredit, addCredits } from "../src/credits.js";
import * as config from "../src/config.js";

vi.mock("../src/config.js");

const mockConfig = vi.mocked(config);

beforeEach(() => {
  vi.restoreAllMocks();
  mockConfig.readConfig.mockReturnValue({});
  mockConfig.writeConfig.mockReturnValue(undefined);
});

function mockMonth(month: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(`${month}-15T12:00:00Z`));
}

describe("getCredits", () => {
  it("returns 3 free credits when no config exists", () => {
    mockMonth("2026-04");
    const result = getCredits();
    expect(result).toEqual({ balance: 0, freeRemaining: 3, total: 3 });
    vi.useRealTimers();
  });

  it("returns correct balance with purchased credits", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 10, free_credits: 2, free_month: "2026-04" },
    });
    const result = getCredits();
    expect(result).toEqual({ balance: 10, freeRemaining: 2, total: 12 });
    vi.useRealTimers();
  });

  it("resets free credits on new month", () => {
    mockMonth("2026-05");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 5, free_credits: 0, free_month: "2026-04" },
    });
    const result = getCredits();
    expect(result).toEqual({ balance: 5, freeRemaining: 3, total: 8 });
    vi.useRealTimers();
  });
});

describe("hasCredits", () => {
  it("returns true when free credits available", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({});
    expect(hasCredits()).toBe(true);
    vi.useRealTimers();
  });

  it("returns true when purchased credits available", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 5, free_credits: 0, free_month: "2026-04" },
    });
    expect(hasCredits()).toBe(true);
    vi.useRealTimers();
  });

  it("returns false when no credits at all", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 0, free_credits: 0, free_month: "2026-04" },
    });
    expect(hasCredits()).toBe(false);
    vi.useRealTimers();
  });
});

describe("useCredit", () => {
  it("uses free credits first", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 5, free_credits: 2, free_month: "2026-04" },
    });
    const result = useCredit();
    expect(result).toEqual({ success: true, remaining: 6 });
    expect(mockConfig.writeConfig).toHaveBeenCalledWith({
      credits: { balance: 5, free_credits: 1, free_month: "2026-04" },
    });
    vi.useRealTimers();
  });

  it("uses purchased credits after free are exhausted", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 5, free_credits: 0, free_month: "2026-04" },
    });
    const result = useCredit();
    expect(result).toEqual({ success: true, remaining: 4 });
    expect(mockConfig.writeConfig).toHaveBeenCalledWith({
      credits: { balance: 4, free_credits: 0, free_month: "2026-04" },
    });
    vi.useRealTimers();
  });

  it("returns false when no credits remain", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 0, free_credits: 0, free_month: "2026-04" },
    });
    const result = useCredit();
    expect(result).toEqual({ success: false, remaining: 0 });
    expect(mockConfig.writeConfig).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("uses fresh free credits on new month even when old free credits were 0", () => {
    mockMonth("2026-05");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 0, free_credits: 0, free_month: "2026-04" },
    });
    const result = useCredit();
    expect(result).toEqual({ success: true, remaining: 2 });
    expect(mockConfig.writeConfig).toHaveBeenCalledWith({
      credits: { balance: 0, free_credits: 2, free_month: "2026-05" },
    });
    vi.useRealTimers();
  });
});

describe("addCredits", () => {
  it("increases purchased balance", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({
      credits: { balance: 5, free_credits: 1, free_month: "2026-04" },
    });
    addCredits(10);
    expect(mockConfig.writeConfig).toHaveBeenCalledWith({
      credits: { balance: 15, free_credits: 1, free_month: "2026-04" },
    });
    vi.useRealTimers();
  });

  it("adds credits starting from zero", () => {
    mockMonth("2026-04");
    mockConfig.readConfig.mockReturnValue({});
    addCredits(30);
    expect(mockConfig.writeConfig).toHaveBeenCalledWith({
      credits: { balance: 30, free_credits: 3, free_month: "2026-04" },
    });
    vi.useRealTimers();
  });
});
