import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TaskItem, TaskItemDetails, TaskItemService, TaskAttachment } from '../../services/task-item.service';
import { CommentService } from '../../services/comment.service';
import { AuthService } from '../../services/auth.service';
import { User, UserService } from '../../services/user.service';
import { CommentDto } from '../../Models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-task-details-modal',
  standalone: false,
  templateUrl: './task-details-modal.component.html',
  styleUrl: './task-details-modal.component.css'
})
export class TaskDetailsModalComponent implements OnInit {
  @Input() taskId!: number;
  
  // ✅ TRÈS IMPORTANT: Déclarer l'EventEmitter
  @Output() taskUpdated = new EventEmitter<void>();
  
  task!: TaskItemDetails;
  newCommentText: string = '';
  users: User[] = [];
  isEditingDueDate: boolean = false;
  newDueDate: string = '';
  uploadingFile: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private taskService: TaskItemService,
    private commentService: CommentService,
    private authService: AuthService,
    private userService: UserService,
    private http: HttpClient
  ) {
    // ✅ Log pour vérifier que l'EventEmitter est créé
    console.log('✅ TaskDetailsModalComponent constructor, taskUpdated:', this.taskUpdated);
  }

  ngOnInit(): void {
    console.log('✅ TaskDetailsModalComponent ngOnInit, taskId:', this.taskId);
    if (this.taskId) {
      this.loadTaskDetails();
      this.loadUsers();
    }
  }

  loadTaskDetails() {
    console.log('📋 Chargement des détails de la tâche', this.taskId);
    this.taskService.getTaskDetails(this.taskId).subscribe({
      next: (data) => {
        this.task = data;
        if (this.task.dueDate) {
          this.newDueDate = this.formatDateForInput(this.task.dueDate);
        }
        console.log("✅ Task loaded:", this.task);
        console.log("📎 Attachments:", this.task.attachments);
      },
      error: (err) => {
        console.error('❌ Erreur de récupération de la tâche', err);
      }
    });
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => (this.users = users),
      error: (err) => console.error('Erreur chargement utilisateurs', err)
    });
  }

  getTaskStatus(): string {
    if (!this.task) return '';
    const now = new Date();
    const start = this.task.startDate ? new Date(this.task.startDate) : null;
    const due = this.task.dueDate ? new Date(this.task.dueDate) : null;

    if (this.task.isCompleted) return 'Terminée';
    if (start && start > now) return 'Planifiée';
    if (due && due < now) return 'En retard';
    return 'En cours';
  }

  formatDateForInput(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  enableDueDateEdit(): void {
    this.isEditingDueDate = true;
    if (this.task.dueDate) {
      this.newDueDate = this.formatDateForInput(this.task.dueDate);
    } else {
      this.newDueDate = new Date().toISOString().split('T')[0];
    }
  }

  cancelDueDateEdit(): void {
    this.isEditingDueDate = false;
    if (this.task.dueDate) {
      this.newDueDate = this.formatDateForInput(this.task.dueDate);
    }
  }

  saveDueDate(): void {
    if (!this.newDueDate || !this.task) return;

    const newDueDateObj = new Date(this.newDueDate);

    this.taskService.updateTask(this.task.id, {
      ...this.task,
      assignedUserId: this.task.assignedUserId,
      startDate: new Date(this.task.startDate),
      dueDate: newDueDateObj
    }).subscribe({
      next: (updatedTask) => {
        console.log('Date d\'échéance mise à jour avec succès', updatedTask);
        this.isEditingDueDate = false;
        this.loadTaskDetails();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la date d\'échéance', err);
        alert('Erreur lors de la mise à jour de la date');
      }
    });
  }

  addComment(): void {
    const username = this.authService.getCurrentUsername();
    if (!username || !this.newCommentText.trim()) return;

    this.commentService.addComment(this.task.id, this.newCommentText.trim()).subscribe({
      next: (newComment: CommentDto) => {
        if (!this.task.comments) {
          this.task.comments = [];
        }
        this.task.comments.push(newComment);
        this.newCommentText = '';
        this.loadTaskDetails();
      },
      error: (err) => console.error('Erreur ajout commentaire', err)
    });
  }

  updateAssignment(): void {
    if (!this.task) return;

    this.taskService.updateTask(this.task.id, {
      ...this.task,
      assignedUserId: this.task.assignedUserId,
      startDate: new Date(this.task.startDate),
      dueDate: new Date(this.task.dueDate)
    }).subscribe({
      next: () => {
        console.log('✅ Utilisateur réaffecté avec succès');
        this.taskUpdated.emit();
      },
      error: (err) => console.error('Erreur lors de la réaffectation', err)
    });
  }

  get hasComments(): boolean {
    return !!this.task?.comments && this.task.comments.length > 0;
  }

  get hasAttachments(): boolean {
    return !!this.task?.attachments && this.task.attachments.length > 0;
  }

  canEdit(): boolean {
    const userRole = this.authService.getCurrentUserRole();
    const userId = this.authService.getCurrentUserId();

    return userRole === 'Admin' ||
           userRole === 'ProjectOwner' ||
           (this.task.assignedUserId === userId && userRole === 'Member');
  }

  // GESTION DES FICHIERS (MULTIPLES ATTACHMENTS)

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file);
      input.value = '';
    }
  }

  uploadFile(file: File): void {
    console.log('📤 Début upload fichier:', file.name);
    
    // Validation
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      alert('Type de fichier non autorisé');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.uploadingFile = true;

    this.taskService.uploadFile(this.task.id, formData).subscribe({
      next: (response: any) => {
        console.log('✅ Fichier uploadé avec succès:', response);

        // Recharger les détails complets de la tâche
        this.loadTaskDetails();
        
        // ✅ Notifier le parent
        console.log('📢 Émission de taskUpdated');
        this.taskUpdated.emit();

        this.uploadingFile = false;
        alert('Fichier uploadé avec succès');
      },
      error: (err) => {
        console.error('❌ Erreur upload fichier:', err);
        this.uploadingFile = false;
        alert('Erreur lors de l\'upload: ' + (err.error?.message || err.message));
      }
    });
  }

  deleteAttachment(index: number): void {
  if (!this.task.attachments || !this.task.attachments[index]) {
    alert('Fichier introuvable');
    return;
  }

  const attachment = this.task.attachments[index];
  
  if (confirm(`Voulez-vous vraiment supprimer le fichier "${this.getFileName(attachment.name)}" ?`)) {
    const url = `http://localhost:5279/api/TaskItems/attachment/${attachment.id}`;
    
    this.http.delete(url).subscribe({
      next: (response: any) => {
        console.log('✅ Fichier supprimé avec succès:', response);
        
        // Supprimer de la liste locale
        this.task.attachments.splice(index, 1);
        
        // ✅ Notifier le parent pour synchroniser
        console.log('📢 Émission de taskUpdated après suppression');
        this.taskUpdated.emit();
        
        alert('Fichier supprimé avec succès');
      },
      error: (err) => {
        console.error('❌ Erreur suppression fichier:', err);
        alert('Erreur lors de la suppression du fichier: ' + (err.error?.error || err.message));
      }
    });
  }
}
  getFileName(fullPath: string): string {
    if (!fullPath) return '';
    const parts = fullPath.split(/[\\/]/);
    const fileName = parts[parts.length - 1];
    return fileName.replace(/^[a-f0-9\-]+_/, '');
  }

  getFileUrl(fileName: string): string {
    return `http://localhost:5279/api/TaskItems/download/${this.task.id}`;
  }

