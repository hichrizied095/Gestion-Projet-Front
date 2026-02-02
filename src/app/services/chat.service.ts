import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Message {
  senderId: number;
  receiverId: number;
  senderName?: string;
  content: string;
  sentAt?: string;
}


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private apiUrl = 'http://localhost:5279/api/Chat';

  constructor(private http: HttpClient, private auth: AuthService) {}
  startConnection(userId: number, onMessageReceived?: (msg: any) => void) {
  this.hubConnection = new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:5279/chatHub`, {
        accessTokenFactory: () => this.auth.getToken() || ''
    })
    .withAutomaticReconnect()
    .build();

  this.hubConnection
    .start()
    .then(() => console.log("✅ Connexion SignalR chat établie"))
    .catch((err: any) => console.error("❌ Erreur SignalR chat:", err));

  if (onMessageReceived) {
    this.hubConnection.on("ReceiveMessage", (msg: any) => {
      console.log("📩 Message reçu (chat):", msg);
      onMessageReceived(msg);
    });
  }
}

  sendMessage(senderId: number, receiverId: number, content: string) {
    console.log("📤 Envoi message:", { senderId, receiverId, content });
    return this.hubConnection.invoke("SendMessage", senderId, receiverId, content);
  }
  getHistory(userId: number, otherUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`http://localhost:5279/api/ChatMessages/history/${userId}/${otherUserId}`);
  }

}
