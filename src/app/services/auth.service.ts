import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5279/api/Auth';
  private tokenKey = 'token';
  private usernameKey = 'username';
  
  // ✅ NOUVEAUX: Stockage des infos utilisateur
  private userIdKey = 'userId';
  private userRoleKey = 'userRole';
  private userEmailKey = 'userEmail';
  private userThemeKey = 'userTheme';
  private userLanguageKey = 'userLanguage';
  
  isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  // ==========================================
  // INSCRIPTION avec nouveaux champs
  // ==========================================
  register(userData: {
    username: string;
    password: string;
    role: string;
    email?: string;
    phoneNumber?: string;
    department?: string;
    jobTitle?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  // ==========================================
  // CONNEXION (accepte email OU username)
  // ==========================================
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Stocker le token
        localStorage.setItem(this.tokenKey, response.token);
        
        // ✅ NOUVEAU: Stocker toutes les infos utilisateur
        localStorage.setItem(this.usernameKey, response.username || credentials.username);
        localStorage.setItem(this.userIdKey, response.userId?.toString() || '');
        localStorage.setItem(this.userRoleKey, response.role || '');
        
        if (response.email) {
          localStorage.setItem(this.userEmailKey, response.email);
        }
        if (response.theme) {
          localStorage.setItem(this.userThemeKey, response.theme);
        }
        if (response.preferredLanguage) {
          localStorage.setItem(this.userLanguageKey, response.preferredLanguage);
        }
        
        this.isLoggedIn.next(true);
      })
    );
  }

  // ==========================================
  // CHANGEMENT DE MOT DE PASSE
  // ==========================================
  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      userId,
      currentPassword,
      newPassword
    });
  }

  // ==========================================
  // DÉCONNEXION
  // ==========================================
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.userRoleKey);
    localStorage.removeItem(this.userEmailKey);
    localStorage.removeItem(this.userThemeKey);
    localStorage.removeItem(this.userLanguageKey);
    this.isLoggedIn.next(false);
  }

  // ==========================================
  // GETTERS
  // ==========================================
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  // ✅ NOUVEAU: Récupérer l'email depuis localStorage
  getCurrentUserEmail(): string | null {
    return localStorage.getItem(this.userEmailKey);
  }

  // ✅ NOUVEAU: Récupérer le thème
  getCurrentUserTheme(): string {
    return localStorage.getItem(this.userThemeKey) || 'light';
  }

  // ✅ NOUVEAU: Récupérer la langue
  getCurrentUserLanguage(): string {
    return localStorage.getItem(this.userLanguageKey) || 'fr';
  }

  getCurrentUserId(): number | null {
    // Priorité au localStorage
    const storedId = localStorage.getItem(this.userIdKey);
    if (storedId) {
      return Number(storedId);
    }
    
    // Fallback: décoder le token
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
        ? Number(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"])
        : payload["sub"]
        ? Number(payload["sub"])
        : null;
    } catch (e) {
      console.error("❌ Erreur décodage JWT", e);
      return null;
    }
  }

  getRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload["role"] ||
             payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
             null;
    } catch (e) {
      console.error('❌ Erreur lors du décodage du token', e);
      return null;
    }
  }

  getCurrentUserRole(): string | null {
    // Priorité au localStorage
    const storedRole = localStorage.getItem(this.userRoleKey);
    if (storedRole) {
      return storedRole;
    }
    
    // Fallback: décoder le token
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        || payload["role"]
        || null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // VÉRIFICATIONS DE RÔLE
  // ==========================================
  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'Admin';
  }

  hasRole(role: string): boolean {
    return this.getCurrentUserRole() === role;
  }

  isProjectOwner(ownerId: number): boolean {
    return this.getCurrentUserId() === ownerId;
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }
}