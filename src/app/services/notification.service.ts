import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection!: signalR.HubConnection;
  private chatConnection!: signalR.HubConnection;

  private notificationsSource = new BehaviorSubject<any[]>([]);
  notifications$ = this.notificationsSource.asObservable();

  private chatNotificationsSource = new BehaviorSubject<any[]>([]);
  chatNotifications$ = this.chatNotificationsSource.asObservable();

  constructor(private authService: AuthService, private http: HttpClient) {}

  // === 🔔 NOTIFICATIONS GÉNÉRALES ===
  startConnection(): void {
    const token = this.authService.getToken();
    if (!token) return;

    // Éviter les connexions multiples
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5279/notificationHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('✅ SignalR (notifications) connecté'))
      .catch(err => console.error('❌ Erreur SignalR :', err));

    // Réception des notifications normales
    this.hubConnection.on('ReceiveNotification', (notif: any) => {
      console.log('📢 Notification reçue via SignalR:', notif);

      let payload: any;

      if (typeof notif === 'string') {
        payload = {
          id: Date.now(),
          message: notif,
          link: '/mes-taches', // Lien par défaut pour les notifications textuelles
          isRead: false,
          createdAt: new Date().toISOString(),
          type: 'general'
        };
      } else {
        // ✅ Déterminer le lien selon le type de notification
        let link = notif.link || notif.Link;
        
        if (!link) {
          const type = notif.type || '';
          
          // Notifications de réunion
          if (type.includes('meeting') || notif.meetingId) {
            link = '/meetings';
          }
          // Notifications de tâche
          else if (type.includes('task') || notif.taskId || notif.taskItemId) {
            link = '/mes-taches';
          }
          // Notifications de projet
          else if (type.includes('project') || notif.projectId) {
            link = '/projects';
          }
          // Par défaut
          else {
            link = '/mes-taches';
          }
        }

        payload = {
          id: notif.id || Date.now(),
          message: notif.message || notif.Message || '',
          link: link,
          isRead: notif.isRead || notif.IsRead || false,
          createdAt: notif.createdAt || notif.CreatedAt || new Date().toISOString(),
          taskId: notif.taskItemId || notif.taskId,
          taskTitle: notif.taskTitle || notif.taskItemTitle || '',
          projectId: notif.projectId,
          projectTitle: notif.projectTitle || '',
          meetingId: notif.meetingId,
          meetingTitle: notif.meetingTitle || '',
          type: notif.type || 'general'
        };
      }

      // Vérifier si la notification existe déjà (éviter les doublons)
      const current = this.notificationsSource.value;
      const exists = current.some(n =>
        n.id === payload.id ||
        (n.message === payload.message && n.createdAt === payload.createdAt)
      );

      if (!exists) {
        const updated = [payload, ...current];
        this.notificationsSource.next(updated);
        localStorage.setItem('notifications', JSON.stringify(updated));
      }
    });
  }

  // === 💬 CONNEXION CHAT ===
  startChatConnection(): void {
    const token = this.authService.getToken();
    if (!token) return;

    // Éviter les connexions multiples
    if (this.chatConnection && this.chatConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.chatConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5279/chatHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.chatConnection.start()
      .then(() => console.log('✅ SignalR (chat) connecté'))
      .catch(err => console.error('❌ Erreur SignalR chat :', err));

    // Quand un message arrive
    this.chatConnection.on('ReceiveMessage', (msg: any) => {
      const currentUserId = this.authService.getCurrentUserId();

      // Si c'est moi qui ai envoyé le message, on ne crée PAS de notification
      if (msg.senderId === currentUserId) {
        return;
      }

      console.log('💬 Nouveau message reçu via SignalR:', msg);

      const payload = {
        id: msg.id || Date.now(),
        senderId: msg.senderId,
        senderName: msg.senderName || msg.sender?.username || `Utilisateur ${msg.senderId}`,
        message: msg.content || msg.message,
        isRead: false,
        createdAt: msg.sentAt || new Date().toISOString(),
        type: 'chat'
      };

      // Vérifier si le message existe déjà
      const current = this.chatNotificationsSource.value;
      const exists = current.some(m =>
        m.id === payload.id ||
        (m.senderId === payload.senderId && m.message === payload.message)
      );

      if (!exists) {
        const updated = [payload, ...current];
        this.chatNotificationsSource.next(updated);
        localStorage.setItem('chatNotifications', JSON.stringify(updated));
      }
    });
  }

  // === FONCTIONS UTILITAIRES ===
  loadSavedNotifications(): void {
    try {
      const saved = localStorage.getItem('notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrer les notifications trop anciennes (plus de 7 jours)
        const filtered = parsed.filter((n: any) => {
          const createdAt = new Date(n.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdAt > sevenDaysAgo;
        });
        this.notificationsSource.next(filtered);
        localStorage.setItem('notifications', JSON.stringify(filtered));
      }

      const chatSaved = localStorage.getItem('chatNotifications');
      if (chatSaved) {
        const parsed = JSON.parse(chatSaved);
        // Filtrer les messages trop anciens (plus de 7 jours)
        const filtered = parsed.filter((m: any) => {
          const createdAt = new Date(m.createdAt);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return createdAt > sevenDaysAgo;
        });
        this.chatNotificationsSource.next(filtered);
        localStorage.setItem('chatNotifications', JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      this.clearAllNotifications();
    }
  }

  updateNotifications(updatedList: any[]): void {
    this.notificationsSource.next(updatedList);
    localStorage.setItem('notifications', JSON.stringify(updatedList));
  }

  updateChatNotifications(updatedList: any[]): void {
    this.chatNotificationsSource.next(updatedList);
    localStorage.setItem('chatNotifications', JSON.stringify(updatedList));
  }

  clearNotifications(): void {
    this.notificationsSource.next([]);
    localStorage.removeItem('notifications');
  }

  clearChatNotifications(): void {
    this.chatNotificationsSource.next([]);
    localStorage.removeItem('chatNotifications');
  }

  clearAllNotifications(): void {
    this.clearNotifications();
    this.clearChatNotifications();
  }

  markNotificationAsRead(notificationId: number): void {
    const updated = this.notificationsSource.value.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.updateNotifications(updated);
  }

  markChatNotificationAsRead(notificationId: number): void {
    const updated = this.chatNotificationsSource.value.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    this.updateChatNotifications(updated);
  }

  getUnreadCount(): number {
    return this.notificationsSource.value.filter(n => !n.isRead).length;
  }

  getUnreadChatCount(): number {
    return this.chatNotificationsSource.value.filter(n => !n.isRead).length;
  }

  disconnectAll(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
    if (this.chatConnection) {
      this.chatConnection.stop();
    }
  }
}