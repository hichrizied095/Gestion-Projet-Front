import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// ✅ Interface User complète avec TOUS les nouveaux champs
export interface User {
  id?: number;
  username: string;
  passwordHash?: string;
  password?: string;
  role?: string;
  isApproved?: boolean;
  
  // ✅ NOUVEAUX CHAMPS - Profil
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  
  // ✅ NOUVEAUX CHAMPS - Activité
  createdAt?: Date;
  lastLoginDate?: Date;
  totalTasksCompleted?: number;
  totalProjectsCreated?: number;
  
  // ✅ NOUVEAUX CHAMPS - Préférences
  preferredLanguage?: string;
  theme?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  
  // ✅ NOUVEAUX CHAMPS - Gestion
  isActive?: boolean;
  updatedAt?: Date;
}

// ✅ NOUVEAU: Interface pour la mise à jour du profil
export interface UpdateProfileDto {
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  preferredLanguage?: string;
  theme?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}

// ✅ NOUVEAU: Interface pour les statistiques utilisateur
export interface UserStats {
  userId: number;
  username: string;
  totalTasksCompleted: number;
  totalProjectsCreated: number;
  lastLoginDate?: Date;
  createdAt: Date;
  daysSinceCreation: number;
  tasksPerDay: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5279/api/Users';

  constructor(private http: HttpClient) { }

  // ==========================================
  // ENDPOINTS EXISTANTS
  // ==========================================
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // ✅ MODIFIÉ: Récupérer un utilisateur par ID (avec tous les champs)
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // ✅ NOUVEAU: Récupérer un utilisateur par email
  getUserByEmail(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/email/${email}`);
  }

  updateUserRole(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPendingUsers(): Observable<User[]> {
    return this.http.get<User[]>('http://localhost:5279/api/Users/pending');
  }

  approveUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/approve/${userId}`, {});
  }

  rejectUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reject/${userId}`);
  }

  // ==========================================
  // ✅ NOUVEAUX ENDPOINTS
  // ==========================================

  // Mise à jour du profil utilisateur
  updateProfile(userId: number, profileData: UpdateProfileDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/profile`, profileData);
  }

  // Récupérer les statistiques d'un utilisateur
  getUserStats(userId: number): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/${userId}/stats`);
  }

  // Incrémenter le compteur de tâches complétées
  incrementTasksCompleted(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/increment-tasks`, {});
  }

  // Incrémenter le compteur de projets créés
  incrementProjectsCreated(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/increment-projects`, {});
  }

  // ✅ NOUVEAU: Activer un compte utilisateur
  activateUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/activate`, {});
  }

  // ✅ NOUVEAU: Désactiver un compte utilisateur
  deactivateUser(userId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/deactivate`, {});
  }
}