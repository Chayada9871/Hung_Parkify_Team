// utils/auth.js or auth.ts
import crypto from "crypto";
import forge from "node-forge";
import jwt from "jsonwebtoken";
import sql from '../../../config/db';

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
export function signWithPrivateKey(data, privateKeyPEM) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
}

export function verifyFieldSignature(signatureBase64, originalData, publicKeyPEM) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPEM);
  const md = forge.md.sha256.create();
  md.update(originalData, "utf8");
  const signatureBytes = forge.util.decode64(signatureBase64);
  return publicKey.verify(md.digest().bytes(), signatureBytes);
}

// ---------------- JWT Verification with per-user RSA key ----------------
export async function verifyJWT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return { 
         isValid: false, error: "Missing token" };
    }

    // Step 1: Decode the token (unverified) to extract role and id
    const decodedUnverified = jwt.decode(token);
    const role = decodedUnverified?.role;
    const id = decodedUnverified?.user_id || decodedUnverified?.admin_id || decodedUnverified?.lessor_id;

    if (!role || !id) {
      return { isValid: false, error: "Invalid token structures" };
    }

    let public_key, session_key, private_key;

    // Step 2: Fetch keys from the correct table
    if (role === "renter") {
      const result = await sql`
        SELECT 
          public_key, 
          pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key,
          pgp_sym_decrypt(private_key::bytea, 'parkify-master-secret') AS private_key
        FROM user_keys
        WHERE user_id = ${id}
      `;
      if (result.length === 0) return { isValid: false, error: "User not found" };
      ({ public_key, session_key, private_key } = result[0]);

    } 
    
    else if (role === "admin") {
      const result = await sql`
        SELECT 
          public_key, 
          pgp_sym_decrypt(session_key::bytea, 'parkify-session-secret') AS session_key,
          pgp_sym_decrypt(private_key::bytea, 'parkify-master-secret') AS private_key
        FROM admin_keys
        WHERE admin_id = ${id}
      `;
      if (result.length === 0) return { isValid: false, error: "Admin not found" };
      ({ public_key, session_key, private_key } = result[0]);} 
    
      else if (role === "lessor") {   
        const result = await sql`
          SELECT 
            public_key, 
            pgp_sym_decrypt(encrypted_session_key::bytea, 'parkify-session-secret') AS session_key,
            pgp_sym_decrypt(private_key::bytea, 'parkify-master-secret') AS private_key
          FROM lessor_keys
          WHERE lessor_id = ${id}
        `;
        if (result.length === 0) return { isValid: false, error: "Lessor not found" };
        ({ public_key, session_key, private_key } = result[0]);
      }

    else {
      return { isValid: false, error: "Unknown role" };
    }

    // Step 3: Verify token using the correct public key
    const verifiedPayload = jwt.verify(token, public_key, { algorithms: ["RS256"] });

    return {
      isValid: true,
      payload: verifiedPayload,
      userId: role === "renter" ? id : undefined,
      adminId: role === "admin" ? id : undefined,
      lessorId: role === "lessor" ? id : undefined,
      role,
      sessionKey: session_key,
      publicKey: public_key,
      privateKey: private_key,
    };

  } catch (err) {
    console.error("❌ JWT verify error:", err.message);
    return { isValid: false, error: "Invalid or expired token" };
  }
}
