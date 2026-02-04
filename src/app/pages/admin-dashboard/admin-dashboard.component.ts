import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, DashboardStats, RecentActivity } from '../../services/admin.service';
import { UserService } from '../../services/user.service';
import { TaskItemDto } from '../../Models';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  count?: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  // ==========================================
  // PROPRIÉTÉS
  // ==========================================

  // Statistiques principales
  stats: DashboardStats = {
    totalUsers: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    roleStats: {},
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0,
    todayTasks: 0,
    upcomingMeetings: 0,
    todayMeetings: 0,
    overallProgress: 0,
    completionRate: 0
  };

  // Données
  recentActivities: RecentActivity[] = [];
  recentTasks: TaskItemDto[] = [];
  pendingUsers: any[] = [];  // ✅ Type any pour éviter les conflits

  // Actions rapides
  quickActions: QuickAction[] = [
    {
      title: 'Gérer les utilisateurs',
      description: 'Approuver ou rejeter les demandes',
      icon: 'bi-people',
      route: '/admin/users',
      color: '#3B82F6'
    },
    {
      title: 'Voir les statistiques',
      description: 'Graphiques et analyses détaillées',
      icon: 'bi-graph-up',
      route: '/statistics',
      color: '#8B5CF6'
    },
    {
      title: 'Tous les projets',
      description: 'Consulter l\'état de tous les projets',
      icon: 'bi-kanban',
      route: '/projects',
      color: '#10B981'
    },
    {
      title: 'Tâches en retard',
      description: 'Suivre les tâches avec retard',
      icon: 'bi-exclamation-triangle',
      route: '/mes-taches',
      color: '#EF4444',
      count: 0
    },
    {
      title: 'Réunions à venir',
      description: 'Calendrier des réunions',
      icon: 'bi-calendar-event',
      route: '/meetings',
      color: '#F59E0B',
      count: 0
    },
    {
      title: 'Messages',
      description: 'Consulter les conversations',
      icon: 'bi-chat-dots',
      route: '/chat',
      color: '#06B6D4'
    }
  ];

  // État
  isLoading = false;
  lastUpdated = new Date();

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadDashboardData(): void {
    this.isLoading = true;

    // Charger les statistiques
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        
        // Mettre à jour les compteurs des actions rapides
        const overdueAction = this.quickActions.find(a => a.route === '/mes-taches');
        if (overdueAction) {
          overdueAction.count = stats.overdueTasks;
        }
        
        const meetingsAction = this.quickActions.find(a => a.route === '/meetings');
        if (meetingsAction) {
          meetingsAction.count = stats.upcomingMeetings;
        }

        console.log('✅ Stats chargées:', stats);
      },
      error: (err: any) => console.error('❌ Erreur stats:', err)
    });

    // Charger les utilisateurs en attente
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.pendingUsers = users.filter(u => !u.isApproved);
        console.log('✅ Utilisateurs en attente:', this.pendingUsers.length);
      },
      error: (err: any) => console.error('❌ Erreur utilisateurs:', err)
    });

    // Charger les activités récentes
    this.adminService.getRecentActivities().subscribe({
      next: (activities) => {
        this.recentActivities = activities.slice(0, 10);
        console.log('✅ Activités chargées:', this.recentActivities.length);
      },
      error: (err: any) => console.error('❌ Erreur activités:', err)
    });

    // Charger les tâches récentes
    this.adminService.getRecentTasks().subscribe({
      next: (tasks) => {
        this.recentTasks = tasks.slice(0, 10);
        console.log('✅ Tâches chargées:', this.recentTasks.length);
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: (err: any) => {
        console.error('❌ Erreur tâches:', err);
        this.isLoading = false;
      }
    });
  }

  // ==========================================
  // ACTIONS UTILISATEUR
  // ==========================================

  approveUser(userId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir approuver cet utilisateur ?')) {
      return;
    }

    // ✅ Utiliser userService
    this.userService.approveUser(userId).subscribe({
      next: () => {
        console.log('✅ Utilisateur approuvé');
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        this.stats.pendingUsers--;
        this.stats.approvedUsers++;
      },
      error: (err: any) => {
        console.error('❌ Erreur approbation:', err);
        alert('Erreur lors de l\'approbation de l\'utilisateur');
      }
    });
  }

  rejectUser(userId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir rejeter cet utilisateur ?')) {
      return;
    }

    // ✅ Utiliser userService
    this.userService.rejectUser(userId).subscribe({
      next: () => {
        console.log('✅ Utilisateur rejeté');
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        this.stats.pendingUsers--;
      },
      error: (err: any) => {
        console.error('❌ Erreur rejet:', err);
        alert('Erreur lors du rejet de l\'utilisateur');
      }
    });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  getStatus(task: TaskItemDto): string {
    if (task.isCompleted) return 'Terminée';
    
    const now = new Date();
    const start = new Date(task.startDate);
    const due = new Date(task.dueDate);

    if (start > now) return 'Planifiée';
    if (due < now) return 'En retard';
    return 'En cours';
  }

  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'task_created': 'marker-blue',
      'task_completed': 'marker-green',
      'project_created': 'marker-purple',
      'user_joined': 'marker-cyan',
      'meeting_scheduled': 'marker-orange',
      'default': 'marker-gray'
    };
    return colors[type] || colors['default'];
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Terminée': 'green',
      'En cours': 'blue',
      'En retard': 'red',
      'Planifiée': 'purple'
    };
    return colors[status] || 'gray';
  }

  formatDate(date: any): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diffMs = now.getTime() - activityDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return activityDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short' 
    });
  }
}