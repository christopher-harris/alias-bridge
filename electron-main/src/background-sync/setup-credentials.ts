import * as dotenv from 'dotenv';
import path from 'path';
import {SecureCredentialsManager} from "./credential.manager";

export async function setupCredentialsIfNeeded() {
    try {
        // First check if credentials already exist
        const existingCredentials = await SecureCredentialsManager.loadCredentials();
        if (!existingCredentials) {
            // Load environment variables
            dotenv.config({
                path: process.env.NODE_ENV === 'production'
                    ? path.join(__dirname, '.env.prod')
                    : path.join(process.cwd(), '.env')
            });

            const credentials = {
                type: process.env.FIREBASE_TYPE!,
                project_id: process.env.FIREBASE_PROJECT_ID!,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
                private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL!,
                client_id: process.env.FIREBASE_CLIENT_ID!,
                auth_uri: process.env.FIREBASE_AUTH_URI!,
                token_uri: process.env.FIREBASE_TOKEN_URI!,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL!,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL!
            };

            await SecureCredentialsManager.saveCredentials(credentials);
            console.log('Firebase credentials securely stored');
        }
    } catch (error) {
        console.error('Failed to setup credentials:', error);
        throw error;
    }
}

