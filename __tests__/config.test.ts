import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readConfig, writeConfig, getConfigPath } from "../src/config.js";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("node:fs");
vi.mock("node:os");

const mockFs = vi.mocked(fs);
const mockOs = vi.mocked(os);

beforeEach(() => {
  mockOs.homedir.mockReturnValue("/home/testuser");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getConfigPath", () => {
  it("returns ~/.pipepost/config.json", () => {
    expect(getConfigPath()).toBe("/home/testuser/.pipepost/config.json");
  });
});

describe("readConfig", () => {
  it("returns empty config when file does not exist", () => {
    mockFs.existsSync.mockReturnValue(false);
    const config = readConfig();
    expect(config).toEqual({});
  });

  it("parses valid JSON config", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ license: { key: "abc" } })
    );
    const config = readConfig();
    expect(config.license?.key).toBe("abc");
  });

  it("returns empty config on invalid JSON", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("not json{{{");
    const config = readConfig();
    expect(config).toEqual({});
  });
});

describe("writeConfig", () => {
  it("creates directory and writes JSON", () => {
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);

    writeConfig({ license: { key: "xyz", instance_id: "inst1", cached_status: "active", cached_at: "" } });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith(
      "/home/testuser/.pipepost",
      { recursive: true }
    );
    const writtenJson = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenJson.license.key).toBe("xyz");
  });

  it("merges with existing config", () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(
      JSON.stringify({ platforms: { devto: { api_key: "existing" } } })
    );
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);

    writeConfig({ license: { key: "new", instance_id: "i", cached_status: "active", cached_at: "" } });

    const writtenJson = JSON.parse(
      mockFs.writeFileSync.mock.calls[0][1] as string
    );
    expect(writtenJson.platforms.devto.api_key).toBe("existing");
    expect(writtenJson.license.key).toBe("new");
  });
});
