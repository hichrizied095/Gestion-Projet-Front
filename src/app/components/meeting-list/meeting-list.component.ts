import { Component, OnInit } from '@angular/core';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service'; // ← Importez NotificationService

@Component({
  selector: 'app-meeting-list',
  templateUrl: './meeting-list.component.html',
  styleUrls: ['./meeting-list.component.css'],
  standalone: false
})
export class MeetingListComponent implements OnInit {

  meetings: any[] = [];
  notifications: any[] = [];
  chatNotifications: any[] = [];
  isLoading = true;
  error = '';
  notificationCount = 0;

  constructor(
    private meetingService: MeetingService,
    public auth: AuthService,
    private notificationService: NotificationService // ← Injectez NotificationService
  ) {}

  ngOnInit(): void {
    this.loadMeetings();
    this.loadNotifications();
    this.startNotificationConnection();
  }

  loadMeetings(): void {
    this.isLoading = true;
    this.error = '';

    this.meetingService.getAll().subscribe({
      next: (data: any[]) => {
        const userId = this.auth.getCurrentUserId();

        // Filtrer les réunions selon les permissions
        this.meetings = (data || []).filter(m => {
          return this.canViewMeeting(m, userId);
        });

        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur chargement réunions', err);
        this.error = 'Erreur lors du chargement des réunions.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les notifications depuis le service
   */
  loadNotifications(): void {
    this.notificationService.loadSavedNotifications();

    this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
      this.updateNotificationCount();
    });

    this.notificationService.chatNotifications$.subscribe(chatNotifs => {
      this.chatNotifications = chatNotifs;
      this.updateNotificationCount();
    });
  }

  /**
   * Démarrer la connexion SignalR pour les notifications
   */
  startNotificationConnection(): void {
    this.notificationService.startConnection();
    this.notificationService.startChatConnection();
  }

  /**
   * Mettre à jour le compteur de notifications
   */
  updateNotificationCount(): void {
    const unreadNotifications = this.notifications.filter(n => !n.isRead).length;
    const unreadChatNotifications = this.chatNotifications.filter(n => !n.isRead).length;
    this.notificationCount = unreadNotifications + unreadChatNotifications;
  }

  /**
   * Marquer une notification comme lue
   */
  markNotificationAsRead(notificationId: number): void {
    const updatedNotifications = this.notifications.map(notif => {
      if (notif.id === notificationId) {
        return { ...notif, isRead: true };
      }
      return notif;
    });

    this.notificationService.updateNotifications(updatedNotifications);
    this.updateNotificationCount();
  }

  /**
   * Vérifie si l'utilisateur peut voir cette réunion
   */
  private canViewMeeting(meeting: any, userId: number | null): boolean {
    if (!userId) return false;

    const role = this.auth.getCurrentUserRole();

    // Admin voit toutes les réunions
    if (role === 'Admin') {
      return true;
    }

    // Chef de projet voit ses propres réunions
    if (role === 'Manager' && meeting.projectOwnerId === userId) {
      return true;
    }

    // Utilisateur est participant
    if (meeting.attendeesIds && meeting.attendeesIds.includes(userId)) {
      return true;
    }

    // Utilisateur est assigné à une tâche dans la réunion
    if (meeting.taskAssignedUserIds && meeting.taskAssignedUserIds.includes(userId)) {
      return true;
    }

    return false;
  }

  deleteMeeting(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette réunion ?')) return;

    this.meetingService.delete(id).subscribe({
      next: () => {
        this.meetings = this.meetings.filter(m => m.id !== id);
      },
      error: err => {
        console.error('Erreur suppression réunion', err);
        alert('Erreur lors de la suppression.');
      }
    });
  }

  canCreate(): boolean {
    const role = this.auth.getCurrentUserRole();
    return role === 'Admin' || role === 'Manager';
  }

  /**
   * Nettoyer les notifications (optionnel)
   */
  clearAllNotifications(): void {
    this.notificationService.clearNotifications();
    this.notificationService.clearChatNotifications();
    this.notificationCount = 0;
  }
}
