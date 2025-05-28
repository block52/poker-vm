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
      
      // If no more callbacks, schedule connection close with debounce
      if (subscription.callbacks.size === 0) {
        console.log(`No more callbacks for ${subscriptionKey}, scheduling close in 1000ms`);
        
        // Cancel any existing timeout
        if (subscription.closeTimeout) {
          clearTimeout(subscription.closeTimeout);
        }
        
        // Schedule close with debounce to handle React StrictMode
        subscription.closeTimeout = setTimeout(() => {
          // Double-check that there are still no callbacks
          const currentSubscription = this.subscriptions.get(subscriptionKey);
          if (currentSubscription && currentSubscription.callbacks.size === 0) {
            console.log(`Closing connection for ${subscriptionKey} after debounce`);
            this.unsubscribeFromTable(subscriptionKey);
          }
        }, 1000); // 1000ms debounce (increased from 100ms)
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