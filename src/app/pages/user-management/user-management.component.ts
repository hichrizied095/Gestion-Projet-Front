import { Component, OnInit } from '@angular/core';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  isLoading = false;
  roles = ['Admin', 'ChefProjet', 'Membre'];

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.isLoading = false;
      },
      error: err => {
        console.error('Erreur chargement utilisateurs', err);
        this.isLoading = false;
      }
    });
  }

  updateRole(user: User, newRole: string): void {
    const updated = { ...user, role: newRole };
    this.userService.updateUserRole(updated.id!, updated).subscribe({
      next: () => user.role = newRole,
      error: err => alert('Erreur lors de la mise à jour du rôle')
    });
  }
  updateUserRole(user: User, event: Event): void {
  const select = event.target as HTMLSelectElement;
  const role = select.value;
  this.updateRole(user, role);
}


  deleteUser(id: number): void {
    if (confirm("Supprimer cet utilisateur ?")) {
      this.userService.deleteUser(id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== id);
      });
    }
  }
}
