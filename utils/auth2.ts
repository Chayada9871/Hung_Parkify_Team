// utils/auth.js or auth.ts
import crypto from "crypto";
import forge from "node-forge";
import jwt from "jsonwebtoken";
import sql from '../config/db';

// ---------------- AES Encryption / Decryption with custom key ----------------
export function encryptAESWithKey(plaintext, keyHex) {
  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`;
}

export function decryptAESWithKey(encrypted, keyHex) {
  const [ivBase64, encryptedText] = encrypted.split(":");
  const iv = Buffer.from(ivBase64, "base64");
  const key = Buffer.from(keyHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ---------------- RSA Signature ----------------
/*export function signWithPrivateKey(data, privateKeyPEM) {
  const privateKey = privateKeyPEM;
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
}

export function verifyFieldSignature(signatureBase64, originalData, publicKeyPEM) {
  const publicKey = publicKeyPEM;
  const md = forge.md.sha256.create();
  md.update(originalData, "utf8");
  const signatureBytes = forge.util.decode64(signatureBase64);
  return publicKey.verify(md.digest().bytes(), signatureBytes);
}*/
export function verifyFieldSignature(data: string, signatureBase64: string, publicKey: string): boolean {
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(data);
  const signatureBuffer = Buffer.from(signatureBase64, 'base64'); // ✅ base64 decoding
  return verifier.verify(publicKey, signatureBuffer);
}
export function signWithPrivateKey(data: string, privateKey: string): string {
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(data);
  const signature = signer.sign(privateKey);
  return signature.toString('base64'); // ✅ base64 encoded
}


// ---------------- JWT Verification with per-user RSA key ----------------
export async function verifyJWT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return { isValid: false, error: "Missing token" };
    }

    // 1. Decode JWT to extract user_id without verifying
    const decodedUnverified = jwt.decode(token);
    const userId = decodedUnverified?.user_id;
    if (!userId) {
      return { isValid: false, error: "Invalid token structure" };
    }

    // 2. Retrieve and decrypt public_key, session_key, and private_key from DB
    const result = await sql`
      SELECT 
        public_key, 
        pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key,
        pgp_sym_decrypt(private_key::bytea, 'parkify-master-secret') AS private_key
      FROM user_keys
      WHERE user_id = ${userId}
    `;

    if (result.length === 0) {
      return { isValid: false, error: "User not found" };
    }

    const { public_key, session_key, private_key } = result[0];

    // 3. Verify JWT using the user's public key
    const verifiedPayload = jwt.verify(token, public_key, {
      algorithms: ["RS256"],
    });

    return {
      isValid: true,
      payload: verifiedPayload,
      userId,
      sessionKey: session_key,
      publicKey: public_key,
      privateKey: private_key, // ✅ Include decrypted private key
    };
  } catch (err) {
    console.error("❌ JWT verify error:", err.message);
    return { isValid: false, error: "Invalid or expired token" };
  }
}
