import { Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { afterNextRender } from '@angular/core';
import { SignalingService } from './signaling-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  @ViewChild('localVideo') localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef<HTMLVideoElement>;

  constructor() {

    effect(() => {
      const local = this.localStream();
      if (local && this.localVideo) {
        this.localVideo.nativeElement.srcObject = local;
      }
    });

    effect(() => {
      const remote = this.remoteStream();
      if (remote && this.remoteVideo) {
        this.remoteVideo.nativeElement.srcObject = remote;
      }
    });

  }

  protected readonly title = signal('call-demo');

  private signaling = inject(SignalingService);
  connectionStatus = this.signaling.connectionStatus;
  readonly callState = this.signaling.callState;
  readonly callSender = this.signaling.callSender;
  readonly localStream = this.signaling.localStream;
  readonly remoteStream = this.signaling.remoteStream;
  readonly remoteAudioOff = this.signaling.remoteAudioMuted;
  readonly remoteVideoOff = this.signaling.remoteVideoMuted;

  userid = signal('');
  targetUser = signal('');

  connect() {
    if (!this.userid()) return;
    this.signaling.connect(this.userid());
  }

  disconnect() {
    if (!this.userid()) return;
    this.signaling.disconnect();
  }

  startCall() {
    if (!this.targetUser()) return;
    if (this.targetUser() === this.userid()) {
      alert("can't call to yourself!");
      return;
    };

    this.signaling.startCall(this.targetUser());
  }

  acceptCall() {
    this.signaling.acceptCall();
  }

  rejectCall() {
    this.signaling.rejectCall();
  }

  endCall() {
    this.signaling.endCall();
  }

  mute() {
    this.signaling.toggleAudio();
  }

  cameraOff() {
    this.signaling.toggleCamera();
  }
}
