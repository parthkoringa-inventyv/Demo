import { Component, inject, input, signal } from '@angular/core';
import { WebsocketService } from './websocket-service';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('websocket-client');
  
  readonly wsService = inject(WebsocketService);
  msg = "";
  userid = "";
  target = "";
  connect()
  {
    this.wsService.connect(this.userid);
  }

  disconnect()
  {
    this.wsService.closeConnection();
  }

  sendMessage()
  {
    this.wsService.sendMessage(this.target,this.msg);
  }
}
