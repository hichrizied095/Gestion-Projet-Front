import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-add-task-modal',
  standalone: false,
  templateUrl: './add-task-modal.component.html',
  styleUrl: './add-task-modal.component.css'
})
export class AddTaskModalComponent implements AfterViewInit, OnInit {
  @ViewChild('titleInput') titleInput!: ElementRef;

  // Champs du formulaire
  title = '';
  description = '';  // ✅ NOUVEAU
  percentage: number = 0;  // ✅ NOUVEAU - Progression initiale
  startDate: string = '';
  dueDate: string = '';
  users: User[] = [];
  selectedUserId?: number;

  constructor(
    public activeModal: NgbActiveModal,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Charger la liste des utilisateurs
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log('✅ Utilisateurs chargés:', users);
      },
      error: (err) => {
        console.error('❌ Erreur chargement utilisateurs:', err);
      }
    });
  }

  ngAfterViewInit(): void {
    // Focus automatique sur le champ titre
    setTimeout(() => this.titleInput.nativeElement.focus(), 0);
  }

  /**
   * Soumet le formulaire
   */
  submit() {
    // Validation
    if (!this.title.trim() || !this.startDate || !this.dueDate) {
      console.warn('⚠️ Champs requis manquants');
      return;
    }

    // Validation du pourcentage
    if (this.percentage < 0) {
      this.percentage = 0;
    }
    if (this.percentage > 100) {
      this.percentage = 100;
    }

    // Données à retourner
    const taskData = {
      title: this.title.trim(),
      description: this.description.trim() || null,  // ✅ NOUVEAU
      percentage: this.percentage || 0,  // ✅ NOUVEAU
      startDate: this.startDate,
      dueDate: this.dueDate,
      assignedUserId: this.selectedUserId || null
    };

    console.log('📤 Données de la tâche:', taskData);

    // Fermer le modal et retourner les données
    this.activeModal.close(taskData);
  }

  /**
   * Annule et ferme le modal
   */
  cancel() {
    this.activeModal.dismiss('cancel');
  }
}