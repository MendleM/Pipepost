import * as crypto from "node:crypto";

/** Create a short-lived Ghost Admin API JWT from an admin key ("id:secret" format). */
export function createGhostJwt(adminKey: string): string {
  const [id, secret] = adminKey.split(":");
  const key = Buffer.from(secret, "hex");

  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT", kid: id })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ iat: now, exp: now + 300, aud: "/admin/" })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", key)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}
