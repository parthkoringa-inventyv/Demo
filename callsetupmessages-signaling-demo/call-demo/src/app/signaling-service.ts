import { Injectable, signal } from '@angular/core';
import { every, single } from 'rxjs';

export interface setupMessage {
  type: string,
  to: string,
  from?: string,
  sdp?: any,
  ice_candidate?: any,
  audioMuted?: boolean,
  videoMuted?: boolean
}

export type callStatus = "idle" | "calling" | "in-call" | "incoming_call";

@Injectable({
  providedIn: 'root',
})
export class SignalingService {

  readonly connectionStatus = signal<"Disconnected" | "Connected">("Disconnected");
  readonly callState = signal<callStatus>("idle");
  readonly callSender = signal<string | null>(null);
  readonly remoteAudioMuted = signal<boolean>(false);
  readonly remoteVideoMuted = signal<boolean>(false);
  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);
  private pendingIceCandidates: RTCIceCandidateInit[] = [];

  private socket: WebSocket | null = null;
  private peerConnection!: RTCPeerConnection;
  currentUser!: string;
  targetUser!: string;

  startCall(target: string) {
    this.targetUser = target;
    this.callState.set('calling');

    this.send({
      type: 'start_call',
      to: target
    });
    console.log("call start message send");

  }

  acceptCall() {
    if (!this.callSender()) return;

    this.targetUser = this.callSender()!;

    this.send({
      type: 'accept_call',
      to: this.targetUser
    });

    this.callSender.set(null);
    this.callState.set('in-call');
  }

  rejectCall() {
    if (!this.callSender()) return;

    this.send({
      type: 'reject_call',
      to: this.callSender()!
    });

    this.callSender.set(null);
    this.callState.set('idle');
  }

  endCall() {
    this.send({
      type: "hangup_call",
      to: this.targetUser,
    })
    this.cleanup();
  }

  private send(msg: setupMessage) {
    this.socket?.send(JSON.stringify(msg));
  }

  connect(userId: string) {
    if (this.socket) return;

    this.currentUser = userId;

    this.socket = new WebSocket(`wss://192.168.10.25:8080?userId=${userId}`);

    this.socket.onopen = () => {
      this.connectionStatus.set("Connected");
    }

    this.socket.onclose = () => {
      this.cleanup();
      this.connectionStatus.set("Disconnected");
      this.socket = null;
    }

    this.socket.onmessage = (event) => {
      const notification: setupMessage = JSON.parse(event.data);
      this.handleNotification(notification);
    }

    this.socket.onerror = (error) => {
      console.error(error);
    }
  }

  async handleNotification(msg: setupMessage) {
    switch (msg.type) {
      case ("start_call"):
        this.callState.set("incoming_call");
        this.callSender.set(msg.from!);
        console.log("incoming call");

        break;

      case ("accept_call"):
        await this.handleAccepted();
        this.callState.set("in-call");
        console.log("call started");
        break;

      case ("reject_call"):
        this.callState.set("idle");
        alert("Calle rejected the call");
        break;

      case ("hangup_call"):
        this.callState.set("idle");
        alert("call ended");
        this.cleanup();
        break;

      case ("media_status"):
        if (typeof msg.audioMuted === 'boolean') {
          this.remoteAudioMuted.set(msg.audioMuted);
        }

        if (typeof msg.videoMuted === 'boolean') {
          this.remoteVideoMuted.set(msg.videoMuted);
        }

        break;

      case ("sdp_offer"):
        await this.handleOffer(msg);
        console.log("sdp offer received", msg.sdp);

        break;

      case ("sdp_answer"):
        await this.handleAnswer(msg);
        console.log("sdp answer received", msg.sdp);

        break;

      case ("ice_candidate"):
        if (this.peerConnection?.remoteDescription) {
          await this.peerConnection.addIceCandidate(msg.ice_candidate);
        } else {
          this.pendingIceCandidates.push(msg.ice_candidate);
        }

        console.log("ice candidate received", msg.ice_candidate);

        break;
    }
  }

  async initPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    this.localStream.set(stream);

    stream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, stream);
    });

    this.peerConnection.ontrack = (event) => {
      this.remoteStream.set(event.streams[0]);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.send({
          type: 'ice_candidate',
          to: this.targetUser,
          ice_candidate: event.candidate
        });
      }
    };
  }

  async handleAccepted() {
    await this.initPeerConnection();

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    this.send({
      type: "sdp_offer",
      to: this.targetUser,
      sdp: offer
    });
  }

  async handleAnswer(msg: setupMessage) {
    await this.peerConnection.setRemoteDescription(msg.sdp);
    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];

  }

  async handleOffer(msg: setupMessage) {
    await this.initPeerConnection();

    await this.peerConnection.setRemoteDescription(msg.sdp);

    for (const candidate of this.pendingIceCandidates) {
      await this.peerConnection.addIceCandidate(candidate);
    }
    this.pendingIceCandidates = [];

    const answer = await this.peerConnection.createAnswer();

    await this.peerConnection.setLocalDescription(answer);

    this.send({
      type: "sdp_answer",
      to: msg.from!,
      sdp: answer
    });

    this.callState.set('in-call');
  }

  private cleanup() {
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.close();

      this.peerConnection = undefined as any;
    }

    this.localStream()?.getTracks().forEach(track => track.stop());

    this.localStream.set(null);
    this.remoteStream.set(null);

    this.pendingIceCandidates = [];

    this.targetUser = '';
    this.callSender.set(null);

    this.callState.set('idle');
  }

  disconnect() {
    // If call is active, inform the other user
    if (this.callState() === 'in-call' && this.targetUser) {
      try {
        this.send({
          type: 'hangup_call',
          to: this.targetUser
        });
      } catch (e) {
        console.warn('Failed to send hangup before disconnect', e);
      }
    }

    // Cleanup WebRTC
    this.cleanup();

    // Close WebSocket safely
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN ||
          this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close();
        }
      } catch (e) {
        console.error('WebSocket close error:', e);
      }

      this.socket = null;
    }

    this.connectionStatus.set('Disconnected');
  }

  toggleCamera() {
    const stream = this.localStream();
    if (!stream || !this.targetUser) return;

    stream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;

      this.send({
        type: 'media_status',
        to: this.targetUser,
        videoMuted: !track.enabled
      });
    });

    console.log("camera toggled");
  }

  toggleAudio() {
    const stream = this.localStream();
    if (!stream || !this.targetUser) return;

    stream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;

      this.send({
        type: 'media_status',
        to: this.targetUser,
        audioMuted: !track.enabled
      });
    });

    console.log("audio toggled");
  }
}
