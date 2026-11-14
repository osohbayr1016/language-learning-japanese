import { rewardAccountFromToken } from "../rewardOutbox";

/** A user-scoped cache key never exposes access/refresh token bytes. */
export function dailyGoalCacheKey(token: string | null): string {
  const owner = rewardAccountFromToken(token);
  return owner ? "daily_xp_goal.user." + owner : "daily_xp_goal";
}

/** Reject stale asynchronous results when the auth token or request order changes. */
export function isCurrentAccountResult(
  requestedToken: string | null,
  latestToken: string | null,
  ticket: number,
  latestTicket: number,
): boolean {
  return !!requestedToken && requestedToken === latestToken && ticket === latestTicket;
}
