import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';

interface FirebaseCredentials {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

const ALGORITHM = 'aes-256-cbc';
const CREDENTIALS_FILE = 'firebase-credentials.enc';
const iv = crypto.createHash('sha256').update(machineIdSync()).digest().slice(0, 16);



export class SecureCredentialsManager {
    private static credentialsPath = path.join(app.getPath('userData'), CREDENTIALS_FILE);

    private static getKey(): Buffer {
        // Hash the machine ID with SHA-256 to get a 32-byte key
        return crypto.createHash('sha256').update(machineIdSync()).digest();
    }

    private static encrypt(text: string): string {
        const key = this.getKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;

    }

    private static decrypt(encryptedText: string): string {
        const key = this.getKey(); // Use the derived key
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    static async saveCredentials(credentials: FirebaseCredentials): Promise<void> {
        try {
            const dataToEncrypt = JSON.stringify(credentials);
            const encryptedData = this.encrypt(dataToEncrypt);
            await fs.mkdir(path.dirname(this.credentialsPath), { recursive: true }); // Ensure directory exists
            await fs.writeFile(this.credentialsPath, encryptedData, 'utf-8');
        } catch (error) {
            console.error('Error saving credentials:', error);
            throw error; // Re-throw to indicate failure
        }
    }


    static async loadCredentials(): Promise<FirebaseCredentials | null> {
        try {
            const encryptedData = await fs.readFile(this.credentialsPath, 'utf-8');
            const decryptedData = this.decrypt(encryptedData);
            return JSON.parse(decryptedData);
        } catch (error: any) {
            // Log ENOENT specifically, otherwise log the full error
            if (error.code === 'ENOENT') {
                console.log('Credentials file not found. Needs setup.');
            } else {
                console.error('Error loading credentials:', error);
            }
            return null;
        }
    }

}

