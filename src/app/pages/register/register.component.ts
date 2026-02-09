import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  
  // ✅ NOUVEAU: Gestion de la photo de profil
  profilePicturePreview: string | null = null;
  profilePictureFile: File | null = null;
  isUploadingImage: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['Member', Validators.required],
      
      // Champs optionnels
      email: ['', [Validators.email]],
      phoneNumber: ['', [Validators.pattern(/^\+?\d{8,15}$/)]],
      department: [''],
      jobTitle: ['']
    });
  }

  // ==========================================
  // ✅ GESTION DE LA PHOTO DE PROFIL
  // ==========================================
  
  onProfilePictureSelected(event: any): void {
    const file = event.target.files[0];
    
    if (!file) return;

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP.';
      return;
    }

    // Vérifier la taille (max 5 MB)
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      this.errorMessage = 'L\'image est trop volumineuse. Taille maximum : 5 MB.';
      return;
    }

    this.profilePictureFile = file;
    this.errorMessage = '';

    // Créer un aperçu de l'image
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profilePicturePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeProfilePicture(): void {
    this.profilePictureFile = null;
    this.profilePicturePreview = null;
    
    // Réinitialiser l'input file
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // ==========================================
  // SOUMISSION DU FORMULAIRE
  // ==========================================
  
  async onSubmit() {
    if (this.registerForm.valid) {
      const { username, password, confirmPassword, role, email, phoneNumber, department, jobTitle } = this.registerForm.value;

      // Vérifier que les mots de passe correspondent
      if (password !== confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas.';
        return;
      }

      // ✅ Convertir l'image en base64 si présente
      let profilePictureBase64 = undefined;
      if (this.profilePictureFile) {
        try {
          this.isUploadingImage = true;
          profilePictureBase64 = await this.convertFileToBase64(this.profilePictureFile);
        } catch (error) {
          this.errorMessage = 'Erreur lors du traitement de l\'image.';
          this.isUploadingImage = false;
          return;
        }
      }

      // ✅ Préparer les données
      const userData = {
        username,
        password,
        role,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        department: department || undefined,
        jobTitle: jobTitle || undefined,
        profilePicture: profilePictureBase64
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.successMessage = 'Inscription réussie ! En attente d\'approbation.';
          this.errorMessage = '';
          this.isUploadingImage = false;
          
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          this.successMessage = '';
          this.isUploadingImage = false;
          
          if (err.error?.error) {
            this.errorMessage = err.error.error;
          } else if (err.error) {
            this.errorMessage = err.error;
          } else {
            this.errorMessage = 'Une erreur s\'est produite lors de l\'inscription.';
          }
        }
      });
    } else {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires correctement.';
    }
  }

  // ==========================================
  // UTILITAIRE: Convertir File en Base64
  // ==========================================
  
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string);
        resolve(base64String);
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }
}