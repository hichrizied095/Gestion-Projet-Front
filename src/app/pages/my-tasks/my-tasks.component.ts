import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { TaskItem, TaskItemService, TaskAttachment } from '../../services/task-item.service';
import { NotificationService } from '../../services/notification.service';
import { CommentService } from '../../services/comment.service';
import { CommentDto } from '../../Models';
import { HttpClient } from '@angular/common/http';
import { TaskDetailsModalComponent } from '../../components/task-details-modal/task-details-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-my-tasks',
  standalone: false,
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
  tasks: TaskItem[] = [];
  isEditingDelay: { [key: number]: boolean } = {};
  hasOverdueTasksWithoutReason = false;
  uploadingFile: { [key: number]: boolean } = {};

  constructor(
    private taskService: TaskItemService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private commentService: CommentService,
    private http: HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadMyTasks();
    this.startAutoRefresh();
  }

  loadMyTasks(): void {
    const username = this.authService.getCurrentUsername();
    if (!username) return;

    this.taskService.getTasksByUser(username).subscribe({
      next: (data) => {
        console.log('=== STRUCTURE DES TÂCHES REÇUES ===');
        console.log('Nombre de tâches:', data.length);

        if (data.length > 0) {
          const firstTask = data[0];
          console.log('Première tâche complète:', firstTask);
          console.log('Propriétés disponibles:', Object.keys(firstTask));
          console.log('projectId:', firstTask.projectId);
          console.log('projectTitle:', firstTask.projectTitle);
          console.log('JSON complet:', JSON.stringify(firstTask, null, 2));
        }

        this.tasks = data;

        // Pour chaque tâche, charger les détails pour avoir les attachments
        this.tasks.forEach(task => {
          this.loadTaskDetails(task);
          this.loadCommentsForTask(task);
        });

        this.updateOverdueTasksFlag();
      },
      error: (err) => console.error('Erreur récupération de mes tâches :', err)
    });
  }

  // Charger les détails complets d'une tâche (avec attachments)
  loadTaskDetails(task: TaskItem): void {
    this.taskService.getTaskDetails(task.id).subscribe({
      next: (taskDetails) => {
        // Mettre à jour les attachments
        task.attachments = taskDetails.attachments || [];
        // Initialiser le champ pour nouveau commentaire
        task.newComment = '';
      },
      error: (err) => console.error(`Erreur chargement détails tâche ${task.id}:`, err)
    });
  }

  // Charger les commentaires pour une tâche spécifique
  loadCommentsForTask(task: TaskItem): void {
    this.commentService.getCommentsByTask(task.id).subscribe({
      next: (comments) => {
        task.comments = comments || [];
        task.newComment = '';
      },
      error: (err) => console.error(`Erreur chargement commentaires tâche ${task.id}:`, err)
    });
  }

  // Gérer la sélection de fichier
  onFileSelected(event: Event, task: TaskItem): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadFile(file, task);
      input.value = '';
    }
  }

  // Uploader un fichier
  uploadFile(file: File, task: TaskItem): void {
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

    // Créer FormData
    const formData = new FormData();
    formData.append('file', file);

    // Afficher l'indicateur de chargement
    this.uploadingFile[task.id] = true;

    // Upload via le service
    this.taskService.uploadFile(task.id, formData).subscribe({
      next: (response: any) => {
        console.log('Fichier uploadé:', response);

        // Ajouter le nouvel attachment à la liste
        const newAttachment: TaskAttachment = {
          name: file.name,
          url: response.fullUrl || `http://localhost:5279/${response.filePath}`,
          size: file.size
        };

        if (!task.attachments) {
          task.attachments = [];
        }
        task.attachments.push(newAttachment);

        // Recharger les détails de la tâche pour avoir les données fraîches
        this.loadTaskDetails(task);

        // Cacher l'indicateur de chargement
        this.uploadingFile[task.id] = false;

        alert('Fichier uploadé avec succès');
      },
      error: (err) => {
        console.error('Erreur upload fichier:', err);
        this.uploadingFile[task.id] = false;
        alert('Erreur lors de l\'upload du fichier: ' + err.message);
      }
    });
  }

  // Méthodes utilitaires pour les fichiers
  getFileName(fullPath: string): string {
    if (!fullPath) return '';

    // Extraire juste le nom du fichier
    const parts = fullPath.split(/[\\/]/);
    const fileName = parts[parts.length - 1];

    // Enlever le GUID si présent
    return fileName.replace(/^[a-f0-9\-]+_/, '');
  }

  formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

  // Méthode pour obtenir l'URL de téléchargement
  getFileUrl(taskId: number, filePath: string): string {
    return `http://localhost:5279/api/TaskItems/download/${taskId}`;
  }

  // Supprimer un attachment
  deleteAttachment(task: TaskItem, attachmentIndex: number): void {
  if (!task.attachments || !task.attachments[attachmentIndex]) return;

  const attachment = task.attachments[attachmentIndex];
  
  if (confirm(`Supprimer "${this.getFileName(attachment.name)}" ?`)) {
    const url = `http://localhost:5279/api/TaskItems/attachment/${attachment.id}`;
    
    this.http.delete(url).subscribe({
      next: () => {
        task.attachments!.splice(attachmentIndex, 1);
        this.loadTaskDetails(task);
        alert('Fichier supprimé avec succès');
      },
      error: (err) => {
        console.error('Erreur suppression:', err);
        alert('Erreur: ' + err.message);
      }
    });
  }
}

  // Ajouter un commentaire
  addComment(task: TaskItem): void {
    const username = this.authService.getCurrentUsername();
    const commentText = task.newComment?.trim();

    if (!username || !commentText) return;

    this.commentService.addComment(task.id, commentText).subscribe({
      next: (newComment: CommentDto) => {
        if (!task.comments) {
          task.comments = [];
        }
        task.comments.push(newComment);
        task.newComment = '';
        this.loadCommentsForTask(task);
        console.log('✅ Commentaire ajouté:', newComment);
        this.sendCommentNotification(task, newComment, username);
      },
      error: (err) => {
        console.error('❌ Erreur ajout commentaire:', err);
        alert('Erreur lors de l\'ajout du commentaire');
      }
    });
  }

  // Envoyer une notification pour le commentaire
  private sendCommentNotification(task: TaskItem, comment: CommentDto, commenter: string): void {
    if (commenter !== this.authService.getCurrentUsername()) {
      const notification = {
        id: Date.now(),
        message: `Nouveau commentaire sur la tâche "${task.title}"`,
        type: 'comment',
        taskTitle: task.title,
        commentText: comment.text,
        commenter: commenter,
        createdAt: new Date().toISOString(),
        isRead: false,
        link: '/mes-taches'
      };

      const currentNotifications = this.notificationService['notificationsSource'].value || [];
      const updatedNotifications = [notification, ...currentNotifications];
      this.notificationService.updateNotifications(updatedNotifications);
    }
  }

  updateOverdueTasksFlag(): void {
    this.hasOverdueTasksWithoutReason = this.tasks.some(task =>
      this.isTaskOverdue(task) && !this.hasDelayReason(task)
    );
  }

 saveDelayReason(task: TaskItem): void {
    if (!task.editingDelayReason || task.editingDelayReason.trim() === '') {
      alert('Veuillez saisir une cause de retard');
      return;
    }

    const reason = task.editingDelayReason.trim();

    this.taskService.saveDelayReason(task.id, reason).subscribe({
      next: (response: any) => {
        // ✅ Vérifier si response existe avant d'accéder à ses propriétés
        if (response && response.delayReason) {
          task.delayReason = response.delayReason;
        } else {
          // Si la réponse ne contient pas delayReason, utiliser ce qu'on a envoyé
          task.delayReason = reason;
        }
        
        task.editingDelayReason = undefined;
        this.isEditingDelay[task.id] = false;
        this.updateOverdueTasksFlag();
        this.sendDelayNotification(task);
        
        console.log("✅ Cause du retard sauvegardée");
        alert("Cause du retard enregistrée avec succès");
      },
      error: (err) => {
        console.error("❌ Erreur sauvegarde retard :", err);
        alert("Erreur lors de la sauvegarde de la cause du retard");
      }
    });
  }

  private sendDelayNotification(task: TaskItem): void {
    const notification = {
      id: Date.now(),
      message: `Cause de retard enregistrée pour la tâche "${task.title}"`,
      type: 'delay_reason',
      taskTitle: task.title,
      createdAt: new Date().toISOString(),
      isRead: false,
      link: '/mes-taches'
    };

    const currentNotifications = this.notificationService['notificationsSource'].value || [];
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationService.updateNotifications(updatedNotifications);
  }

  toggleEditDelayReason(task: TaskItem): void {
    if (!this.isEditingDelay[task.id]) {
      task.editingDelayReason = task.delayReason || '';
      this.isEditingDelay[task.id] = true;
    } else {
      task.editingDelayReason = undefined;
      this.isEditingDelay[task.id] = false;
    }
  }

  cancelEditDelayReason(task: TaskItem): void {
    task.editingDelayReason = undefined;
    this.isEditingDelay[task.id] = false;
  }


