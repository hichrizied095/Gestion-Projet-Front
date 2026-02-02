import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AdminService, DashboardStats, ProjectStats, RecentActivity } from '../../services/admin.service';
import { UserService } from '../../services/user.service';
import { TaskItemDto, UserDto } from '../../Models';

// Enregistrer tous les composants Chart.js
Chart.register(...registerables);

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
  standalone:false,
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

  // Statistiques par rôle (compatibilité avec le template)
  roleStats = {
    Admin: 0,
    Manager: 0,
    Member: 0
  };

  // Données pour les graphiques
  projectStats: ProjectStats[] = [];
  recentActivities: RecentActivity[] = [];
  recentTasks: TaskItemDto[] = [];
  pendingUsers: UserDto[] = [];

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
      title: 'Voir tous les projets',
      description: 'Consulter l\'état de tous les projets',
      icon: 'bi-kanban',
      route: '/projets',
      color: '#8B5CF6'
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
      route: '/mes-reunions',
      color: '#F59E0B',
      count: 0
    }
  ];

  // Charts references
  @ViewChild('roleChartCanvas') roleChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taskStatusChartCanvas') taskStatusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectProgressChartCanvas') projectProgressChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyTasksChartCanvas') monthlyTasksChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  roleChart?: Chart;
  taskStatusChart?: Chart;
  projectProgressChart?: Chart;
  monthlyTasksChart?: Chart;

  // Chart data & options
  roleChartData: any;
  roleChartOptions: any;
  taskStatusChartData: any;
  taskStatusChartOptions: any;
  projectProgressChartData: any;
  projectProgressChartOptions: any;
  monthlyTasksChartData: any;
  monthlyTasksChartOptions: any;

  // UI States
  isLoading = true;
  lastUpdated = new Date();

  // ==========================================
  // CONSTRUCTOR & LIFECYCLE
  // ==========================================

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  async loadDashboardData(): Promise<void> {
    this.isLoading = true;

    try {
      // Charger toutes les données en parallèle
      await Promise.all([
        this.loadStats(),
        this.loadProjectStats(),
        this.loadRecentActivities(),
        this.loadRecentTasks(),
        this.loadPendingUsers()
      ]);

      // Créer les graphiques après le chargement des données
      setTimeout(() => {
        this.createCharts();
      }, 100);

      this.lastUpdated = new Date();
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Charge les statistiques globales
   */
  private async loadStats(): Promise<void> {
    try {
      const stats = await this.adminService.getDashboardStats().toPromise();
      if (stats) {
        this.stats = stats;

        // Compatibilité avec le template existant
        this.roleStats = {
          Admin: stats.roleStats['Admin'] || 0,
          Manager: stats.roleStats['Manager'] || 0,
          Member: stats.roleStats['Member'] || 0
        };

        // Mettre à jour les compteurs des actions rapides
        this.quickActions[2].count = stats.overdueTasks;
        this.quickActions[3].count = stats.upcomingMeetings;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  /**
   * Charge les statistiques des projets
   */
  private async loadProjectStats(): Promise<void> {
    try {
      const projects = await this.adminService.getProjectStats(5).toPromise();
      if (projects) {
        // Ajouter les alias pour compatibilité avec le template
        this.projectStats = projects.map(p => ({
          ...p,
          name: p.projectName,
          tasks: p.totalTasks,
          completed: p.completedTasks
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats projets:', error);
    }
  }

  /**
   * Charge les activités récentes
   */
  private async loadRecentActivities(): Promise<void> {
    try {
      const activities = await this.adminService.getRecentActivities(10).toPromise();
      if (activities) {
        this.recentActivities = activities;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
    }
  }

  /**
   * Charge les tâches récentes
   */
  private async loadRecentTasks(): Promise<void> {
    try {
      const tasks = await this.adminService.getRecentTasks(10).toPromise();
      if (tasks) {
        this.recentTasks = tasks;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tâches récentes:', error);
    }
  }

  /**
   * Charge les utilisateurs en attente
   */
  private async loadPendingUsers(): Promise<void> {
    try {
      const users = await this.adminService.getPendingUsers().toPromise();
      if (users) {
        this.pendingUsers = users;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs en attente:', error);
    }
  }

  // ==========================================
  // CRÉATION DES GRAPHIQUES
  // ==========================================

  private createCharts(): void {
    this.createRoleChart();
    this.createTaskStatusChart();
    this.createProjectProgressChart();
    this.createMonthlyTasksChart();
  }

  /**
   * Graphique de répartition des rôles (Doughnut)
   */
  private createRoleChart(): void {
    if (!this.roleChartCanvas) return;

    this.roleChartData = {
      labels: ['Admin', 'Manager', 'Membre'],
      datasets: [{
        data: [
          this.roleStats.Admin,
          this.roleStats.Manager,
          this.roleStats.Member
        ],
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
        borderWidth: 0
      }]
    };

    this.roleChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const total = this.stats.totalUsers;
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };
  }

  /**
   * Graphique de statut des tâches (Bar)
   */
  private createTaskStatusChart(): void {
    if (!this.taskStatusChartCanvas) return;

    this.taskStatusChartData = {
      labels: ['Terminées', 'En cours', 'En retard'],
      datasets: [{
        label: 'Tâches',
        data: [
          this.stats.completedTasks,
          this.stats.inProgressTasks,
          this.stats.overdueTasks
        ],
        backgroundColor: ['#10B981', '#3B82F6', '#EF4444'],
        borderRadius: 6
      }]
    };

    this.taskStatusChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
  }

  /**
   * Graphique de progression des projets (Line)
   */
  private createProjectProgressChart(): void {
    if (!this.projectProgressChartCanvas) return;

    this.projectProgressChartData = {
      labels: this.projectStats.map(p => p.name || p.projectName),
      datasets: [{
        label: 'Progression (%)',
        data: this.projectStats.map(p => p.progress),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    this.projectProgressChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    };
  }

  /**
   * Graphique des tâches mensuelles (Line)
   */
  private createMonthlyTasksChart(): void {
    if (!this.monthlyTasksChartCanvas) return;

    // Pour l'instant, données fictives
    this.monthlyTasksChartData = {
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui'],
      datasets: [
        {
          label: 'Créées',
          data: [12, 19, 15, 25, 22, 30],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Terminées',
          data: [8, 15, 12, 20, 18, 25],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    };

    this.monthlyTasksChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    };
  }

  // ==========================================
  // MÉTHODES HELPER POUR LE TEMPLATE
  // ==========================================

  /**
   * Retourne le statut d'une tâche
   */
  getStatus(task: TaskItemDto): string {
    if (task.isCompleted) return 'Terminée';
    if (new Date(task.dueDate) < new Date()) return 'En retard';
    if (new Date(task.startDate) > new Date()) return 'Planifiée';
    return 'En cours';
  }

  /**
   * Retourne la couleur du badge de statut
   */
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Terminée': 'success',
      'En retard': 'danger',
      'En cours': 'primary',
      'Planifiée': 'secondary',
      'success': 'success',
      'completed': 'success',
      'pending': 'warning',
      'upcoming': 'primary',
      'info': 'info',
      'past': 'secondary'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Retourne l'icône d'une activité
   */
  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'project_created': 'bi-folder-plus',
      'task_created': 'bi-card-checklist',
      'meeting_scheduled': 'bi-calendar-event',
      'comment_added': 'bi-chat-left-text'
    };
    return icons[type] || 'bi-info-circle';
  }

  /**
   * Retourne la couleur d'une activité
   */
  getActivityColor(type: string): string {
    const colors: { [key: string]: string } = {
      'project_created': 'activity-success',
      'task_created': 'activity-primary',
      'meeting_scheduled': 'activity-warning',
      'comment_added': 'activity-info'
    };
    return colors[type] || 'activity-secondary';
  }

  /**
   * Formate une date de manière relative
   */
  formatDate(date: Date): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diff = now.getTime() - activityDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }

  /**
   * Navigation vers une route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  // ==========================================
  // ACTIONS UTILISATEUR
  // ==========================================

  /**
   * Actualise le dashboard
   */
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  /**
   * Exporte les données du dashboard
   */
  exportReport(): void {
    this.adminService.exportDashboardData('json').subscribe(
      (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard_${new Date().toISOString()}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      (error) => console.error('Erreur lors de l\'export:', error)
    );
  }

  /**
   * Approuve un utilisateur
   */
  async approveUser(userId: number): Promise<void> {
  try {
    console.log('Approuver utilisateur:', userId);
    
    // ✅ CORRECTION: Appeler l'API d'approbation
    await this.userService.approveUser(userId).toPromise();
    
    console.log('✅ Utilisateur approuvé avec succès');
    
    // Recharger les données
    await this.loadPendingUsers();
    await this.loadStats();
  } catch (error) {
    console.error('❌ Erreur lors de l\'approbation:', error);
    alert('Erreur lors de l\'approbation de l\'utilisateur');
  }
}

  /**
   * Rejette un utilisateur
   */
  async rejectUser(userId: number): Promise<void> {
  try {
    console.log('Rejeter utilisateur:', userId);
    
    // ✅ CORRECTION: Appeler l'API de rejet
    await this.userService.rejectUser(userId).toPromise();
    
    console.log('✅ Utilisateur rejeté avec succès');
    
    // Recharger les données
    await this.loadPendingUsers();
    await this.loadStats();
  } catch (error) {
    console.error('❌ Erreur lors du rejet:', error);
    alert('Erreur lors du rejet de l\'utilisateur');
  }
}

  /**
   * Rafraîchit les données
   */
  refresh(): void {
    this.loadDashboardData();
  }
}
