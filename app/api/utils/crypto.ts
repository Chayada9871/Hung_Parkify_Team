import CryptoJS from "crypto-js";

import sql from '../../../config/db';
import crypto from 'crypto';
import forge from 'node-forge';

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



export function encryptAESWithKey(plaintext, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
}

export function decryptAESWithKey(encrypted, keyHex) {
  const [ivBase64, encryptedText] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const key = Buffer.from(keyHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function signWithPrivateKey(data, privateKeyPEM) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPEM);
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
}

export function verifyFieldSignature(signatureBase64, originalData, publicKeyPEM) {
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPEM);
  const md = forge.md.sha256.create();
  md.update(originalData, 'utf8');
  const signatureBytes = forge.util.decode64(signatureBase64);
  return publicKey.verify(md.digest().bytes(), signatureBytes);
}

export async function verifyJWT(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return { isValid: false, error: 'Missing Authorization header' };

  const token = authHeader.split(' ')[1];
  if (!token) return { isValid: false, error: 'Missing token' };

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return {
      isValid: true,
      user: payload.user,
      sessionKey: payload.sessionKey,
      privateKey: payload.privateKey,
      publicKey: payload.publicKey
    };
  } catch (e) {
    return { isValid: false, error: 'Invalid token format' };
  }
}
