import { TexasHoldemStateDTO } from "@bitcoinbrisbane/block52";

type GameStateCallback = (gameState: TexasHoldemStateDTO) => void;

class WebSocketSingleton {
  private static instance: WebSocketSingleton;
  private subscriptions: Map<string, { 
    ws: WebSocket; 
    callbacks: Set<GameStateCallback>; 
    isConnecting: boolean;
    closeTimeout?: NodeJS.Timeout;
  }> = new Map();
  private wsUrl: string = "ws://localhost:3000";

  private constructor() {}

  public static getInstance(): WebSocketSingleton {
    if (!WebSocketSingleton.instance) {
      WebSocketSingleton.instance = new WebSocketSingleton();
    }
    return WebSocketSingleton.instance;
  }

  public subscribeToTable(
    tableAddress: string,
    playerId: string,
    callback: GameStateCallback
  ): () => void {
    const subscriptionKey = `${tableAddress}-${playerId}`;
    
    // Check if we already have an active subscription
    const existing = this.subscriptions.get(subscriptionKey);
    if (existing) {
      // Cancel any pending close timeout
      if (existing.closeTimeout) {
        clearTimeout(existing.closeTimeout);
        existing.closeTimeout = undefined;
      }

      if (existing.ws.readyState === WebSocket.OPEN) {
        console.log(`Reusing existing connection for table ${tableAddress}`);
        // Add callback to existing connection
        existing.callbacks.add(callback);
        return () => this.removeCallback(subscriptionKey, callback);
      } else if (existing.isConnecting) {
        console.log(`Adding callback to pending connection for table ${tableAddress}`);
        // Add callback to pending connection
        existing.callbacks.add(callback);
        return () => this.removeCallback(subscriptionKey, callback);
      }
    }

    // Clean up any existing subscription
    this.unsubscribeFromTable(subscriptionKey);

    console.log(`Creating new WebSocket connection for table ${tableAddress}`);

    // Create WebSocket connection with URL parameters for auto-subscription
    const wsUrl = `${this.wsUrl}?tableAddress=${tableAddress}&playerId=${playerId}`;
    const ws = new WebSocket(wsUrl);

    // Create new subscription with callback set
    const callbacks = new Set<GameStateCallback>();
    callbacks.add(callback);
    this.subscriptions.set(subscriptionKey, { ws, callbacks, isConnecting: true });

    ws.onopen = () => {
      console.log(`WebSocket connected to table ${tableAddress} for player ${playerId}`);
      // Update connection status
      const subscription = this.subscriptions.get(subscriptionKey);
      if (subscription) {
        subscription.isConnecting = false;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "gameStateUpdate" && message.tableAddress === tableAddress) {
          const subscription = this.subscriptions.get(subscriptionKey);
          if (subscription) {
            // Call all registered callbacks
            subscription.callbacks.forEach(cb => cb(message.gameState));
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket disconnected from table ${tableAddress}`);
      // Clean up the subscription
      this.subscriptions.delete(subscriptionKey);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Clean up on error
      this.subscriptions.delete(subscriptionKey);
    };

    // Return unsubscribe function
    return () => this.removeCallback(subscriptionKey, callback);
  }

  private removeCallback(subscriptionKey: string, callback: GameStateCallback): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.callbacks.delete(callback);
      
      // DEBOUNCING EXPLANATION:
      // We use debouncing here because React components (especially with multiple hooks) 
      // can cause rapid callback add/remove cycles during:
      // 1. Component mounting/unmounting
      // 2. Hook dependency changes
      // 3. React StrictMode double-execution (development)
      // 4. Parent component re-renders causing child hook re-execution
      //
      // WITHOUT debouncing: Connection closes immediately when callbacks.size === 0
      // This causes: Connect → Remove callback → Close → Re-connect → Remove callback → Close (loop)
      //
      // WITH debouncing: We wait 1000ms to see if new callbacks are added before closing
      // This allows: Connect → Remove callback → Wait → New callback added → Stay connected
      //
      // PRODUCTION BEST PRACTICES:
      // In well-architected React apps, debouncing WebSocket connections is NOT normal practice.
      // The goal should be stable, predictable connection lifecycle:
      // - Connect once when component mounts
      // - Stay connected during component lifetime  
      // - Disconnect once when component unmounts
      // 
      // IDEAL PRODUCTION PATTERN (without debouncing):
      // 1. Use stable state management (Redux, Zustand, or well-optimized Context)
      // 2. Minimize re-renders with React.memo, useMemo, useCallback
      // 3. Careful useEffect dependency arrays (only include what actually changes)
      // 4. Connection per user session, not per component render
      //
      // WHEN DEBOUNCING IS ACCEPTABLE:
      // - During development/prototyping phase
      // - Legacy codebases with complex re-render patterns
      // - As temporary fix while refactoring component architecture
      // - Apps with acceptable latency tolerance (not real-time critical)
      //
      // TO INVESTIGATE EXCESSIVE RENDERS before we can remove debouncing:
      // 1. Check Table.tsx and all downstream components - look for unnecessary useEffect dependencies
      // 2. Check useGameState.ts - ensure tableId comparison is working correctly  
      // 3. Check other hooks that use useGameState - they might be causing re-subscriptions
      // 4. Use React DevTools Profiler to identify which components are re-rendering
      // 5. Add console.logs in useGameState to track when/why subscriptions change
      //
      // IDEAL STATE: Each table should have exactly ONE subscription that stays stable
      // If you see multiple "Creating new WebSocket connection" logs, investigate the above
      
      // If no more callbacks, schedule connection close with debounce
      if (subscription.callbacks.size === 0) {
        console.log(`No more callbacks for ${subscriptionKey}, scheduling close in 1000ms`);
        
        // Cancel any existing timeout
        if (subscription.closeTimeout) {
          clearTimeout(subscription.closeTimeout);
        }
        
        // Schedule close with debounce to handle React re-render cycles
        subscription.closeTimeout = setTimeout(() => {
          // Double-check that there are still no callbacks
          const currentSubscription = this.subscriptions.get(subscriptionKey);
          if (currentSubscription && currentSubscription.callbacks.size === 0) {
            console.log(`Closing connection for ${subscriptionKey} after debounce`);
            this.unsubscribeFromTable(subscriptionKey);
          }
        }, 1000); // 1000ms debounce - adjust if needed based on your app's render patterns
      }
    }
  }

  private unsubscribeFromTable(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      // Clear any pending timeout
      if (subscription.closeTimeout) {
        clearTimeout(subscription.closeTimeout);
      }
      
      if (subscription.ws.readyState === WebSocket.OPEN || subscription.ws.readyState === WebSocket.CONNECTING) {
        subscription.ws.close();
      }
      this.subscriptions.delete(subscriptionKey);
      console.log(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  public cleanup(): void {
    this.subscriptions.forEach((subscription, key) => {
      this.unsubscribeFromTable(key);
    });
  }
}

export default WebSocketSingleton; 