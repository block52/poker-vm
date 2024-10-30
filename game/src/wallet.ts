import { ethers } from "ethers";

export class MissingWalletError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MissingWalletError";
    }
}

export function createWallet() {
    const wallet = ethers.Wallet.createRandom();
    return new ethers.Wallet(wallet.privateKey);
}

export function saveWallet(wallet: ethers.Wallet) {
    // Save to local storage
   
    const encrypted = encryptString(wallet.privateKey, import.meta.env.VITE_ENCRYPTION_KEY ?? "");
    localStorage.setItem("wallet", encrypted);
}

export function loadWallet(): ethers.Wallet {
    // Load from local storage
    console.log(import.meta.env.VITE_ENCRYPTION_KEY);
    const privateKey: string | null = localStorage.getItem("wallet");
    if (!privateKey) {
        throw new MissingWalletError("No wallet found");
    }
    const key = import.meta.env.VITE_ENCRYPTION_KEY ?? "";
    const decrypted = decryptString(privateKey, key);
    return new ethers.Wallet(decrypted);
}

export const encryptString = (message: string, key: string) => message;
  //CryptoJS.AES.encrypt(message, key).toString();

export const decryptString = (cipher: string, key: string) => cipher;
  //CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
