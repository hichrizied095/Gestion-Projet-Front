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


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login({ username, password }).subscribe({
        next: () => {
          console.log('Connexion réussie');
          this.router.navigate(['/projects']); // ✅ redirection ici
        },
        error: (err) => {
  if (err.status === 401 && err.error === "Votre compte n'est pas encore approuvé par l'administrateur.") {
    this.errorMessage = "Votre compte est en attente d'approbation.";
  } else {
    this.errorMessage = "Nom d'utilisateur ou mot de passe invalide.";
  }
}

      });
    }
  }
}
