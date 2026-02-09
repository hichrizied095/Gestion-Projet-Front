import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Message {
  id?: number;
  senderId: number;
  receiverId: number;
  senderName?: string;
  content: string;
  sentAt?: string;
  isRead?: boolean; // ✅ NOUVEAU: Pour marquer les messages comme lus
}

export interface UserWithLastMessage {
  id: number;
  username: string;
  email?: string;
  profilePicture?: string;
  lastMessage?: string; // ✅ Dernier message de la conversation
  lastMessageTime?: string; // ✅ Heure du dernier message
  unreadCount: number; // ✅ Nombre de messages non lus
}


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection!: signalR.HubConnection;
  private apiUrl = 'http://localhost:5279/api/Chat';
  
  // ✅ NOUVEAU: Stockage local des messages pour gérer isRead
  private messagesCache: Map<string, Message[]> = new Map();
  
  // ✅ NOUVEAU: Observable pour le nombre total de messages non lus
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

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
        
        // ✅ Marquer comme non lu par défaut
        msg.isRead = false;
        
        // ✅ Mettre à jour le cache
        this.updateCache(msg);
        
        // ✅ Mettre à jour le compteur de messages non lus
        this.updateUnreadCount();
        
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

  // ✅ NOUVEAU: Marquer les messages comme lus
  markAsRead(userId: number, otherUserId: number): void {
    const key = this.getCacheKey(userId, otherUserId);
    const messages = this.messagesCache.get(key);
    
    if (messages) {
      messages.forEach(msg => {
        if (msg.senderId === otherUserId && !msg.isRead) {
          msg.isRead = true;
        }
      });
      this.messagesCache.set(key, messages);
      this.updateUnreadCount();
    }
  }

  // ✅ NOUVEAU: Obtenir le nombre de messages non lus
  getUnreadCount(): number {
    let count = 0;
    this.messagesCache.forEach(messages => {
      count += messages.filter(msg => !msg.isRead).length;
    });
    return count;
  }

  // ✅ NOUVEAU: Mettre à jour le cache de messages
  private updateCache(msg: Message): void {
    const key = this.getCacheKey(msg.receiverId, msg.senderId);
    const messages = this.messagesCache.get(key) || [];
    messages.push(msg);
    this.messagesCache.set(key, messages);
  }

  // ✅ NOUVEAU: Mettre à jour le compteur de messages non lus
  private updateUnreadCount(): void {
    const count = this.getUnreadCount();
    this.unreadCountSubject.next(count);
  }

  // ✅ NOUVEAU: Générer une clé de cache pour une conversation
  private getCacheKey(userId1: number, userId2: number): string {
    const [id1, id2] = [userId1, userId2].sort();
    return `${id1}_${id2}`;
  }

  // ✅ NOUVEAU: Obtenir le dernier message d'une conversation
  getLastMessage(userId: number, otherUserId: number): Message | null {
    const key = this.getCacheKey(userId, otherUserId);
    const messages = this.messagesCache.get(key);
    return messages && messages.length > 0 ? messages[messages.length - 1] : null;
  }

  // ✅ NOUVEAU: Obtenir le nombre de messages non lus pour un utilisateur spécifique
  getUnreadCountForUser(userId: number, otherUserId: number): number {
    const key = this.getCacheKey(userId, otherUserId);
    const messages = this.messagesCache.get(key) || [];
    return messages.filter(msg => msg.senderId === otherUserId && !msg.isRead).length;
  }

  // ✅ NOUVEAU: Initialiser le cache avec l'historique
  initializeCache(userId: number, otherUserId: number, messages: Message[]): void {
    const key = this.getCacheKey(userId, otherUserId);
    this.messagesCache.set(key, messages);
    this.updateUnreadCount();
  }

  // ✅ NOUVEAU: Notifier que les messages ont été lus (simulation frontend)
  notifyMessagesRead(userId: number, otherUserId: number): void {
    // Envoyer une notification via SignalR pour simuler la lecture
    if (this.hubConnection) {
      this.hubConnection.invoke("NotifyMessagesRead", userId, otherUserId)
        .catch(err => console.error("❌ Erreur notification lecture:", err));
    }
  }

  // ✅ NOUVEAU: Écouter les notifications de lecture
  onMessagesRead(callback: (senderId: number, receiverId: number) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on("MessagesRead", (senderId: number, receiverId: number) => {
        console.log("📖 Messages lus:", { senderId, receiverId });
        callback(senderId, receiverId);
      });
    }
  }
}
