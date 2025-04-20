// utils/crypto.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// Configuration constants
const SALT_ROUNDS = 12; // Optimal balance between security and performance
const AES_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const KEY_LENGTH = 32; // 32 bytes = 256 bits for AES-256

// Get master key from environment variables
const MASTER_KEY = process.env.MASTER_KEY;
if (!MASTER_KEY || MASTER_KEY.length !== 32) {
    throw new Error('Invalid MASTER_KEY: Must be exactly 32 characters long');
}

/**
 * Generates a random AES key (256-bit)
 * @returns {string} Hex-encoded 256-bit AES key
 */
export function generateAESKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Encrypts data with AES-256-CBC
 * @param {string} data - Data to encrypt
 * @param {string} key - Hex-encoded encryption key
 * @returns {string} IV:encryptedData (hex:hex)
 */
export function encryptWithAES(data: string, key: string): string {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(
            AES_ALGORITHM,
            Buffer.from(key, 'hex'),
            iv
        );
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('AES encryption failed:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypts data with AES-256-CBC
 * @param {string} encryptedData - IV:encryptedData (hex:hex)
 * @param {string} key - Hex-encoded decryption key
 * @returns {string} Decrypted data
 */
export function decryptWithAES(encryptedData: string, key: string): string {
    try {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = parts[1];
        
        const decipher = crypto.createDecipheriv(
            AES_ALGORITHM,
            Buffer.from(key, 'hex'),
            iv
        );
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('AES decryption failed:', error);
        throw new Error('Decryption failed');
    }
}

/**
 * Encrypts a user's AES key with the master key
 * @param {string} userKey - User's AES key to encrypt
 * @returns {string} Encrypted key (IV:encryptedKey)
 */
export function encryptUserKey(userKey: string): string {
    return encryptWithAES(userKey, MASTER_KEY);
}

/**
 * Decrypts a user's AES key with the master key
 * @param {string} encryptedUserKey - Encrypted user key (IV:encryptedKey)
 * @returns {string} Decrypted user key
 */
export function decryptUserKey(encryptedUserKey: string): string {
    return decryptWithAES(encryptedUserKey, MASTER_KEY);
}

/**
 * Hashes a password using bcrypt
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a password against a bcrypt hash
 * @param {string} password - Plaintext password
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

/**
 * Generates a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
export function generateRandomString(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex')
        .slice(0, length);
}

// Additional utility for key validation
export function isValidKey(key: string): boolean {
    return typeof key === 'string' && 
           key.length === KEY_LENGTH * 2 && // Hex encoded (2 chars per byte)
           /^[0-9a-f]+$/i.test(key);
}