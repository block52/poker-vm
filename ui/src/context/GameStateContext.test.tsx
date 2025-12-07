import React from "react";
import { render, screen } from "@testing-library/react";
import { GameStateProvider, useGameStateContext } from "./GameStateContext";
import { NetworkProvider } from "./NetworkContext";

// Test addresses
const TEST_PLAYER_1 = "b521qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5z5tpwxqer";

// Mock the signing module
jest.mock("../utils/cosmos/signing", () => ({
    createAuthPayload: jest.fn().mockResolvedValue({
        playerAddress: "b521qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5z5tpwxqer",
        timestamp: Date.now(),
        signature: "mock-signature-12345"
    })
}));

// Helper component to access context in tests
const TestConsumer: React.FC = () => {
    const context = useGameStateContext();

    return (
        <div>
            <span data-testid="is-loading">{context.isLoading.toString()}</span>
            <span data-testid="has-error">{(context.error !== null).toString()}</span>
            <span data-testid="has-game-state">{(context.gameState !== undefined).toString()}</span>
            <span data-testid="has-pending-action">{(context.pendingAction !== null).toString()}</span>
            <span data-testid="has-subscribe">{(typeof context.subscribeToTable === "function").toString()}</span>
            <span data-testid="has-unsubscribe">{(typeof context.unsubscribeFromTable === "function").toString()}</span>
            <span data-testid="has-send-action">{(typeof context.sendAction === "function").toString()}</span>
        </div>
    );
};

// Wrapper with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NetworkProvider>
        <GameStateProvider>{children}</GameStateProvider>
    </NetworkProvider>
);

describe("GameStateContext", () => {
    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem("user_cosmos_address", TEST_PLAYER_1);
    });

    describe("GameStateProvider", () => {
        it("should provide context to children", () => {
            render(
                <TestWrapper>
                    <TestConsumer />
                </TestWrapper>
            );

            expect(screen.getByTestId("is-loading")).toBeInTheDocument();
            expect(screen.getByTestId("has-error")).toBeInTheDocument();
            expect(screen.getByTestId("has-game-state")).toBeInTheDocument();
        });

        it("should have initial state with no game state and not loading", () => {
            render(
                <TestWrapper>
                    <TestConsumer />
                </TestWrapper>
            );

            expect(screen.getByTestId("is-loading").textContent).toBe("false");
            expect(screen.getByTestId("has-error").textContent).toBe("false");
            expect(screen.getByTestId("has-game-state").textContent).toBe("false");
            expect(screen.getByTestId("has-pending-action").textContent).toBe("false");
        });

        it("should provide all required context methods", () => {
            render(
                <TestWrapper>
                    <TestConsumer />
                </TestWrapper>
            );

            expect(screen.getByTestId("has-subscribe").textContent).toBe("true");
            expect(screen.getByTestId("has-unsubscribe").textContent).toBe("true");
            expect(screen.getByTestId("has-send-action").textContent).toBe("true");
        });
    });

    describe("useGameStateContext hook", () => {
        it("should throw error when used outside provider", () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            expect(() => {
                render(<TestConsumer />);
            }).toThrow("useGameStateContext must be used within a GameStateProvider");

            consoleSpy.mockRestore();
        });

        it("should return context with correct shape", () => {
            let capturedContext: ReturnType<typeof useGameStateContext> | null = null;

            const ContextCapture: React.FC = () => {
                capturedContext = useGameStateContext();
                return null;
            };

            render(
                <TestWrapper>
                    <ContextCapture />
                </TestWrapper>
            );

            expect(capturedContext).not.toBeNull();
            expect(capturedContext!.gameState).toBeUndefined();
            expect(capturedContext!.isLoading).toBe(false);
            expect(capturedContext!.error).toBeNull();
            expect(capturedContext!.pendingAction).toBeNull();
            expect(typeof capturedContext!.subscribeToTable).toBe("function");
            expect(typeof capturedContext!.unsubscribeFromTable).toBe("function");
            expect(typeof capturedContext!.sendAction).toBe("function");
        });
    });

    describe("context stability", () => {
        it("should provide stable function references", () => {
            const functionRefs: Array<{
                subscribe: typeof useGameStateContext extends () => infer R ? R["subscribeToTable"] : never;
                unsubscribe: typeof useGameStateContext extends () => infer R ? R["unsubscribeFromTable"] : never;
            }> = [];

            const RefCapture: React.FC = () => {
                const { subscribeToTable, unsubscribeFromTable } = useGameStateContext();
                functionRefs.push({ subscribe: subscribeToTable, unsubscribe: unsubscribeFromTable });
                return null;
            };

            const { rerender } = render(
                <TestWrapper>
                    <RefCapture />
                </TestWrapper>
            );

            rerender(
                <TestWrapper>
                    <RefCapture />
                </TestWrapper>
            );

            // unsubscribeFromTable should be stable (empty deps)
            expect(functionRefs[0].unsubscribe).toBe(functionRefs[1].unsubscribe);
        });
    });
});
