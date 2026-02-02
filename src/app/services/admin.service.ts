import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MeetingDto, TaskItemDto, UserDto } from '../Models';

// ==========================================
// INTERFACES POUR LES RÉPONSES
// ==========================================

export interface DashboardStats {
  // Utilisateurs
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  roleStats: { [role: string]: number };

  // Projets
  totalProjects: number;
  activeProjects: number;

  // Tâches
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  todayTasks: number;

  // Réunions
  upcomingMeetings: number;
  todayMeetings: number;

  // Progression
  overallProgress: number;
  completionRate: number;
}

export interface ProjectStats {
  projectId: number;
  projectName: string;
  ownerName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  progress: number;
  createdAt: Date;

  // Alias pour compatibilité avec le template
  name?: string;
  tasks?: number;
  completed?: number;
}

export interface ProjectWithStats {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
  ownerId: number;
  ownerName: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
}

export interface RecentActivity {
  type: string;
  title: string;
  description: string;
  date: Date;
  status: string;
  icon: string;
  userId?: number;
  userName: string;
}

export interface MonthlyTaskStats {
  month: string;
  created: number;
  completed: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:5279/api/Admin';

  constructor(private http: HttpClient) {}

  // ==========================================
  // STATISTIQUES GLOBALES
  // ==========================================

  /**
   * Récupère toutes les statistiques pour le dashboard admin
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/stats`);
  }

  // ==========================================
  // PROJETS
  // ==========================================

  /**
   * Récupère TOUS les projets (admin uniquement)
   */
  getAllProjects(): Observable<ProjectWithStats[]> {
    return this.http.get<ProjectWithStats[]>(`${this.apiUrl}/projects/all`);
  }

  /**
   * Récupère les statistiques détaillées par projet
   * @param limit - Nombre de projets à retourner (optionnel)
   */
  getProjectStats(limit?: number): Observable<ProjectStats[]> {
    let url = `${this.apiUrl}/projects/stats`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    return this.http.get<ProjectStats[]>(url);
  }

  // ==========================================
  // TÂCHES
  // ==========================================

  /**
   * Récupère TOUTES les tâches (admin uniquement)
   */
  getAllTasks(): Observable<TaskItemDto[]> {
    return this.http.get<TaskItemDto[]>(`${this.apiUrl}/tasks/all`);
  }

  /**
   * Récupère les tâches en retard (toutes)
   */
  getOverdueTasks(): Observable<TaskItemDto[]> {
    return this.http.get<TaskItemDto[]>(`${this.apiUrl}/tasks/overdue`);
  }

  /**
   * Récupère les dernières tâches créées
   * @param limit - Nombre de tâches à retourner
   */
  getRecentTasks(limit: number = 10): Observable<TaskItemDto[]> {
    return this.http.get<TaskItemDto[]>(`${this.apiUrl}/tasks/recent?limit=${limit}`);
  }

  /**
   * Récupère les statistiques mensuelles des tâches
   * @param months - Nombre de mois à analyser
   */
  getMonthlyTaskStats(months: number = 6): Observable<MonthlyTaskStats[]> {
    return this.http.get<MonthlyTaskStats[]>(`${this.apiUrl}/tasks/monthly-stats?months=${months}`);
  }

  // ==========================================
  // RÉUNIONS
  // ==========================================

  /**
   * Récupère TOUTES les réunions (admin uniquement)
   */
  getAllMeetings(): Observable<MeetingDto[]> {
    return this.http.get<MeetingDto[]>(`${this.apiUrl}/meetings/all`);
  }

  // ==========================================
  // ACTIVITÉS
  // ==========================================

  /**
   * Récupère les activités récentes de tous les utilisateurs
   * @param limit - Nombre d'activités à retourner
   */
  getRecentActivities(limit: number = 20): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/activities/recent?limit=${limit}`);
  }

  // ==========================================
  // UTILISATEURS
  // ==========================================

  /**
   * Récupère les utilisateurs en attente d'approbation
   */
  getPendingUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/pending`);
  }

  // ==========================================
  // ACTIONS RAPIDES
  // ==========================================

  /**
   * Exporte les données du dashboard en CSV ou JSON
   * @param format - Format d'export ('csv' ou 'json')
   */
  exportDashboardData(format: 'csv' | 'json' = 'json'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/dashboard/export?format=${format}`, {
      responseType: 'blob'
    });
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Calcule le taux de complétion d'un projet
   */
  calculateProjectCompletion(completedTasks: number, totalTasks: number): number {
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  /**
   * Détermine la couleur d'un statut de progression
   */
  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  }

  /**
   * Formate une date relative (il y a X jours/heures)
   */
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'À l\'instant';
  }
}
