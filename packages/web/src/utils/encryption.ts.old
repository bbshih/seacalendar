/**
 * Client-side encryption utilities using Web Crypto API
 * Provides AES-GCM encryption for securing event data in Gists
 */

/**
 * Generate a random encryption key
 * Returns a base64-encoded key that can be safely included in URLs
 */
export function generateEncryptionKey(): string {
  const array = new Uint8Array(32); // 256-bit key
  crypto.getRandomValues(array);
  return arrayBufferToBase64(array.buffer);
}

/**
 * Derive an encryption key from a password using PBKDF2
 * This allows password-protected events without keys in URLs
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<string> {
  try {
    // Import password as key material
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive 256-bit key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Export as raw key data
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    return arrayBufferToBase64(exportedKey);
  } catch (error) {
    console.error('Key derivation failed:', error);
    throw new Error('Failed to derive encryption key from password');
  }
}

/**
 * Encrypt data using AES-GCM
 */
export async function encryptData(
  plaintext: string,
  keyBase64: string
): Promise<string> {
  try {
    // Convert base64 key to CryptoKey
    const keyData = base64ToArrayBuffer(keyBase64);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    // Combine IV + ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return arrayBufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decryptData(
  encryptedBase64: string,
  keyBase64: string
): Promise<string> {
  try {
    // Convert base64 key to CryptoKey
    const keyData = base64ToArrayBuffer(keyBase64);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // Extract IV and ciphertext
    const combined = base64ToArrayBuffer(encryptedBase64);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data - invalid key or corrupted data');
  }
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
