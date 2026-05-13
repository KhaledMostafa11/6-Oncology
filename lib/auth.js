import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "oncology-project-development-secret";
const HASH_PREFIX = "scrypt";

const base64url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const decodeBase64url = (value) => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64").toString("utf8");
};

export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${HASH_PREFIX}:${salt}:${hash}`;
};

export const verifyPassword = (password, storedPassword) => {
  if (!storedPassword) return false;

  // Allows existing plain-text classroom accounts to keep working.
  if (!storedPassword.startsWith(`${HASH_PREFIX}:`)) {
    return password === storedPassword;
  }

  const [, salt, storedHash] = storedPassword.split(":");
  if (!salt || !storedHash) return false;

  const hash = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(storedHash, "hex");

  return stored.length === hash.length && crypto.timingSafeEqual(stored, hash);
};

export const signToken = (payload) => {
  const encodedPayload = base64url(
    JSON.stringify({
      ...payload,
      iat: Date.now(),
    })
  );
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token || !token.includes(".")) return null;

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(encodedPayload)
    .digest("base64url");

  const valid =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

  if (!valid) return null;

  try {
    return JSON.parse(decodeBase64url(encodedPayload));
  } catch {
    return null;
  }
};

export const getBearerUser = (request) => {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return verifyToken(token);
};

export const requireRole = (request, allowedRoles = []) => {
  const user = getBearerUser(request);

  if (!user) {
    return { ok: false, status: 401, message: "Authentication is required." };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { ok: false, status: 403, message: "You do not have permission." };
  }

  return { ok: true, user };
};
