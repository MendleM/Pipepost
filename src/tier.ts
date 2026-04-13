import { validateLicense } from "./license.js";
import { readConfig, writeConfig } from "./config.js";

const FREE_PUBLISH_LIMIT = 3;

export type Tier = "free" | "pro";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

export async function checkTier(): Promise<Tier> {
  const { tier } = await validateLicense();
  return tier;
}

export async function canPublish(): Promise<{ allowed: boolean; remaining: number }> {
  const tier = await checkTier();

  if (tier === "pro") {
    return { allowed: true, remaining: Infinity };
  }

  const config = readConfig();
  const usage = config.usage;
  const month = currentMonth();

  // Reset if new month
  if (!usage || usage.month !== month) {
    return { allowed: true, remaining: FREE_PUBLISH_LIMIT };
  }

  const remaining = FREE_PUBLISH_LIMIT - usage.publishes_this_month;
  return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
}

export function recordPublish(): void {
  const config = readConfig();
  const month = currentMonth();

  const currentCount =
    config.usage?.month === month ? config.usage.publishes_this_month : 0;

  writeConfig({
    usage: {
      publishes_this_month: currentCount + 1,
      month,
    },
  });
}
