import { describe, it, expect, vi, beforeEach } from "vitest";
import { StackControlsMixin } from "../../src/mixins/StackControlsMixin.ts";
import { PortainerAuth } from "../../src/auth.ts";

class MockBase {
    auth = {
        axiosInstance: {
            post: vi.fn()
        }
    };
    ensureEnvId = vi.fn();
}

const StackControlsClass = StackControlsMixin(MockBase as any);

describe("Stack Controls Mixin Tests", () => {
    let instance: InstanceType<typeof StackControlsClass>;

    beforeEach(() => {
        vi.clearAllMocks();
        instance = new StackControlsClass();
    });

    describe("startStack()", () => {
        it("should accept undefined for optional environmentId parameter", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: { success: true } });
            
            const result = await instance.startStack(123, undefined);
            
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith("/api/stacks/123/start?endpointId=1");
        });

        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);
            
            const result = await instance.startStack(123);
            
            expect(result).toBe(false);
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(instance.auth.axiosInstance.post).not.toHaveBeenCalled();
        });

        it("should reject invalid stackId types", async () => {
            const result1 = await instance.startStack("invalid" as any);
            const result2 = await instance.startStack(null as any);
            const result3 = await instance.startStack(undefined as any);
            const result4 = await instance.startStack(-5 as any);
            const result5 = await instance.startStack(0 as any);
            const result6 = await instance.startStack(NaN as any);
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(result4).toBe(false);
            expect(result5).toBe(false);
            expect(result6).toBe(false);
        });

        it("should reject invalid environmentId types", async () => {
            const result1 = await instance.startStack(123, "invalid" as any);
            const result2 = await instance.startStack(123, NaN as any);
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
        });

        it("should handle invalid stack IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockRejectedValue(new Error("Stack not found"));
            
            const result = await instance.startStack(999, 1);
            
            expect(result).toBe(false);
        });

        it("should start stack successfully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: { success: true } });
            
            const result = await instance.startStack(123, 1);
            
            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith("/api/stacks/123/start?endpointId=1");
        });
    });

    describe("stopStack()", () => {
        it("should accept undefined for optional environmentId parameter", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: { success: true } });
            
            const result = await instance.stopStack(123, undefined);
            
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith("/api/stacks/123/stop?endpointId=1");
        });

        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);
            
            const result = await instance.stopStack(123);
            
            expect(result).toBe(false);
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(instance.auth.axiosInstance.post).not.toHaveBeenCalled();
        });

        it("should reject invalid stackId types", async () => {
            const result1 = await instance.stopStack("invalid" as any);
            const result2 = await instance.stopStack(null as any);
            const result3 = await instance.stopStack(undefined as any);
            const result4 = await instance.stopStack(-5 as any);
            const result5 = await instance.stopStack(0 as any);
            const result6 = await instance.stopStack(NaN as any);
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(result3).toBe(false);
            expect(result4).toBe(false);
            expect(result5).toBe(false);
            expect(result6).toBe(false);
        });

        it("should reject invalid environmentId types", async () => {
            const result1 = await instance.stopStack(123, "invalid" as any);
            const result2 = await instance.stopStack(123, NaN as any);
            
            expect(result1).toBe(false);
            expect(result2).toBe(false);
        });

        it("should handle invalid stack IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockRejectedValue(new Error("Stack not found"));
            
            const result = await instance.stopStack(999, 1);
            
            expect(result).toBe(false);
        });

        it("should stop stack successfully", async () => {
            instance.ensureEnvId.mockResolvedValue(1);
            instance.auth.axiosInstance.post.mockResolvedValue({ data: { success: true } });
            
            const result = await instance.stopStack(123, 1);
            
            expect(result).toBe(true);
            expect(instance.auth.axiosInstance.post).toHaveBeenCalledWith("/api/stacks/123/stop?endpointId=1");
        });
    });
});