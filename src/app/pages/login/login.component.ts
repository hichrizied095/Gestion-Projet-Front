import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required], // Accepte email OU username
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      
      this.authService.login({ username, password }).subscribe({
        next: (response) => {
          console.log('✅ Connexion réussie', response);
          
          // ✅ Appliquer le thème de l'utilisateur si disponible
          if (response.theme) {
            this.applyTheme(response.theme);
          }
          
          this.isLoading = false;
          this.router.navigate(['/projects']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('❌ Erreur de connexion', err);
          
          // Gestion des différents messages d'erreur
          if (err.status === 401) {
            if (err.error?.error) {
              // Message d'erreur du backend
              const errorMsg = err.error.error;
              
              if (errorMsg.includes('approuvé') || errorMsg.includes('approbation')) {
                this.errorMessage = "Votre compte est en attente d'approbation par l'administrateur.";
              } else if (errorMsg.includes('désactivé')) {
                this.errorMessage = "Votre compte a été désactivé. Contactez l'administrateur.";
              } else {
                this.errorMessage = "Email/nom d'utilisateur ou mot de passe invalide.";
              }
            } else {
              this.errorMessage = "Email/nom d'utilisateur ou mot de passe invalide.";
            }
          } else if (err.status === 0) {
            this.errorMessage = "Impossible de se connecter au serveur. Vérifiez votre connexion.";
          } else {
            this.errorMessage = "Une erreur s'est produite. Veuillez réessayer.";
          }
        }
      });
    }
  }

  // ✅ Appliquer le thème utilisateur
  private applyTheme(theme: string): void {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}