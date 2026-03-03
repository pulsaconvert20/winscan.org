// WebSocket utility for real-time Tendermint RPC subscriptions

export interface BlockEvent {
  height: string;
  time: string;
  proposer: string;
}

export class TendermintWebSocket {
  private ws: WebSocket | null = null;
  private rpcUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private onBlockCallback: ((block: BlockEvent) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(rpcUrl: string) {
    // Convert HTTP RPC to WebSocket URL
    this.rpcUrl = rpcUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')
      .replace(/:\d+$/, '') + '/websocket';
  }

  connect() {
    try {
      console.log('[WebSocket] Connecting to:', this.rpcUrl);
      this.ws = new WebSocket(this.rpcUrl);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.reconnectAttempts = 0;
        
        // Subscribe to new blocks
        this.subscribe();
        
        // Start heartbeat to keep connection alive
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle subscription confirmation
          if (data.id === 'subscribe-blocks') {
            console.log('[WebSocket] Subscribed to new blocks');
            return;
          }
          
          // Handle new block events
          if (data.result?.data?.value?.block) {
            const block = data.result.data.value.block;
            const blockEvent: BlockEvent = {
              height: block.header.height,
              time: block.header.time,
              proposer: block.header.proposer_address,
            };
            
            if (this.onBlockCallback) {
              this.onBlockCallback(blockEvent);
            }
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // Silently handle WebSocket errors (many RPC don't support WS)
        console.log('[WebSocket] Connection failed, will use polling fallback');
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        this.stopHeartbeat();
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.attemptReconnect();
    }
  }

  private subscribe() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const subscribeMsg = {
      jsonrpc: '2.0',
      method: 'subscribe',
      id: 'subscribe-blocks',
      params: {
        query: "tm.event='NewBlock'"
      }
    };

    this.ws.send(JSON.stringify(subscribeMsg));
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        const pingMsg = {
          jsonrpc: '2.0',
          method: 'health',
          id: 'ping',
          params: {}
        };
        this.ws.send(JSON.stringify(pingMsg));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] Max reconnect attempts reached, WebSocket not supported');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  onBlock(callback: (block: BlockEvent) => void) {
    this.onBlockCallback = callback;
  }

  onError(callback: (error: any) => void) {
    this.onErrorCallback = callback;
  }

  disconnect() {
    console.log('[WebSocket] Disconnecting...');
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
