import CryptoJS from "crypto-js";
import forge from "node-forge";

// 🧠 Static AES key for fallback (can override during encryption)
const STATIC_AES_KEY = "12345678901234567890123456789012"; // 32 chars

// ===========================================
// 🔐 AES ENCRYPTION / DECRYPTION
// ===========================================

export function encryptAES(data, key = STATIC_AES_KEY) {
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptAES(ciphertext, key = STATIC_AES_KEY) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// ===========================================
// 🔏 RSA DIGITAL SIGNATURE (Private/Public Key)
// ===========================================

// 👉 Replace with your actual private key PEM (for signing)
const privateKeyPem = `
-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC0Mi3bCrVgPSBkXxXHpWnoyIKbZZ3GmOIfTgy7FSA472iN/Zh2
0Ku7mBP3NLL8E7SEJsIJSoAiSxas890aZ/TNAbFno0UATGYUvoqvaMXooOQFYt38
hG84jbylw3SnzInI75m7YncBGhGZtDhIXbs7T7pml3y6Mor+zoUfQcLXzwIDAQAB
AoGAVRWQg2oGBIA4aExhe1iGrqzmxrtviVOtCb0P09KA2YFp7Am/UPLs8/I2Ezbm
AJLJXND0M/Dimc680UOAtjQ56TwnXAjcUl0ATz2hsuxnQd1Xszn0wrq9a6mfrvLQ
xLbOLRHFaaTWZn8IqDwUrcmgi+OYmHtMvHtHGc0/VizpKTkCQQDQ1XxXL3u4Rd0X
ZDucRnRMGHvSRJQENsKnjRTtslbZ6JWoZy3yK/lOXTNEPQHxXkJEj/sxcM79VzwI
U+ZAMehrAkEA3OTingXKH/iSiaqpp01YHcB41Pk75ft4dp3i5X8DWD6j0AqKxdMZ
BjVP41qaXUEfXJ13yKXG7GfP8QcC+6o3LQJAAY4VZvDLkwuyIcJ1TyyXIRntkhtA
nudpe6XpSfvR+b1pn99k0DDTomm/P/rUUN/Kzofj7vJQGELWB5nYVRIKEQJBAMsG
5PNxRtIT2jwGTGClSjQuT+EQIunDNHlxrLZbA2v8RvxUdDBXUkzOe1rwT6kezgCG
Cy60kB2BXTKfyzIcxRECQCJaLXtr5QVQSh94gX9vRwC1S3t7xaxrETZTblUJ1UmT
IpiYdyAAEq/5+aFq4P8Fal2tUpbrb4sLX5qlVVkAl6M=
-----END RSA PRIVATE KEY-----
`;

const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e); // derive public key from private

export function signData(data) {
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature); // return as base64 string
}

export function verifySignature(data, signatureBase64) {
  const md = forge.md.sha256.create();
  md.update(data, "utf8");
  const decodedSig = forge.util.decode64(signatureBase64);
  return publicKey.verify(md.digest().bytes(), decodedSig);
}

// ===========================================
// 🔐 OPTIONAL: Encrypt AES Key using RSA Public Key
// ===========================================

export function encryptAESKeyWithPublicKey(aesKey) {
  const encrypted = publicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
  return forge.util.encode64(encrypted); // return base64 string
}

export function decryptAESKeyWithPrivateKey(encryptedBase64) {
  const encryptedBytes = forge.util.decode64(encryptedBase64);
  return privateKey.decrypt(encryptedBytes, "RSA-OAEP", {
    md: forge.md.sha256.create(),
  });
}

// ===========================================
// 🧾 JWT SIGNING & VERIFICATION USING node-forge
// ===========================================

export function signJWT(payload, expiresInSeconds = 3600) {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payloadWithExp = { ...payload, exp };

  const base64url = (obj) =>
    forge.util.encode64(JSON.stringify(obj))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const headerEncoded = base64url(header);
  const payloadEncoded = base64url(payloadWithExp);
  const toSign = `${headerEncoded}.${payloadEncoded}`;

  const md = forge.md.sha256.create();
  md.update(toSign, "utf8");
  const signature = forge.util.encode64(privateKey.sign(md))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${headerEncoded}.${payloadEncoded}.${signature}`;
}

export function verifyJWT(token) {
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  const toVerify = `${headerB64}.${payloadB64}`;
  const signatureBytes = forge.util.decode64(
    signatureB64.replace(/-/g, "+").replace(/_/g, "/")
  );

  const md = forge.md.sha256.create();
  md.update(toVerify, "utf8");

  const isValid = publicKey.verify(md.digest().bytes(), signatureBytes);
  if (!isValid) throw new Error("Invalid signature");

  const payload = JSON.parse(
    forge.util.decode64(payloadB64.replace(/-/g, "+").replace(/_/g, "/"))
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload;
}
