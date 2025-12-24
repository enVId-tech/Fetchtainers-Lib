import { PortainerAuth } from './auth.ts';
import type { PortainerStack, PortainerEnvironment, PortainerContainer, PortainerImage } from './types.ts';
import { getFirstEnvironmentId, getStackById, getStackByName } from './utils.ts';
import { logInfo, logWarn, logError } from '../logger.ts';
import { EnvironmentsMixin } from './mixins/EnvironmentMixins.ts';
import { ResourceFetchingMixin } from './mixins/ResourceFetchingMixin.ts';

class PortainerApiBase {
    auth: PortainerAuth;
    environmentId: number | null = null; // Environment ID, can be null on init but must be defined when used
    constructor(
        environmentId: number | null = null
    ) {
        this.environmentId = environmentId;
        this.auth = PortainerAuth.getInstance();
    }
}

const MixinStack = ResourceFetchingMixin(EnvironmentsMixin(PortainerApiBase));

/**
 * Portainer API Client
 * 
 * Handles portainer API interactions.
 */
class PortainerApi extends MixinStack {
    constructor(public config: any) {
        super(config);
    }


    /**
     * Clean up any existing container with the same name
     * @param containerName - The name of the container to clean up
     * @param environmentId - Optional: The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving to true if a container was cleaned up, false otherwise
     */
    async cleanupExistingContainer(containerName: string, environmentId?: number | null): Promise<boolean> {
        try {
            if (environmentId === null || environmentId === undefined) {
                environmentId = await this.ensureEnvId();
            }

            if (environmentId === null) {
                logError('No Portainer environments found. Cannot cleanup container.');
                return false;
            }

            const containers = await this.getContainers(true);
            if (!containers) {
                logError("No containers found, canceled cleanup operation.")
                return false;
            }
            const existingContainer = containers.find(c =>
                c.Names.some(name => name.includes(containerName)) ||
                c.Names.some(name => name === `/${containerName}`)
            );

            if (existingContainer) {
                logInfo(`Cleaning up existing container "${containerName}" (ID: ${existingContainer.Id})`);

                if (existingContainer.State === 'running') {
                    await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${existingContainer.Id}/stop`);
                    logInfo('Container stopped');
                }

                // Remove the container
                await this.auth.axiosInstance.delete(`/api/endpoints/${environmentId}/docker/containers/${existingContainer.Id}`);
                logInfo('Container removed');
                return true;
            }
            return false; // No existing container found
        } catch (error) {
            logWarn(`Warning: Failed to cleanup existing container "${containerName}":`, error);
            return false;
        }
    }

    /**
     * Delete a stack from Portainer using the given stack id.
     * @param stackId - The ID of the stack to delete
     * @param environmentId - Optional: The ID of the Portainer environment
     * @returns {Promise<Record<string, unknown> | undefined>} Promise resolving to the delete operation result
     */
    deleteStack(stackId: number, environmentId?: number | null): Promise<Record<string, unknown> | undefined>;
    /**
    * Delete a stack from Portainer using the given stack id.
    * @param stackId - The ID of the stack to delete
    * @param environmentId - Optional: The ID of the Portainer environment
    * @returns {Promise<Record<string, unknown> | undefined>} Promise resolving to the delete operation result
    */
    deleteStack(stackName: string, environmentId?: number | null): Promise<Record<string, unknown> | undefined>;

    /**
     * Delete a stack from Portainer using the given stack id.
     * @param stackId - The ID of the stack to delete
     * @param environmentId - Optional: The ID of the Portainer environment
     * @returns {Promise<Record<string, unknown> | undefined>} Promise resolving to the delete operation result
     */
    async deleteStack(stackId: number | string, environmentId?: number | null): Promise<Record<string, unknown> | undefined> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot delete stack.');
            return undefined;
        }

        if (typeof stackId === "number") {
            const stack = await getStackById(stackId, environmentId);
            if (!stack) {
                logError(`Stack ID ${stackId} does not exist in environment ${environmentId}`);
                return undefined;
            }
        }

        if (typeof stackId === "string") {
            const stack = await getStackByName(stackId);
            if (!stack) {
                logError(`Stack with name "${stackId}" does not exist in environment ${environmentId}`);
                return undefined;
            }
            stackId = stack.Id;
        }

        try {
            logInfo(`Deleting stack ${stackId} from environment ${environmentId}...`);
            const response = await this.auth.axiosInstance.delete(`/api/stacks/${stackId}?endpointId=${environmentId}`);
            logInfo('Stack deleted successfully');
            return response.data;
        } catch (error) {
            logError(`Failed to delete stack ${stackId}:`, error);
            return undefined;
        }
    }

    /**
     * Start a container in a specific environment
     * @param containerId - The ID of the container to start
     * @param environmentId - Optional: The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving when container is started
     */
    async startContainer(containerId: string, environmentId?: number | null): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot start container.');
            return false;
        }

        try {
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/start`);
            logInfo(`Container ${containerId} started successfully.`);
            return true;
        } catch (error) {
            logError(`Failed to start container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Stop a container in a specific environment
     * @param containerId - The ID of the container to stop
     * @param environmentId - Optional: The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving when container is stopped
     */
    async stopContainer(containerId: string, environmentId?: number | null): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot stop container.');
            return false;
        }

        try {
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/stop`);
            logInfo(`Container ${containerId} stopped successfully.`);
            return true;
        } catch (error) {
            logError(`Failed to stop container ${containerId}:`, error);
            return false;
        }
    }
    /**
     * Remove a container
     * @param containerId - The ID of the container to remove
     * @param environmentId - The ID of the Portainer environment
     * @param force - Force removal of running container
     * @param removeVolumes - Remove associated volumes
     * @returns {Promise<boolean>} Promise resolving when container is removed
     */
    async removeContainer(containerId: string, environmentId?: number | null, force: boolean = false, removeVolumes: boolean = false): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot remove container.');
            return false;
        }

