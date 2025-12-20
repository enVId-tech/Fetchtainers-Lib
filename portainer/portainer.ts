
import dotenv from 'dotenv';
import { PortainerAuth } from './auth';
import { PortainerEnvironment } from './interfaces';

if (!process.env.PORTAINER_URL) {
    // Suppress console output during dotenv configuration
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    console.log = () => { };
    console.info = () => { };

    dotenv.config({ path: '.env', debug: false });

    // Restore original console functions
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
}

/**
 * Portainer API Client
 * 
 * Handles portainer API interactions.
 */
export class PortainerApiClient extends PortainerAuth {
    
    constructor(portainerUrl: string, apiToken: string) {
        // Creates class of upstream PortainerAuth instance
        super(portainerUrl, apiToken);
    }

    /**
     * Fetches details of a specific Portainer environment.
     * @param environmentId - The ID of the environment to fetch.
     * @returns {Promise<PortainerEnvironment>} A promise that resolves to the environment object.
     */
    async getEnvironment(environmentId: number): Promise<PortainerEnvironment> {
        try {
            const response = await this.axiosInstance.get<PortainerEnvironment>(`/api/endpoints/${environmentId}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to fetch environment ${environmentId}:`, error);
            throw error;
        }
    }
}