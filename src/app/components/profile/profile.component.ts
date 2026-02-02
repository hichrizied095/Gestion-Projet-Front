import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

interface UserProfile {
  id: number;
  username: string;
  role: string;
  isApproved: boolean;
}

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private apiUrl = 'http://localhost:5279/api';
  
  userProfile: UserProfile | null = null;
  isEditingProfile = false;
  isChangingPassword = false;
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(group: FormGroup): any {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  loadUserProfile(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.errorMessage = 'Utilisateur non connecté';
      return;
    }

    this.loading = true;
    this.http.get<UserProfile>(`${this.apiUrl}/Users/${userId}`).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profileForm.patchValue({
          username: profile.username
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement profil:', err);
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    this.clearMessages();
    
    if (!this.isEditingProfile && this.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid || !this.userProfile) return;

    this.loading = true;
    this.clearMessages();

    // ✅ CORRECTION: Ne pas envoyer passwordHash et passwordSalt
    const updatedData = {
      id: this.userProfile.id,
      username: this.profileForm.value.username,
      role: this.userProfile.role,
      isApproved: this.userProfile.isApproved
      // ✅ Enlever passwordHash et passwordSalt vides
    };

    console.log('📤 Données envoyées:', updatedData);

    this.http.put(`${this.apiUrl}/Users/${this.userProfile.id}`, updatedData).subscribe({
      next: (response) => {
        console.log('✅ Mise à jour réussie:', response);
        this.successMessage = 'Profil mis à jour avec succès';
        this.userProfile!.username = updatedData.username;
        this.isEditingProfile = false;
        this.loading = false;
        
        // Mettre à jour le localStorage
        localStorage.setItem('username', updatedData.username);
      },
      error: (err) => {
        console.error('❌ Erreur mise à jour profil:', err);
        console.error('❌ Status:', err.status);
        console.error('❌ Error body:', err.error);
        this.errorMessage = err.error?.message || 'Erreur lors de la mise à jour du profil';
        this.loading = false;
      }
    });
  }

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.clearMessages();
    
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid || !this.userProfile) return;

    this.loading = true;
    this.clearMessages();

    const passwordData = {
      userId: this.userProfile.id,
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.http.post(`${this.apiUrl}/Auth/change-password`, passwordData).subscribe({
      next: () => {
        this.successMessage = 'Mot de passe changé avec succès';
        this.passwordForm.reset();
        this.isChangingPassword = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur changement mot de passe:', err);
        this.errorMessage = err.error?.error || 'Erreur lors du changement de mot de passe';
        this.loading = false;
      }
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  getRoleBadgeClass(): string {
    if (!this.userProfile) return 'bg-secondary';
    
    switch (this.userProfile.role) {
      case 'Admin': return 'bg-danger';
      case 'Manager': return 'bg-primary';
      case 'Member': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getRoleIcon(): string {
    if (!this.userProfile) return 'fa-user';
    
    switch (this.userProfile.role) {
      case 'Admin': return 'fa-user-shield';
      case 'Manager': return 'fa-user-tie';
      case 'Member': return 'fa-user';
      default: return 'fa-user';
    }
  }

  getInitials(): string {
    if (!this.userProfile?.username) return '?';
    return this.userProfile.username.substring(0, 2).toUpperCase();
  }
}