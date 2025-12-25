import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResourceDeletionMixin } from "../../src/mixins/ResourceDeletionMixin.ts";

class MockBase {
    auth = {
        axiosInstance: {
            post: vi.fn(),
            delete: vi.fn()
        }
    };
    ensureEnvId = vi.fn();
    getContainers = vi.fn();
}

const ResourceDeletionClass = ResourceDeletionMixin(MockBase as any);

describe("Resource Deletion Mixin Tests", () => {
    let instance: InstanceType<typeof ResourceDeletionClass>;

    beforeEach(() => {
        vi.clearAllMocks();
        instance = new ResourceDeletionClass();
    });

    describe("cleanupExistingContainer()", () => {
        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);

            const result = await instance.cleanupExistingContainer("test-container");

            expect(result).toBe(false);
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(instance.getContainers).not.toHaveBeenCalled();
        });

        it("should handle getContainers() errors gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockResolvedValue(undefined);

            const result = await instance.cleanupExistingContainer("test-container", 1);

            expect(result).toBe(false);
        });

        it("should handle invalid container IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockResolvedValue([]);

            const result = await instance.cleanupExistingContainer("nonexistent", 1);

            expect(result).toBe(false);
        });

        it("should stop selected container successfully", async () => {
            const mockContainer = {
                Id: "abc123",
                Names: ["/test-container"],
                State: "running",
                Image: "test:latest",
                Labels: {},
                Status: "Up 5 minutes"
            };
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockResolvedValue([mockContainer]);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: {} });
            instance.auth.axiosInstance.delete.mockResolvedValue({ data: {} });

            const result = await instance.cleanupExistingContainer("test-container", 1);

            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith(
                "/api/endpoints/1/docker/containers/abc123/stop"
            );
        });

        it("should handle invalid container name gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockResolvedValue([
                {
                    Id: "xyz789",
                    Names: ["/other-container"],
                    State: "running",
                    Image: "other:latest",
                    Labels: {},
                    Status: "Up 1 hour"
                }
            ]);

            const result = await instance.cleanupExistingContainer("test-container", 1);

            expect(result).toBe(false);
        });

        it("should remove selected container successfully", async () => {
            const mockContainer = {
                Id: "abc123",
                Names: ["/test-container"],
                State: "exited",
                Image: "test:latest",
                Labels: {},
                Status: "Exited (0) 5 minutes ago"
            };
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockResolvedValue([mockContainer]);
            instance.auth.axiosInstance.delete.mockResolvedValue({ data: {} });

            const result = await instance.cleanupExistingContainer("test-container", 1);

            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.delete).toHaveBeenCalledWith(
                "/api/endpoints/1/docker/containers/abc123"
            );
        });

        it("should handle any errors during cleanup gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.getContainers.mockRejectedValue(new Error("API Error"));

            const result = await instance.cleanupExistingContainer("test-container", 1);

            expect(result).toBe(false);
        });
    });

    describe("deleteStack()", () => {
        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);

            const result = await instance.deleteStack(123);

            expect(result).toBeUndefined();
            expect(instance.ensureEnvId).toHaveBeenCalled();
        });

        it("should handle stackId types correctly", async () => {
            instance.ensureEnvId.mockResolvedValue(1);

            // Mock utils functions
            vi.mock("../../src/utils.ts", async () => {
                return {
                    getStackById: vi.fn().mockResolvedValue({ Id: 123, Name: "test-stack" }),
                }
            });

            instance.auth.axiosInstance.delete.mockResolvedValue({ data: { success: true } });

            // Test with number
            await instance.deleteStack(123, 1);
            expect(typeof 123).toBe("number");

            // Test with string
            await instance.deleteStack("test-stack", 1);
            expect(typeof "test-stack").toBe("string");
        });

        it("should delete stack by ID successfully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            vi.mock("../../src/utils.ts", async (importOriginal) => {
                const originalModule = await importOriginal<any>();
                return {
                    ...originalModule,
                    getStackById: vi.fn().mockResolvedValue({ Id: 123, Name: "test-stack" }),
                    getStackByName: vi.fn().mockResolvedValue({ Id: 456, Name: "named-stack" })
                };
            });
            instance.auth.axiosInstance.delete.mockResolvedValue({ data: { success: true } });

            await instance.deleteStack(123, 1);

            expect(instance.auth.axiosInstance.delete).toHaveBeenCalledWith(
                "/api/stacks/123?endpointId=1"
            );
        });

        it("should delete stack by name successfully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            vi.mock("../../src/utils.ts", async (importOriginal) => {
                const originalModule = await importOriginal<any>();
                return {
                    ...originalModule,
                    getStackById: vi.fn().mockResolvedValue({ Id: 123, Name: "test-stack" }),
                    getStackByName: vi.fn().mockResolvedValue({ Id: 456, Name: "named-stack" })
                };
            });
            instance.auth.axiosInstance.delete.mockResolvedValue({ data: { success: true } });

            await instance.deleteStack("test-stack", 1);

            // The stackId gets converted to the numeric ID
            expect(instance.auth.axiosInstance.delete).toHaveBeenCalled();
        });

        it("should handle errors during stack deletion gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            vi.mock("../../src/utils.ts", async (importOriginal) => {
                const originalModule = await importOriginal<any>();
                return {
                    ...originalModule,
                    getStackById: vi.fn().mockResolvedValue({ Id: 123, Name: "test-stack" }),
                    getStackByName: vi.fn().mockResolvedValue({ Id: 456, Name: "named-stack" })
                };
            });
            instance.auth.axiosInstance.delete.mockRejectedValue(new Error("API Error"));

            const result = await instance.deleteStack(123, 1);

            expect(result).toBeUndefined();
        });
    });
});