        try {
            logInfo(`Removing container ${containerId}...`);
            const params = new URLSearchParams();
            if (force) params.append('force', 'true');
            if (removeVolumes) params.append('v', 'true');

            const url = `/api/endpoints/${environmentId}/docker/containers/${containerId}?${params.toString()}`;
            await this.auth.axiosInstance.delete(url);
            logInfo('Container removed successfully');
            return true;
        } catch (error) {
            logError(`Failed to remove container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Kill a container (force stop)
     * @param containerId - The ID of the container to kill
     * @param environmentId - Optional: The ID of the Portainer environment
     * @param signal - Kill signal (default: SIGKILL)
     * @returns {Promise<boolean>} Promise resolving when container is killed
     */
    async killContainer(containerId: string, environmentId?: number | null, signal: string = 'SIGKILL'): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot kill container.');
            return false;
        }

        try {
            logInfo(`Killing container ${containerId} with signal ${signal}...`);
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/kill?signal=${signal}`);
            logInfo('Container killed successfully');
            return true;
        } catch (error) {
            logError(`Failed to kill container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Pause a container
     * @param containerId - The ID of the container to pause
     * @param environmentId - The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving when container is paused
     */
    async pauseContainer(containerId: string, environmentId?: number | null): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot pause container.');
            return false;
        }

        try {
            logInfo(`Pausing container ${containerId}...`);
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/pause`);
            logInfo('Container paused successfully');
            return true;
        } catch (error) {
            logError(`Failed to pause container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Unpause a container
     * @param containerId - The ID of the container to unpause
     * @param environmentId - The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving when container is unpaused
     */
    async unpauseContainer(containerId: string, environmentId?: number | null): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot unpause container.');
            return false;
        }

        try {
            logInfo(`Unpausing container ${containerId}...`);
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/unpause`);
            logInfo('Container unpaused successfully');
            return true;
        } catch (error) {
            logError(`Failed to unpause container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Restart a container
     * @param containerId - The ID of the container to restart
     * @param environmentId - Optional: The ID of the Portainer environment
     * @param timeout - Optional: Timeout in seconds before forcefully killing the container (in ms)
     * @returns {Promise<boolean>} Promise resolving when container is restarted
     */
    async restartContainer(containerId: string, environmentId?: number | null, timeout: number = 10000): Promise<boolean> {
        if (environmentId === null || environmentId === undefined) {
            environmentId = await this.ensureEnvId();
        }

        if (environmentId === null) {
            logError('No Portainer environments found. Cannot restart container.');
            return false;
        }

        try {
            logInfo(`Restarting container ${containerId}...`);
            await this.auth.axiosInstance.post(`/api/endpoints/${environmentId}/docker/containers/${containerId}/restart?t=${(timeout / 1000).toPrecision(2)}`);
            logInfo('Container restarted successfully');
            return true;
        } catch (error) {
            logError(`Failed to restart container ${containerId}:`, error);
            return false;
        }
    }

    /**
     * Start a stack
     * @param stackId - The ID of the stack to start
     * @param environmentId - The ID of the Portainer environment
     * @returns {Promise<boolean>} Promise resolving when stack is started
     */
    async startStack(stackId: number, environmentId?: number | null): Promise<boolean> {
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
        if (environmentId === null) {
            logError('Environment ID is required to stop a stack.');
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
    }}

const instance = new MixinStack(
    
);

export { instance as PortainerApiInstance };