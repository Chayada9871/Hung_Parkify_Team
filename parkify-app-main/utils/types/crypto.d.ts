declare module '@/utils/crypto' {
  export function generateAESKey(): string;
  export function encryptWithAES(data: string, key: string): string;
  export function decryptWithAES(encryptedData: string, key: string): string;
  export function encryptUserKey(userKey: string): string;
  export function decryptUserKey(encryptedUserKey: string): string;
  export function hashPassword(password: string): Promise<string>;
  export function verifyPassword(password: string, hash: string): Promise<boolean>;
}
