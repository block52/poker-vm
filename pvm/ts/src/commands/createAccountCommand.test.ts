import { ethers } from "ethers";
import { CreateAccountCommand } from "./createAccountCommand";
import { getAccountManagementInstance } from "../state/accountManagement";
import { Account } from "../models";

// Mock the account management module
jest.mock("../state/accountManagement");

describe("CreateAccountCommand Tests", () => {
    // Mock instances
    let mockAccountManagement: jest.Mocked<any>;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock account management with a mock account return value
        mockAccountManagement = {
            createAccount: jest.fn().mockResolvedValue(
                new Account(
                    ethers.Wallet.createRandom().address,
                    BigInt(0),
                    0
                )
            )
        };
        
        // Log the mock structure
        console.log("Mock Account Management Structure:", {
            type: "Mock Object",
            methods: Object.keys(mockAccountManagement),
            createAccountType: typeof mockAccountManagement.createAccount,
            isMockFunction: jest.isMockFunction(mockAccountManagement.createAccount)
        });

        (getAccountManagementInstance as jest.Mock).mockReturnValue(mockAccountManagement);
        
        // Log what getAccountManagementInstance returns
        console.log("Mocked getInstance returns:", getAccountManagementInstance());
    });

    it("should create a new account", async () => {
        // Generate a random private key for testing
        const wallet = ethers.Wallet.createRandom();
        const privateKey = wallet.privateKey;

        // Create the command
        const command = new CreateAccountCommand(privateKey);
        
        // Execute the command
        const response = await command.execute();

        // Log the mock function calls
        console.log("Mock createAccount was called with:", mockAccountManagement.createAccount.mock.calls);
        console.log("Mock createAccount returned:", await mockAccountManagement.createAccount.mock.results[0].value);

        // Verify the account management was called
        expect(mockAccountManagement.createAccount).toHaveBeenCalledWith(privateKey);
        
        // Verify the response structure
        expect(response).toHaveProperty('data');
        expect(response).toHaveProperty('signature');
        expect(response.data).toHaveProperty('address');
        expect(response.data).toHaveProperty('balance');
        expect(response.data).toHaveProperty('nonce');
    });

    it("should fail with invalid private key", async () => {
        // Test with invalid private key
        const invalidPrivateKey = "invalid-key";

        // Create the command
        const command = new CreateAccountCommand(invalidPrivateKey);

        // Execute and expect error
        await expect(command.execute()).rejects.toThrow();
    });
});
