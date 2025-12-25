import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnvironmentsMixin } from "../../src/mixins/EnvironmentMixins.ts";

class MockBase {
    auth = {
        axiosInstance: {
            get: vi.fn()
        },
        isValidated: true
    };
    environmentId: number | null = 1;
}

const EnvironmentsClass = EnvironmentsMixin(MockBase as any);

describe("Environment Mixin Tests", () => {
    let instance: InstanceType<typeof EnvironmentsClass>;

    beforeEach(() => {
        vi.clearAllMocks();
        instance = new EnvironmentsClass();
        instance.auth.isValidated = true;
        instance.environmentId = 1;
    });

    describe("getEnvironmentDetails()", () => {
        it("should handle an invalid authentication cycle gracefully", async () => {
            instance.auth.isValidated = false;

            const result = await instance.getEnvironmentDetails();

            expect(result).toBeUndefined();
            expect(instance.auth.axiosInstance.get).not.toHaveBeenCalled();
        });

        it("should handle invalid environment IDs correctly", async () => {
            instance.environmentId = 999;
            instance.auth.axiosInstance.get.mockRejectedValue(new Error("Environment not found"));

            const result = await instance.getEnvironmentDetails();

            expect(result).toBeUndefined();
        });

        it("should handle API errors gracefully", async () => {
            instance.auth.axiosInstance.get.mockRejectedValue(new Error("API Error"));

            const result = await instance.getEnvironmentDetails();

            expect(result).toBeUndefined();
        });

        it("should return environment details for valid environment IDs", async () => {
            const mockEnvironment = { Id: 1, Name: "Test Environment" };
            instance.auth.axiosInstance.get.mockResolvedValue({ data: mockEnvironment });

            const result = await instance.getEnvironmentDetails();

            expect(result).toEqual(mockEnvironment);
            expect(instance.auth.axiosInstance.get).toHaveBeenCalledWith("/api/endpoints/1");
        });
    });

    describe("getEnvironments()", () => {
        it("should handle an invalid authentication cycle gracefully", async () => {
            instance.auth.isValidated = false;

            const result = await instance.getEnvironments();

            expect(result).toBeUndefined();
            expect(instance.auth.axiosInstance.get).not.toHaveBeenCalled();
        });

        it("should handle API errors gracefully", async () => {
            instance.auth.axiosInstance.get.mockRejectedValue(new Error("API Error"));

            const result = await instance.getEnvironments();

            expect(result).toBeUndefined();
        });

        it("should return a list of environments for successful API call", async () => {
            const mockEnvironments = [
                { Id: 1, Name: "Environment 1" },
                { Id: 2, Name: "Environment 2" }
            ];
            instance.auth.axiosInstance.get.mockResolvedValue({ data: mockEnvironments });

            const result = await instance.getEnvironments();

            expect(result).toEqual(mockEnvironments);
            expect(result?.length).toBe(2);
            expect(instance.auth.axiosInstance.get).toHaveBeenCalledWith("/api/endpoints");
        });
    });

    describe("ensureEnvId()", () => {
        it("should return a valid environment ID when environments are available", async () => {
            instance.environmentId = 5;

            const result = await instance.ensureEnvId();

            expect(result).toBe(5);
        });

        it("should return null when no environments are available", async () => {
            instance.environmentId = null;
            // Mock getFirstEnvironmentId to return null
            vi.mock("../../src/utils.ts", () => ({
                getFirstEnvironmentId: vi.fn().mockResolvedValue(null)
            }));

            const result = await instance.ensureEnvId();

            expect(result).toBe(null);
        });
    });
});