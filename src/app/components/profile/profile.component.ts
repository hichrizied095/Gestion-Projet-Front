import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService, UpdateProfileDto, User } from '../../services/user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private apiUrl = 'http://localhost:5279/api';
  
  // ✅ CORRECTION: Utiliser User au lieu de UserProfile personnalisé
  userProfile: User | null = null;
  isEditingProfile = false;
  isChangingPassword = false;
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  profilePictureFile: File | null = null;
  profilePicturePreview: string | null = null;
  isUploadingImage = false;
  
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private http: HttpClient,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?\d{8,15}$/)]],
      department: [''],
      jobTitle: [''],
      bio: ['', [Validators.maxLength(500)]],
      preferredLanguage: ['fr', [Validators.required]],
      theme: ['light', [Validators.required]],
      emailNotifications: [true],
      pushNotifications: [true]
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
    this.userService.getUserById(userId).subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.profilePicturePreview = profile.profilePicture || null;
        
        this.profileForm.patchValue({
          username: profile.username,
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          department: profile.department || '',
          jobTitle: profile.jobTitle || '',
          bio: profile.bio || '',
          preferredLanguage: profile.preferredLanguage || 'fr',
          theme: profile.theme || 'light',
          emailNotifications: profile.emailNotifications ?? true,
          pushNotifications: profile.pushNotifications ?? true
        });
        
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Erreur chargement profil:', err);
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.loading = false;
      }
    });
  }

  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Format d\'image non supporté.';
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.errorMessage = 'Image trop volumineuse (max 5 MB).';
      return;
    }

    this.profilePictureFile = file;
    this.errorMessage = '';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicturePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfilePicture(): void {
    this.profilePictureFile = null;
    this.profilePicturePreview = this.userProfile?.profilePicture || null;
    
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Erreur de lecture'));
      reader.readAsDataURL(file);
    });
  }

  toggleEditProfile(): void {
    this.isEditingProfile = !this.isEditingProfile;
    this.clearMessages();
    
    if (!this.isEditingProfile && this.userProfile) {
      this.profileForm.patchValue({
        username: this.userProfile.username,
        email: this.userProfile.email || '',
        phoneNumber: this.userProfile.phoneNumber || '',
        department: this.userProfile.department || '',
        jobTitle: this.userProfile.jobTitle || '',
        bio: this.userProfile.bio || '',
        preferredLanguage: this.userProfile.preferredLanguage || 'fr',
        theme: this.userProfile.theme || 'light',
        emailNotifications: this.userProfile.emailNotifications ?? true,
        pushNotifications: this.userProfile.pushNotifications ?? true
      });
      
      this.profilePictureFile = null;
      this.profilePicturePreview = this.userProfile.profilePicture || null;
    }
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.invalid || !this.userProfile || !this.userProfile.id) return;

    this.loading = true;
    this.clearMessages();

    try {
      let profilePictureBase64 = undefined;
      
      if (this.profilePictureFile) {
        this.isUploadingImage = true;
        profilePictureBase64 = await this.convertFileToBase64(this.profilePictureFile);
      }

      const profileData: UpdateProfileDto = {
        email: this.profileForm.value.email || undefined,
        phoneNumber: this.profileForm.value.phoneNumber || undefined,
        department: this.profileForm.value.department || undefined,
        jobTitle: this.profileForm.value.jobTitle || undefined,
        bio: this.profileForm.value.bio || undefined,
        preferredLanguage: this.profileForm.value.preferredLanguage,
        theme: this.profileForm.value.theme,
        emailNotifications: this.profileForm.value.emailNotifications,
        pushNotifications: this.profileForm.value.pushNotifications,
        profilePicture: profilePictureBase64
      };

      this.userService.updateProfile(this.userProfile.id, profileData).subscribe({
        next: () => {
          this.successMessage = 'Profil mis à jour avec succès';
          this.isEditingProfile = false;
          this.isUploadingImage = false;
          this.loading = false;
          this.loadUserProfile();
        },
        error: (err) => {
          console.error('❌ Erreur:', err);
          this.errorMessage = err.error?.error || 'Erreur lors de la mise à jour';
          this.isUploadingImage = false;
          this.loading = false;
        }
      });
    } catch (error) {
      this.errorMessage = 'Erreur lors du traitement de l\'image';
      this.isUploadingImage = false;
      this.loading = false;
    }
  }

  toggleChangePassword(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.clearMessages();
    if (!this.isChangingPassword) {
      this.passwordForm.reset();
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid || !this.userProfile || !this.userProfile.id) return;

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
    const names = this.userProfile.username.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return this.userProfile.username.substring(0, 2).toUpperCase();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}