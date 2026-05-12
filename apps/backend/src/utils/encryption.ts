/**
 * Chiffrement AES-256 pour les clés API des utilisateurs
 * Les clés ne sont JAMAIS stockées en clair en BDD
 */
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET || 'fallback-key-change-me')
  .digest('hex')
  .slice(0, 32);

/** Chiffre une clé API avant stockage BDD */
export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/** Déchiffre une clé API pour l'utiliser */
export function decryptApiKey(ciphertext: string): string {
  const [ivHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** Masque une clé pour l'affichage (ex: sk-...abc1) */
export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '•'.repeat(Math.max(8, key.length - 8)) + key.slice(-4);
}
