import { ipcRenderer } from "electron";

export interface FirestoreAuthApi {
    // Authenticate with GitHub through Firebase
    authenticateWithGitHub: (userData: { user: any; token: string }) => void;
    onAuthSuccess: (callback: (decodedToken: any) => void) => void;
    onAuthError: (callback: (error: any) => void) => void;
}

export const firestoreAuthApi: FirestoreAuthApi = {
    authenticateWithGitHub: (userData) => {
        console.log(userData);
        ipcRenderer.send('firebase-github-auth', userData);
    },
    
    onAuthSuccess: (callback) => {
        ipcRenderer.on('firebase-github-auth-success', (_event, decodedToken) => callback(decodedToken));
    },
    
    onAuthError: (callback) => {
        ipcRenderer.on('firebase-github-auth-error', (_event, error) => callback(error));
    }
};
