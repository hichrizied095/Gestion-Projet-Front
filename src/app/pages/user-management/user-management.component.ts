import { Component, OnInit } from '@angular/core';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  // Listes d'utilisateurs
  pendingUsers: User[] = [];
  approvedUsers: User[] = [];
  
  // État
  isLoading = false;
  
  // Rôles disponibles
  roles = ['Admin', 'Manager', 'Member'];
  
  // Utilisateur sélectionné pour les modals
  selectedUser: User | null = null;
  
  // Type d'action pour les modals
  modalAction: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete' | 'changeRole' | null = null;
  newRole: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  // ==========================================
  // CHARGEMENT DES DONNÉES
  // ==========================================

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: users => {
        // Séparer les utilisateurs en attente et approuvés
        this.pendingUsers = users.filter(u => !u.isApproved);
        this.approvedUsers = users.filter(u => u.isApproved);
        this.isLoading = false;
        console.log('✅ Utilisateurs chargés:', {
          pending: this.pendingUsers.length,
          approved: this.approvedUsers.length
        });
      },
      error: err => {
        console.error('❌ Erreur chargement utilisateurs', err);
        this.isLoading = false;
        alert('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  // ==========================================
  // GESTION DES MODALS
  // ==========================================

  openModal(user: User, action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'delete' | 'changeRole'): void {
    this.selectedUser = user;
    this.modalAction = action;
    this.newRole = user.role || 'Member';
  }

  closeModal(): void {
    this.selectedUser = null;
    this.modalAction = null;
    this.newRole = '';
  }

  confirmAction(): void {
    if (!this.selectedUser) return;

    switch (this.modalAction) {
      case 'approve':
        this.approveUser(this.selectedUser.id!);
        break;
      case 'reject':
        this.rejectUser(this.selectedUser.id!);
        break;
      case 'activate':
        this.activateUser(this.selectedUser.id!);
        break;
      case 'deactivate':
        this.deactivateUser(this.selectedUser.id!);
        break;
      case 'delete':
        this.deleteUser(this.selectedUser.id!);
        break;
      case 'changeRole':
        this.updateUserRole(this.selectedUser.id!, this.newRole);
        break;
    }
  }

  // ==========================================
  // ACTIONS UTILISATEUR - APPROBATION
  // ==========================================

  approveUser(userId: number): void {
    this.userService.approveUser(userId).subscribe({
      next: () => {
        console.log('✅ Utilisateur approuvé');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur approbation:', err);
        alert('Erreur lors de l\'approbation de l\'utilisateur');
        this.closeModal();
      }
    });
  }

  rejectUser(userId: number): void {
    this.userService.rejectUser(userId).subscribe({
      next: () => {
        console.log('✅ Utilisateur rejeté');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur rejet:', err);
        alert('Erreur lors du rejet de l\'utilisateur');
        this.closeModal();
      }
    });
  }

  // ==========================================
  // ACTIONS UTILISATEUR - ACTIVATION
  // ==========================================

  activateUser(userId: number): void {
    this.userService.activateUser(userId).subscribe({
      next: () => {
        console.log('✅ Compte activé');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur activation:', err);
        alert('Erreur lors de l\'activation du compte');
        this.closeModal();
      }
    });
  }

  deactivateUser(userId: number): void {
    this.userService.deactivateUser(userId).subscribe({
      next: () => {
        console.log('✅ Compte désactivé');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur désactivation:', err);
        alert('Erreur lors de la désactivation du compte');
        this.closeModal();
      }
    });
  }

  // ==========================================
  // ACTIONS UTILISATEUR - GESTION
  // ==========================================

  updateUserRole(userId: number, newRole: string): void {
    const user = this.approvedUsers.find(u => u.id === userId);
    if (!user) return;

    const updated = { ...user, role: newRole };
    this.userService.updateUserRole(userId, updated).subscribe({
      next: () => {
        console.log('✅ Rôle mis à jour');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur mise à jour rôle:', err);
        alert('Erreur lors de la mise à jour du rôle');
        this.closeModal();
      }
    });
  }

  deleteUser(userId: number): void {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        console.log('✅ Utilisateur supprimé');
        this.loadUsers(); // Recharger la liste
        this.closeModal();
      },
      error: err => {
        console.error('❌ Erreur suppression:', err);
        alert('Erreur lors de la suppression de l\'utilisateur');
        this.closeModal();
      }
    });
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  getRoleBadgeClass(role: string): string {
    const classes: { [key: string]: string } = {
      'Admin': 'bg-danger',
      'Manager': 'bg-primary',
      'Member': 'bg-secondary'
    };
    return classes[role] || 'bg-secondary';
  }

  getStatusBadgeClass(isActive: boolean | undefined): string {
    return isActive === false ? 'bg-warning' : 'bg-success';
  }

  getStatusText(isActive: boolean | undefined): string {
    return isActive === false ? 'Inactif' : 'Actif';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
