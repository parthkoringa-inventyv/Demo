import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkerService } from './worker-service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('shared-worker-demo');
  private service = inject(WorkerService);

  readonly messages = this.service.messages;
  readonly portStatus = this.service.portStatus;

  searchId!: number;
  msgId!: number;
  msgContent!: string;

  add() {
    if (!this.msgId || !this.msgContent) return;

    this.service.addMessage(this.msgId, this.msgContent);

    this.msgId = undefined as any;
    this.msgContent = '';
  }

  // searchById() {
  //   throw new Error('Method not implemented.');
  // }

  delete(msg_id: number) {
    this.service.deleteMessage(msg_id);
  }
}