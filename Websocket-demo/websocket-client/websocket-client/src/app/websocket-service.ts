import { Injectable, signal } from '@angular/core';
import { errorContext } from 'rxjs/internal/util/errorContext';

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  private socket: WebSocket | null = null;

  readonly status = signal<string>("Disconnected");
  readonly chat = signal<string[]>([]);

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
      console.log(event.data);
      try {
        const parsed = JSON.parse(event.data);
        const formatted = `${parsed.from}: ${parsed.message}`;

        this.chat.update(messages => [
          ...messages,
          formatted
        ]);

      } catch(err) {
        console.log(err);
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

    this.socket.send(JSON.stringify({ to, message }));
    const formatted = `me: ${message}`;
    this.chat.update(messages => [
      ...messages,
      formatted
    ]);
  }

  closeConnection(): void {
    this.socket?.close();
  }
}
