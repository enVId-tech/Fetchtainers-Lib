import { describe, it, expect, vi, beforeEach } from "vitest";
import { ContainerControlsMixin } from "../../src/mixins/ContainerControlsMixin.ts";

class MockBase {
    auth = {
        axiosInstance: {
            post: vi.fn(),
            delete: vi.fn()
        }
    };
    ensureEnvId = vi.fn();
}

const ContainerControlsClass = ContainerControlsMixin(MockBase as any);

describe("Container Controls Tests", () => {
    let instance: InstanceType<typeof ContainerControlsClass>;

    beforeEach(() => {
        vi.clearAllMocks();
        instance = new ContainerControlsClass();
    });

    describe("handleContainer()", () => {
        it("should handle container actions correctly", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: { success: true } });

            const result = await instance.handleContainer({
                action: 'start',
                containerId: 'abc123',
                environmentId: 1
            });

            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalled();
        });

        it("should reject invalid controls parameter types", async () => {
            const result1 = await instance.handleContainer(null as any);
            const result2 = await instance.handleContainer(undefined as any);
            const result3 = await instance.handleContainer("invalid" as any);
            const result4 = await instance.handleContainer(123 as any);
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(result4).toBe(false);
        });

        it("should reject invalid action types", async () => {
            const result1 = await instance.handleContainer({
                action: null as any,
                containerId: 'abc123'
            });
            const result2 = await instance.handleContainer({
                action: 123 as any,
                containerId: 'abc123'
            });
            const result3 = await instance.handleContainer({
                action: '' as any,
                containerId: 'abc123'
            });
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });

        it("should reject invalid containerId types", async () => {
            const result1 = await instance.handleContainer({
                action: 'start',
                containerId: null as any
            });
            const result2 = await instance.handleContainer({
                action: 'start',
                containerId: 123 as any
            });
            const result3 = await instance.handleContainer({
                action: 'start',
                containerId: '' as any
            });
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
        });

        it("should reject invalid environmentId types", async () => {
            const result = await instance.handleContainer({
                action: 'start',
                containerId: 'abc123',
                environmentId: "invalid" as any
            });
            
            expect(result).toBe(false);
        });

        it("should reject invalid options types", async () => {
            const result1 = await instance.handleContainer({
                action: 'remove',
                containerId: 'abc123',
                environmentId: 1,
                options: { force: "yes" as any }
            });
            const result2 = await instance.handleContainer({
                action: 'remove',
                containerId: 'abc123',
                environmentId: 1,
                options: { removeVolumes: 1 as any }
            });
            const result3 = await instance.handleContainer({
                action: 'kill',
                containerId: 'abc123',
                environmentId: 1,
                options: { signal: 123 as any }
            });
            const result4 = await instance.handleContainer({
                action: 'restart',
                containerId: 'abc123',
                environmentId: 1,
                options: { timeout: "10" as any }
            });
            const result5 = await instance.handleContainer({
                action: 'restart',
                containerId: 'abc123',
                environmentId: 1,
                options: { timeout: -5 }
            });
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(result4).toBe(false);
            expect(result5).toBe(false);
        });

        it("should return false when no environment ID is found", async () => {
            instance.ensureEnvId.mockResolvedValue(null);

            const result = await instance.handleContainer({
                action: 'start',
                containerId: 'abc123'
            });

            expect(result).toBe(false);
            expect(instance.auth.axiosInstance.post).not.toHaveBeenCalled();
        });

        it("should return false for unknown actions", async () => {
            instance.ensureEnvId.mockResolvedValue(1);

            const result = await instance.handleContainer({
                action: 'unknown' as any,
                containerId: 'abc123',
                environmentId: 1
            });

            expect(result).toBe(false);
        });

        it("should return false when an error occurs during the action", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockRejectedValue(new Error("API Error"));

            const result = await instance.handleContainer({
                action: 'start',
                containerId: 'abc123',
                environmentId: 1
            });

            expect(result).toBe(false);
        });

        describe("action: 'start'", () => {
            it("should start the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'start',
                    containerId: 'abc123',
                    environmentId: 1
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    "/api/endpoints/1/docker/containers/abc123/start"
                );
            });
        });

        describe("action: 'stop'", () => {
            it("should stop the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'stop',
                    containerId: 'abc123',
                    environmentId: 1
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    "/api/endpoints/1/docker/containers/abc123/stop"
                );
            });
        });

        describe("action: 'remove'", () => {
            it("should remove the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.delete.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'remove',
                    containerId: 'abc123',
                    environmentId: 1,
                    options: { force: true, removeVolumes: true }
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.delete).toHaveBeenCalledWith(
                    expect.stringContaining("/api/endpoints/1/docker/containers/abc123")
                );
            });
        });

        describe("action: 'kill'", () => {
            it("should kill the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'kill',
                    containerId: 'abc123',
                    environmentId: 1,
                    options: { signal: 'SIGTERM' }
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    "/api/endpoints/1/docker/containers/abc123/kill?signal=SIGTERM"
                );
            });
        });

        describe("action: 'pause'", () => {
            it("should pause the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'pause',
                    containerId: 'abc123',
                    environmentId: 1
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    "/api/endpoints/1/docker/containers/abc123/pause"
                );
            });
        });

        describe("action: 'unpause'", () => {
            it("should unpause the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'unpause',
                    containerId: 'abc123',
                    environmentId: 1
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    "/api/endpoints/1/docker/containers/abc123/unpause"
                );
            });
        });

        describe("action: 'restart'", () => {
            it("should restart the container successfully", async () => {
                instance.ensureEnvId.mockResolvedValue(1);
                instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });

                const result = await instance.handleContainer({
                    action: 'restart',
                    containerId: 'abc123',
                    environmentId: 1,
                    options: { timeout: 5000 }
                });

                expect(result).toBe(true);
                expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                    expect.stringContaining("/api/endpoints/1/docker/containers/abc123/restart")
                );
            });
        });
    });
});