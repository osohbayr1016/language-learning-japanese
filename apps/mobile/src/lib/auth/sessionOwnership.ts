import { parseJwtPayloadUnsafe } from "./accessToken";

/** Compare unverified token payloads only to gate local credential reuse.
 * Server-side authorization still verifies the signed JWT.
 */
export function tokensBelongToSameLearner(
  requestToken: string | null,
  storedToken: string | null,
): boolean {
  const requested = parseJwtPayloadUnsafe(requestToken)?.sub;
  const current = parseJwtPayloadUnsafe(storedToken)?.sub;
  return typeof requested === "number" && Number.isSafeInteger(requested) &&
    requested > 0 && requested === current;
}

export function canContinueRefresh(
  requestToken: string,
  storedAccessToken: string | null,
  expectedRefresh: string,
  storedRefresh: string | null,
): boolean {
  return expectedRefresh.length > 0 && expectedRefresh === storedRefresh &&
    tokensBelongToSameLearner(requestToken, storedAccessToken);
}
