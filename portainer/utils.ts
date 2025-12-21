import { portainerClient } from "./api";

export async function getFirstEnvironmentId(): Promise<number | null> {
    try {
        const environments = await portainerClient.getEnvironments();
        return environments.length > 0 ? environments[0].Id : null;
    } catch (error) {
        console.error('Error getting first environment ID:', error);
        return Promise.resolve(null);
    }
}

/**
 * Tests the connection to the Portainer API by fetching system status.
 * @returns {Promise<boolean>} A promise that resolves to true if the connection is successful.
 */
export async function testConnection(): Promise<boolean> {
    try {
        if (!portainerClient.auth.isValidated) {
            throw new Error('Authentication not validated. Cannot test connection.');
        }

        await portainerClient.auth.axiosInstance.get('/api/system/status');
        console.log('Successfully connected to Portainer API.');
        return true;
    } catch (error) {
        console.error('Failed to connect to Portainer API:', error);
        return false;
    }
}