import { saveAs } from 'file-saver';
import { PlayerData } from '../types/PlayerData';

/**
 * Saves the player data to a .txt file with Base64 encoding and SHA-256 integrity check.
 * @param {PlayerData} playerData - The player's current data to save.
 * @returns {Promise<void>}
 */
export async function savePlayerData(playerData: PlayerData): Promise<void> {
    const secretKey = process.env.SECRET_KEY || 'default-secret';
    const jsonData = JSON.stringify(playerData);
    const encodedData = btoa(jsonData);

    const encoder = new TextEncoder();
    const dataWithKey = encoder.encode(encodedData + secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const saveContent = `${encodedData}.${hash}`;
    const blob = new Blob([saveContent], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'player_save.txt');
}

/**
 * Loads player data from a .txt file, verifies integrity, and returns the data.
 * @param {File} file - The .txt file uploaded by the player.
 * @returns {Promise<PlayerData>} The decoded player data if valid.
 * @throws {Error} If integrity check fails or data is invalid.
 */
export async function loadPlayerData(file: File): Promise<PlayerData> {
    const secretKey = process.env.SECRET_KEY || 'default-secret';
    const text = await file.text();
    const [encodedData, providedHash] = text.split('.');

    const encoder = new TextEncoder();
    const dataWithKey = encoder.encode(encodedData + secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataWithKey);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (computedHash !== providedHash) {
        throw new Error('Save file integrity check failed!');
    }

    const jsonData = atob(encodedData);
    const playerData: PlayerData = JSON.parse(jsonData);
    return playerData;
}