import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../Models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  username: string | null = null;
  role: string | null = null;
    profilePicture: string | null = null;
      userInitials: string = '?';



  notifications: any[] = [];
  chatNotifications: any[] = [];

  isNotifOpen = false;
  isChatNotifOpen = false;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
        private userService: UserService, // ✅ NOUVEAU

    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getCurrentUsername();
    this.role = this.authService.getRole();
    this.loadUserProfile();

    this.loadNotifications();
    this.startSignalRConnections();
  }
 loadUserProfile(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user) => {
          // Récupérer la photo de profil
          this.profilePicture = user.profilePicture || null;
          
          // Calculer les initiales
          if (user.username) {
            const names = user.username.split(' ');
            if (names.length >= 2) {
              this.userInitials = names[0][0].toUpperCase() + names[1][0].toUpperCase();
            } else {
              this.userInitials = user.username.substring(0, 2).toUpperCase();
            }
          }
        },
        error: (err) => {
          console.error('❌ Erreur chargement profil:', err);
          // Utiliser les initiales du username
          if (this.username) {
            this.userInitials = this.username.substring(0, 2).toUpperCase();
          }
        }
      });
    } else {
      // Fallback si pas d'userId
      if (this.username) {
        this.userInitials = this.username.substring(0, 2).toUpperCase();
      }
    }
  }
  loadNotifications(): void {
    this.notificationService.loadSavedNotifications();

    // S'abonner aux notifications
    this.notificationService.notifications$.subscribe(notifs => {
      // Filtrer et trier les notifications
      this.notifications = notifs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20); // Limiter à 20 notifications
    });

    // S'abonner aux notifications de chat
    this.notificationService.chatNotifications$.subscribe(chatNotifs => {
      this.chatNotifications = chatNotifs
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10); // Limiter à 10 messages
    });
  }

  startSignalRConnections(): void {
    this.notificationService.startConnection();
    this.notificationService.startChatConnection();
  }

  // 🔔 NOTIFICATIONS
  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // ✅ AJOUT: Getter pour le compteur de chat
  get unreadChatCount(): number {
    return this.chatNotifications.filter(n => !n.isRead).length;
  }

  toggleNotif(): void {
    this.isNotifOpen = !this.isNotifOpen;
    if (this.isNotifOpen) {
      this.isChatNotifOpen = false;
    }
  }

  clearNotifications(): void {
    if (confirm('Voulez-vous vraiment effacer toutes les notifications ?')) {
      this.notificationService.clearNotifications();
    }
  }

  markNotificationAsRead(notif: any): void {
    // Marquer comme lue
    this.notificationService.markNotificationAsRead(notif.id);
    
    // Naviguer vers le lien approprié
    if (notif.link) {
      this.router.navigate([notif.link]);
    }
    
    // Fermer le dropdown
    this.isNotifOpen = false;
  }

  toggleChatNotif(): void {
    this.isChatNotifOpen = !this.isChatNotifOpen;
    if (this.isChatNotifOpen) {
      this.isNotifOpen = false;
    }
  }

  clearChatNotifications(): void {
    if (confirm('Voulez-vous vraiment effacer toutes les notifications de messages ?')) {
      this.notificationService.clearChatNotifications();
    }
  }

  markChatAsRead(msg: any): void {
    // Marquer comme lu
    this.notificationService.markChatNotificationAsRead(msg.id);
    
    // Naviguer vers la page de chat
    this.router.navigate(['/chat']);
    
    // Fermer le dropdown
    this.isChatNotifOpen = false;
  }

  logout(): void {
    this.notificationService.disconnectAll();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // 📅 FORMATAGE DES DATES
  formatNotificationDate(dateString: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined
    });
  }

  // 🎯 CLIC EXTÉRIEUR
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const isNotificationArea = target.closest('.notif-area');
    const isDropdown = target.closest('.notif-dropdown');

    if (!isNotificationArea && !isDropdown) {
      this.isNotifOpen = false;
      this.isChatNotifOpen = false;
    }
  }

  ngOnDestroy(): void {
    this.notificationService.disconnectAll();
  }
}