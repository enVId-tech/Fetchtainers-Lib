import axios, { AxiosInstance } from 'axios';
import https from 'https';
import dotenv from 'dotenv';

if (!process.env.PORTAINER_URL) {
    // Suppress console output during dotenv configuration
    const originalConsoleLog = console.log;
    const originalConsoleInfo = console.info;
    console.log = () => {};
    console.info = () => {};
    
    dotenv.config({ path: '.env', debug: false });
    
    // Restore original console functions
    console.log = originalConsoleLog;
    console.info = originalConsoleInfo;
}

export class PortainerApiClient {
    private portainerUrl: string; // Portainer URL, must be defined
    private accessToken: string | undefined; // Access token, must be defined for API calls

    /**
     */
    constructor(
        portainerUrl: string = process.env.PORTAINER_URL || 'http://localhost:9000',
    ) {
        this.portainerUrl = portainerUrl;
    }
}