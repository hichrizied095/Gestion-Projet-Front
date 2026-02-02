import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = 'http://localhost:5279/api/Auth';
  private tokenKey = 'token';   // 🔹 Harmonisation
  private usernameKey = 'username';
  isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  register(username: string, password: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { username, password, role });
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.usernameKey, credentials.username);
        this.isLoggedIn.next(true);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    this.isLoggedIn.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
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

  getCurrentUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  getCurrentUserId(): number | null {
  const token = this.getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    // Vérifie plusieurs clés possibles
    return payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
      ? Number(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"])
      : payload["sub"]   // parfois utilisé
      ? Number(payload["sub"])
      : null;
  } catch (e) {
    console.error("❌ Erreur décodage JWT", e);
    return null;
  }
}


 getCurrentUserRole(): string | null {
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
