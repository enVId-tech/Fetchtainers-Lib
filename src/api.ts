import { PortainerAuth } from './auth.ts';
import { logInfo, logWarn, logError } from '../logger.ts';
import { EnvironmentsMixin } from './mixins/EnvironmentMixins.ts';
import { ResourceFetchingMixin } from './mixins/ResourceFetchingMixin.ts';
import { ResourceDeletionMixin } from './mixins/ResourceDeletionMixin.ts';
import { ContainerControlsMixin } from './mixins/ContainerControlsMixin.ts';

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

const MixinStack = ContainerControlsMixin(
    ResourceDeletionMixin(
        ResourceFetchingMixin(
            EnvironmentsMixin(
                PortainerApiBase
            )
        )
    )
)

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
    }
}

const instance = new MixinStack(

);

export { instance as PortainerApiInstance };