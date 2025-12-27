import { logError, logInfo } from "../../logger.ts";
import type { Constructor } from "../types.ts";

interface SCtrlsMixin {
    auth: {
        axiosInstance: import("axios").AxiosInstance;
    };
    ensureEnvId: () => Promise<number | null>;
    getStacks: () => Promise<import("../types.ts").PortainerStack[] | undefined>;
}

export function StackControlsMixin<TBase extends Constructor<SCtrlsMixin>>(Base: TBase) {
    return class extends Base {
        /**
         * Start a stack
         * @param stackId - The ID of the stack to start
         * @param environmentId - The ID of the Portainer environment
         * @returns {Promise<boolean>} Promise resolving when stack is started
         */
        async startStack(stackId: number, environmentId?: number | null): Promise<boolean> {
            if (typeof stackId !== 'number' || isNaN(stackId) || stackId <= 0) {
                logError('Invalid stackId: must be a positive number');
                return false;
            }

            if (environmentId !== undefined && environmentId !== null && (typeof environmentId !== 'number' || isNaN(environmentId))) {
                logError('Invalid environmentId: must be a number, null, or undefined');
                return false;
            }

            if (environmentId === null || environmentId === undefined) {
                environmentId = await this.ensureEnvId();
            }

            if (environmentId === null) {
                logError('No Portainer environments found. Cannot start stack.');
                return false;
            }

            try {
                logInfo(`Starting stack ${stackId}...`);
                await this.auth.axiosInstance.post(`/api/stacks/${stackId}/start?endpointId=${environmentId}`);
                logInfo('Stack started successfully');
                return true;
            } catch (error) {
                logError(`Failed to start stack ${stackId}:`, error);
                return false;
            }
        }


        /**
         * Stop a stack
         * @param stackId - The ID of the stack to stop
         * @param environmentId - The ID of the Portainer environment
         * @returns {Promise<boolean>} Promise resolving when stack is stopped
         */
        async stopStack(stackId: number, environmentId?: number | null): Promise<boolean> {
            if (typeof stackId !== 'number' || isNaN(stackId) || stackId <= 0) {
                logError('Invalid stackId: must be a positive number');
                return false;
            }

            if (environmentId !== undefined && environmentId !== null && (typeof environmentId !== 'number' || isNaN(environmentId))) {
                logError('Invalid environmentId: must be a number, null, or undefined');
                return false;
            }

            if (environmentId === null || environmentId === undefined) {
                environmentId = await this.ensureEnvId();
            }

            if (environmentId === null) {
                logError('No Portainer environments found. Cannot stop stack.');
                return false;
            }

            try {
                logInfo(`Stopping stack ${stackId}...`);
                await this.auth.axiosInstance.post(`/api/stacks/${stackId}/stop?endpointId=${environmentId}`);
                logInfo('Stack stopped successfully');
                return true;
            } catch (error) {
                logError(`Failed to stop stack ${stackId}:`, error);
                return false;
            }
        }

        /**
 * Update a stack with new compose file content
 * @param stackId - The ID of the stack to update
 * @param composeContent - The new docker-compose content
 * @param environmentId - The ID of the Portainer environment
 * @param pullImage - Whether to pull the latest image (default: true)
 * @returns Promise resolving when stack is updated
 */
        async updateStack(
            stackId: number,
            composeContent: string,
            environmentId?: number | null,
            pullImage: boolean = true
        ): Promise<boolean> {
            if (typeof stackId !== 'number' || isNaN(stackId) || stackId <= 0) {
                logError('Invalid stackId: must be a positive number');
                return false;
            }

            if (typeof composeContent !== 'string' || !composeContent.trim()) {
                logError('Invalid composeContent: must be a non-empty string');
                return false;
            }

            if (environmentId !== undefined && environmentId !== null && (typeof environmentId !== 'number' || isNaN(environmentId))) {
                environmentId = await this.ensureEnvId();
            }

            if (environmentId === null) {
                logError('No Portainer environments found. Cannot update stack.');
                return false;
            }

            try {
                logInfo(`Updating stack ${stackId}...`);
                await this.auth.axiosInstance.put(
                    `/api/stacks/${stackId}?endpointId=${environmentId}`,
                    {
                        StackFileContent: composeContent,
                        Prune: false,
                        PullImage: pullImage
                    }
                );
                logInfo('Stack updated successfully');
                return true;
            } catch (error) {
                logError(`Failed to update stack ${stackId}:`, error);
                return false;
            }
        }

        /**
         * Redeploy a stack (stop, pull image, start)
         * @param stackId - The ID of the stack to redeploy
         * @param environmentId - The ID of the Portainer environment
         * @returns Promise resolving when stack is redeployed
         */
        async redeployStack(
            stackId: number, 
            environmentId?: number | null
        ): Promise<boolean> {
            if (typeof stackId !== 'number' || isNaN(stackId) || stackId <= 0) {
                logError('Invalid stackId: must be a positive number');
                return false;
            }

            if (environmentId !== undefined && environmentId !== null && (typeof environmentId !== 'number' || isNaN(environmentId))) {
                environmentId = await this.ensureEnvId();
            }

            if (environmentId === null) {
                logError('No Portainer environments found. Cannot redeploy stack.');
                return false;
            }

            try {
                console.log(`Redeploying stack ${stackId}...`);

                // Get current stack details
                const stacks = await this.getStacks();

                if (!stacks) {
                    logError('No stacks found in the specified environment.');
                    return false;
                }

                const stack = stacks.find(s => s.Id === stackId);

                if (!stack) {
                    logError(`Stack ${stackId} not found`);
                    return false;
                }

                // Stop the stack first
                try {
                    await this.stopStack(stackId, environmentId);
                } catch (e) {
                    console.warn('Stack may already be stopped:', e);
                }

                // Wait a moment for cleanup
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Start the stack (this will pull the latest image if configured)
                await this.startStack(stackId, environmentId);

                logInfo('Stack redeployed successfully');
                return true;
            } catch (error) {
                logError(`Failed to redeploy stack ${stackId}:`, error);
                return false;
            }
        }
    }
}