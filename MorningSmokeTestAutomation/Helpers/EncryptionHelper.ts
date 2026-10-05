import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

export default class EncryptionHelper {
    public static current = new EncryptionHelper();

    private getKey(): Buffer {
        const keyHex = process.env.DB_ENCRYPTION_KEY;
        if (!keyHex) {
            throw new Error('Missing DB_ENCRYPTION_KEY. Copy .env.example to .env and fill in a real value.');
        }
        return Buffer.from(keyHex, 'hex');
    }

    // Returns "iv:authTag:ciphertext", all hex-encoded.
    public encrypt(plainText: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ALGORITHM, this.getKey(), iv);
        const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
    }

    public decrypt(cipherText: string): string {
        const [ivHex, authTagHex, encryptedHex] = cipherText.split(':');
        const decipher = crypto.createDecipheriv(ALGORITHM, this.getKey(), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);

        return decrypted.toString('utf8');
    }
}
