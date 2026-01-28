type SSEController = ReadableStreamDefaultController<Uint8Array>;

interface SSEClient {
  controller: SSEController;
  userId: string;
}

class SSEBroadcaster {
  private clients: Map<string, Set<SSEController>> = new Map();
  private encoder = new TextEncoder();

  addClient(userId: string, controller: SSEController): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(controller);
  }

  removeClient(userId: string, controller: SSEController): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(controller);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  send(userId: string, data: unknown): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) return;

    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = this.encoder.encode(message);

    userClients.forEach((controller) => {
      try {
        controller.enqueue(encoded);
      } catch {
        this.removeClient(userId, controller);
      }
    });
  }

  sendToMany(userIds: string[], data: unknown): void {
    userIds.forEach((userId) => this.send(userId, data));
  }

  broadcast(data: unknown): void {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoded = this.encoder.encode(message);

    this.clients.forEach((controllers, userId) => {
      controllers.forEach((controller) => {
        try {
          controller.enqueue(encoded);
        } catch {
          this.removeClient(userId, controller);
        }
      });
    });
  }

  getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.clients.has(userId) && this.clients.get(userId)!.size > 0;
  }
}

declare global {
  var sseBroadcaster: SSEBroadcaster | undefined;
}

export const sseBroadcaster = globalThis.sseBroadcaster || new SSEBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalThis.sseBroadcaster = sseBroadcaster;
}
