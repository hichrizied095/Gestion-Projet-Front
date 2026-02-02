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


  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
  this.registerForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
    role: ['Member', Validators.required]
  });
}


  onSubmit() {
  if (this.registerForm.valid) {
    const { username, password, confirmPassword, role } = this.registerForm.value;

    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    this.authService.register(username!, password!, role!).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => alert('Erreur: ' + err.error)
    });
  }
}

}
