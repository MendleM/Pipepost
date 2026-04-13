import { readConfig, writeConfig } from "./config.js";

const FREE_MONTHLY_CREDITS = 3;

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Return the current credit balances.
 *
 * Free credits reset automatically at the start of each calendar month.
 * @returns `balance` (purchased), `freeRemaining` (this month), and `total`.
 */
export function getCredits(): { balance: number; freeRemaining: number; total: number } {
  const config = readConfig();
  const credits = config.credits;
  const month = currentMonth();

  // Calculate free credits
  let freeRemaining = FREE_MONTHLY_CREDITS;
  if (credits?.free_month === month) {
    freeRemaining = credits.free_credits;
  }

  const purchased = credits?.balance ?? 0;
  return {
    balance: purchased,
    freeRemaining,
    total: purchased + freeRemaining,
  };
}

/** Check whether at least one credit (free or purchased) is available. */
export function hasCredits(): boolean {
  return getCredits().total > 0;
}

/**
 * Consume one credit, preferring free credits before purchased ones.
 *
 * Writes the updated balance to the config file. Returns `success: false`
 * without side effects if no credits are available.
 */
export function useCredit(): { success: boolean; remaining: number } {
  const { balance, freeRemaining, total } = getCredits();

  if (total <= 0) {
    return { success: false, remaining: 0 };
  }

  const month = currentMonth();

  // Use free credits first, then purchased
  if (freeRemaining > 0) {
    writeConfig({
      credits: {
        balance,
        free_credits: freeRemaining - 1,
        free_month: month,
      },
    });
    return { success: true, remaining: balance + freeRemaining - 1 };
  }

  // Use purchased credits
  writeConfig({
    credits: {
      balance: balance - 1,
      free_credits: 0,
      free_month: month,
    },
  });
  return { success: true, remaining: balance - 1 };
}

/**
 * Add purchased credits to the balance.
 * @param amount - Number of credits to add (must be positive).
 */
export function addCredits(amount: number): void {
  const config = readConfig();
  const current = config.credits?.balance ?? 0;
  const month = currentMonth();
  writeConfig({
    credits: {
      balance: current + amount,
      free_credits:
        config.credits?.free_month === month
          ? (config.credits?.free_credits ?? FREE_MONTHLY_CREDITS)
          : FREE_MONTHLY_CREDITS,
      free_month: month,
    },
  });
}