getTaskStatus(task: TaskItem): string {
  if (!task) return 'Planifiée';
  if (task.isCompleted) return 'Terminée';

  // ✅ Aujourd'hui en AAAA-MM-JJ (ignore l'heure)
  const todayStr = new Date().toISOString().split('T')[0];

  // ✅ Parser les dates en ignorant la timezone
  const startDateStr = task.startDate 
    ? new Date(task.startDate).toISOString().split('T')[0] 
    : null;
  
  const dueDateStr = task.dueDate 
    ? new Date(task.dueDate).toISOString().split('T')[0] 
    : null;

  //console.log('📅', task.title, '| Today:', todayStr, '| Start:', startDateStr, '| Due:', dueDateStr);

  // ✅ Comparer les chaînes de dates (AAAA-MM-JJ)
  
  // 1. En retard si aujourd'hui > échéance
  if (dueDateStr && todayStr > dueDateStr) {
    return 'En retard';
  }

  // 2. En cours si aujourd'hui >= début
  if (startDateStr && todayStr >= startDateStr) {
    return 'En cours';
  }

  // 3. Planifiée si pas encore commencée
  return 'Planifiée';
}
  isTaskOverdue(task: TaskItem): boolean {
    if (task.isCompleted) return false;
    const now = new Date();
    const due = task.dueDate ? new Date(task.dueDate) : null;
    return due ? now > due : false;
  }

  hasDelayReason(task: TaskItem): boolean {
    return !!task.delayReason && task.delayReason.trim() !== '';
  }

  getProjectName(task: TaskItem): string {
    if (task.projectTitle && task.projectTitle !== 'Sans projet') {
      return task.projectTitle;
    }
    return 'Projet non spécifié';
  }
   updateTaskAttachments(taskId: number, newAttachments: TaskAttachment[]): void {
    const taskIndex = this.tasks.findIndex(t => t.id === taskId);

    if (taskIndex !== -1) {
      // Mettre à jour les attachments de la tâche
      this.tasks[taskIndex].attachments = newAttachments;

      // Optionnel: recharger les détails pour s'assurer que tout est à jour
      this.loadTaskDetails(this.tasks[taskIndex]);

      console.log(`✅ Attachments mis à jour pour la tâche ${taskId}`);
    } else {
      console.warn(`⚠️ Tâche ${taskId} non trouvée dans la liste`);
    }
  }

  // Méthode appelée lorsque la modale est ouverte
  openTaskDetails(taskId: number): void {
  const modalRef = this.modalService.open(TaskDetailsModalComponent, { 
    size: 'lg',
    backdrop: 'static' 
  });
  
  modalRef.componentInstance.taskId = taskId;

  // ✅ Vérifier que taskUpdated existe avant de s'abonner
  if (modalRef.componentInstance.taskUpdated) {
    const subscription = modalRef.componentInstance.taskUpdated.subscribe(() => {
      console.log('📢 Événement taskUpdated reçu, rechargement des tâches...');
      this.loadMyTasks();
    });

    // ✅ Se désabonner quand le modal se ferme
    modalRef.result.finally(() => {
      subscription.unsubscribe();
    });
  }

  // Recharger après fermeture de la modale
  modalRef.result.then(
    () => {
      console.log('✅ Modal fermé avec succès');
      this.loadMyTasks();
    },
    () => {
      console.log('❌ Modal annulé');
      this.loadMyTasks();
    }
  );
}
  refreshTaskDetails(task: TaskItem): void {
  this.loadTaskDetails(task);

  // Optionnel: Afficher un message
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3';
  alert.style.zIndex = '1050';
  alert.innerHTML = `
    <i class="bi bi-check-circle me-2"></i>
    Données rafraîchies pour la tâche "${task.title}"
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alert);

  setTimeout(() => {
    if (alert.parentNode) {
      alert.parentNode.removeChild(alert);
    }
  }, 3000);
}
// Rafraîchir périodiquement les données
startAutoRefresh(): void {
  // Rafraîchir toutes les 30 secondes
  setInterval(() => {
    if (this.tasks.length > 0) {
      console.log('🔄 Rafraîchissement automatique des tâches...');
      this.tasks.forEach(task => {
        this.loadTaskDetails(task);
      });
    }
  }, 30000); // 30 secondes
}

}

