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
        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);
            
            const result = await instance.startStack(123);
            
            expect(result).toBe(false);
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(instance.auth.axiosInstance.post).not.toHaveBeenCalled();
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
        it("should handle undefined environment IDs gracefully", async () => {
            instance.ensureEnvId.mockResolvedValue(null);
            
            const result = await instance.stopStack(123);
            
            expect(result).toBe(false);
            expect(instance.ensureEnvId).toHaveBeenCalled();
            expect(instance.auth.axiosInstance.post).not.toHaveBeenCalled();
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