/**
 * Calcule le pourcentage de temps écoulé entre startDate et dueDate
 * @returns Pourcentage (0-100+)
 */
getTimeProgress(): number {
  if (!this.task || !this.task.startDate || !this.task.dueDate) {
    return 0;
  }

  const now = new Date();
  const start = new Date(this.task.startDate);
  const due = new Date(this.task.dueDate);

  // Temps total (en millisecondes)
  const totalTime = due.getTime() - start.getTime();
  
  // Temps écoulé (en millisecondes)
  const elapsedTime = now.getTime() - start.getTime();

  // Pourcentage
  const progress = (elapsedTime / totalTime) * 100;

  // Arrondir à l'entier
  return Math.max(0, Math.round(progress));
}

/**
 * Retourne un texte descriptif du temps restant
 */
getTimeRemainingText(): string {
  if (!this.task || !this.task.startDate || !this.task.dueDate) {
    return 'Dates non définies';
  }

  const progress = this.getTimeProgress();
  const now = new Date();
  const due = new Date(this.task.dueDate);
  const start = new Date(this.task.startDate);

  // Si la tâche est terminée
  if (this.task.isCompleted) {
    return '✅ Tâche terminée';
  }

  // Si la tâche n'a pas encore commencé
  if (now < start) {
    const daysUntilStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return `⏳ Commence dans ${daysUntilStart} jour${daysUntilStart > 1 ? 's' : ''}`;
  }

  // Si la tâche est en retard
  if (progress > 100) {
    const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return `⚠️ En retard de ${daysOverdue} jour${daysOverdue > 1 ? 's' : ''}`;
  }

  // Si la tâche est en cours
  const daysRemaining = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining === 0) {
    return '🔥 Échéance aujourd\'hui !';
  } else if (daysRemaining === 1) {
    return '⏰ Échéance demain';
  } else if (daysRemaining <= 3) {
    return `⚠️ Plus que ${daysRemaining} jours restants`;
  } else {
    return `📅 ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`;
  }
}

// ✅ Propriété pour accéder à Math.min dans le template
Math = Math;

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}