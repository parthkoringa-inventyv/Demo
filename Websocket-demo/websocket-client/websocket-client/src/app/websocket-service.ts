import { Injectable, signal } from '@angular/core';
import { errorContext } from 'rxjs/internal/util/errorContext';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: WebSocket | null = null;

  readonly status = signal<string>("Disconnected");
  readonly chat = signal<string[]>([]);
  readonly remoteTyping = signal<boolean>(false);
  private typingTimeout: any = null;
  private isTyping = false;

  connect(userId: string): void {
    if (this.socket) return;

    const host = window.location.hostname;

    this.socket = new WebSocket(
      `ws://${host}:8080?userId=${userId}`
    );

    this.socket.onopen = () => {
      this.status.set("Connected");
    };

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed.error) {
          console.error("Server error:", parsed.error);
          this.chat.update(messages => messages.slice(0, -1));
          // Option A: Show alert
          alert(parsed.error);

          return;
        }

        switch (parsed.type) {
          case "typing":
            this.remoteTyping.set(true);
            return;

          case "stop_typing":
            this.remoteTyping.set(false);
            return;

          case "chat":
            if (!parsed.from || !parsed.message) return;

            this.chat.update(messages => [
              ...messages,
              `${parsed.from}: ${parsed.message}`
            ]);
            return;
        }

      } catch (err) {
        console.log("Error: ", err);
      }
    };

    this.socket.onclose = () => {
      this.status.set("Closed");
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error(error);
    };
  }

  sendMessage(to: string, message: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.log("WebSocket not open");
      return;
    }

    this.socket.send(JSON.stringify({
      type: "chat",
      to,
      message
    }));

    const formatted = `me: ${message}`;
    this.chat.update(messages => [
      ...messages,
      formatted
    ]);
  }

  closeConnection(): void {
    this.socket?.close();
  }

  sendTyping(to: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    if (!this.isTyping) {
      this.isTyping = true;

      this.socket.send(JSON.stringify({
        type: "typing",
        to
      }));
    }

    // Reset timeout
    clearTimeout(this.typingTimeout);

    this.typingTimeout = setTimeout(() => {
      this.stopTyping(to);
    }, 3000); // 1 second after user stops typing
  }

  stopTyping(to: string) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;

    if (this.isTyping) {
      this.socket.send(JSON.stringify({
        type: "stop_typing",
        to
      }));
    }

    this.isTyping = false;
  }
}
