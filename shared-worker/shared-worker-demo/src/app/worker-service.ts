import { Injectable, signal } from '@angular/core';

export interface Message {
  msg_id: number;
  msg_content: string;
}

@Injectable({
  providedIn: 'root',
})
export class WorkerService {

  private worker: SharedWorker;
  private port: MessagePort;

  readonly messages = signal<Message[]>([]);
  readonly portStatus = signal(false);

  constructor() {
    this.worker = new SharedWorker(
      '/assets/workers/sharedWorker.js',
      { type: 'module' }
    );
    this.port = this.worker.port;
    console.log("worker stated ");

    this.port.onmessage = (event) => {
      const { type, payload, message } = event.data;

      switch (type) {

        case 'ALL_MESSAGES':
          this.messages.set(payload);
          break;

        case 'SYNC':
          this.loadMessages();
          break;

        case 'ERROR':
          console.error('[Angular] Worker error:', message);
          break;
      }
    };

    this.port.start();

    this.portStatus.set(true);

    // Initial load 
    this.loadMessages();
  }

  addMessage(msg_id: number, msg_content: string) {
    this.port.postMessage({
      action: 'ADD_MESSAGE',
      payload: { msg_id, msg_content }
    });
  }

  loadMessages() {
    this.port.postMessage({
      action: 'GET_ALL_MESSAGES'
    });
  }

  deleteMessage(msg_id: number) {
    this.port.postMessage({
      action: 'DELETE_MESSAGE',
      payload: { msg_id }
    });
  }
}