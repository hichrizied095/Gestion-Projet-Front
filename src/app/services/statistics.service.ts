import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ==========================================
// INTERFACES CORRIGÉES
// ==========================================

export interface StatisticsOverview {
  totalProjects: number;
  totalTasks: number;
  totalUsers: number;
  totalMeetings: number;
  completedTasks: number;
  ongoingTasks: number;
  delayedTasks: number;
  plannedTasks: number;
  completionRate: number;
  pendingUsers: number;
  tasksWithDelayReason: number;
}

export interface ProjectStats {
  projectId: number;
  projectTitle: string;
  ownerName: string;
  taskCount: number;
  completedTasks: number;
  delayedTasks: number;
  completionRate: number;
  averageWeight: number;
  createdAt: string;
}

export interface UserStats {
  userId: number;
  username: string;
  role: string;
  assignedTasks: number;
  completedTasks: number;
  delayedTasks: number;
  completionRate: number;
  projectsOwned: number;
}

export interface TasksByStatus {
  status: string;
  count: number;
  color: string;
}

export interface MonthlyStats {
  year: number;
  month: number;
  monthLabel: string;
  created: number;
  completed: number;
}

export interface ColumnStats {
  columnId: number;
  columnName: string;
  projectTitle: string;
  taskCount: number;
  completedTasks: number;
  totalWeight: number;
}

// ✅ INTERFACE CORRIGÉE (remplacé longestProjects par topProjects)
export interface AdvancedStats {
  onTimeRate: number;
  descriptionRate: number;
  averageWeight: number;
  topProjects: Array<{  // ✅ Changé de longestProjects à topProjects
    title: string;
    taskCount: number;  // ✅ Changé de duration à taskCount
    completionRate: number;  // ✅ Ajouté completionRate
  }>;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = 'http://localhost:5279/api/Statistics';

  constructor(private http: HttpClient) {}

  getOverview(): Observable<StatisticsOverview> {
    return this.http.get<StatisticsOverview>(`${this.apiUrl}/overview`);
  }

  getProjectStats(): Observable<ProjectStats[]> {
    return this.http.get<ProjectStats[]>(`${this.apiUrl}/projects`);
  }

  getUserStats(): Observable<UserStats[]> {
    return this.http.get<UserStats[]>(`${this.apiUrl}/users`);
  }

  getTasksByStatus(): Observable<TasksByStatus[]> {
    return this.http.get<TasksByStatus[]>(`${this.apiUrl}/tasks-by-status`);
  }

  getMonthlyStats(): Observable<MonthlyStats[]> {
    return this.http.get<MonthlyStats[]>(`${this.apiUrl}/monthly`);
  }

  getColumnStats(): Observable<ColumnStats[]> {
    return this.http.get<ColumnStats[]>(`${this.apiUrl}/columns`);
  }

  getAdvancedStats(): Observable<AdvancedStats> {
    return this.http.get<AdvancedStats>(`${this.apiUrl}/advanced`);
  }
}