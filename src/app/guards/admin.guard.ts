// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getCurrentUserRole(); // Méthode à ajouter dans auth.service.ts si pas encore
    if (role === 'Admin') {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
