// src/app/guards/manager.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagerGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const role = this.authService.getRole();
    
    // Autoriser Admin et Manager, bloquer Member
    if (role === 'Admin' || role === 'Manager') {
      return true;
    }

    // Rediriger vers la page d'accueil si Member ou rôle inconnu
    alert('Accès refusé. Cette page est réservée aux Managers et Administrateurs.');
    this.router.navigate(['/']);
    return false;
  }
}
