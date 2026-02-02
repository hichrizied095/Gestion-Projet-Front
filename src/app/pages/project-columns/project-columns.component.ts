declare var bootstrap: any;
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardColumnDto } from '../../Models';
import { BoardColumnService } from '../../services/board-column.service';
import { BoardColumn, ColumnsService } from '../../services/columns.service';
import { TaskItem, TaskItemService } from '../../services/task-item.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddTaskModalComponent } from '../../components/add-task-modal/add-task-modal.component';
import { TaskDetailsModalComponent } from '../../components/task-details-modal/task-details-modal.component';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { GanttModalComponent } from '../../components/gantt-modal/gantt-modal.component';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-project-columns',
  standalone: false,
  templateUrl: './project-columns.component.html',
  styleUrl: './project-columns.component.css'
})
export class ProjectColumnsComponent implements OnInit {
  projectId!: number;
  newColumnName = '';
  columnsWithTasks: (BoardColumn & { tasks: TaskItem[] })[] = [];


  constructor(
    private route: ActivatedRoute,
    private columnsService: ColumnsService,
    private taskItemService: TaskItemService,
    private modalService: NgbModal,
    private http: HttpClient

  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadColumns();
  }

  loadColumns(): void {
    this.columnsService.getColumns(this.projectId).subscribe(columns => {
      this.columnsWithTasks = columns.map(col => ({ ...col, tasks: [] }));
      for (let column of this.columnsWithTasks) {
        this.taskItemService.getTasksByColumn(column.id).subscribe(tasks => {
          column.tasks = tasks;
        });
      }
    });
  }

  getCompletionPercentage(tasks: TaskItem[]): number {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  }

  toggleTaskCompletion(task: TaskItem): void {
    const updated = { ...task, isCompleted: !task.isCompleted };
    this.taskItemService.updateTask(updated.id, updated).subscribe(() => {
      task.isCompleted = updated.isCompleted;
    });
  }

  isLate(task: TaskItem): boolean {
  if (task.dueDate && task.isCompleted === false) {
    return new Date(task.dueDate) < new Date();
  }
  return false;
}


  prolongTask(task: TaskItem): void {
  if (!task.dueDate) return;

  const extended = {
    ...task,
    dueDate: this.addDays(new Date(task.dueDate), 3)
  };

  this.taskItemService.updateTask(extended.id, extended).subscribe(() => {
    task.dueDate = extended.dueDate;
  });
}
updateDueDate(task: TaskItem, newDate: string): void {
  const updatedTask = { ...task, dueDate: new Date(newDate) };
  this.taskItemService.updateTask(task.id, updatedTask).subscribe(() => {
    task.dueDate = updatedTask.dueDate;
    task.updated = true;

    setTimeout(() => {
      task.updated = false;
    }, 2000);
  });
}
updateDueDateFromEvent(task: TaskItem, event: Event): void {
  const input = event.target as HTMLInputElement;
  const newDate = input.value;
  this.updateDueDate(task, newDate);
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

  console.log('📅', task.title, '| Today:', todayStr, '| Start:', startDateStr, '| Due:', dueDateStr);

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

onDrop(event: CdkDragDrop<TaskItem[]>, targetColumnId: number): void {
  if (event.previousContainer === event.container) {
    // Même colonne : juste réordonner (optionnel)
    return;
  }

  const task = event.previousContainer.data[event.previousIndex];

  // Déplacer visuellement
  transferArrayItem(
    event.previousContainer.data,
    event.container.data,
    event.previousIndex,
    event.currentIndex
  );

  // Mettre à jour la colonne dans le backend
  const updatedTask = { ...task, columnId: targetColumnId };

  this.taskItemService.updateTask(task.id, updatedTask).subscribe({
    next: () => {
      task.columnId = targetColumnId;
    },
    error: (err) => {
      console.error('Erreur de mise à jour de la colonne :', err);
    }
  });
}
get connectedDropListsIds(): string[] {
  return this.columnsWithTasks.map(c => 'list-' + c.id);
}



  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  addColumn(): void {
    if (!this.newColumnName.trim()) return;
    this.columnsService.addColumn({
      name: this.newColumnName,
      projectId: this.projectId
    }).subscribe(col => {
      this.columnsWithTasks.push({ ...col, tasks: [] });
      this.newColumnName = '';
    });
  }
  deleteColumn(id: number): void {
  this.columnsWithTasks = this.columnsWithTasks.filter(c => c.id !== id);
  this.columnsService.deleteColumn(id).subscribe();
}


  addTask(title: string, columnId: number, startDate: string, dueDate: string): void {
  if (!title.trim() || !startDate || !dueDate) return;

  const newTask = {
    title,
    startDate: new Date(startDate),
    dueDate: new Date(dueDate),
    columnId,
    isCompleted: false
  };

  this.taskItemService.createTask(newTask).subscribe(task => {
    const column = this.columnsWithTasks.find(c => c.id === columnId);
    column?.tasks.push(task);
  });
}
openAddTaskModal(columnId: number) {
  const modalRef = this.modalService.open(AddTaskModalComponent);
  modalRef.result.then((result) => {
    if (result) {
      const newTask: Partial<TaskItem> = {
        title: result.title,
        startDate: result.startDate,
        dueDate: result.dueDate,
        columnId: columnId,
        projectId: this.projectId,   // ✅ doit bien remonter ici
        assignedUserId: result.assignedUserId
      };

      // 🔎 Debug : voir ce qui part au backend
      console.log("📤 Task envoyée au backend :", newTask);
this.taskItemService.createTask(newTask).subscribe({
  next: task => {
    console.log("✅ Task créée :", task);
    const column = this.columnsWithTasks.find(c => c.id === columnId);
    if (column) column.tasks.push(task);
  },
  error: err => {
    console.error("❌ Erreur création tâche :", err);
  }
});

    }
  });
}

 // Méthode pour obtenir l'URL de téléchargement
  getFileUrl(taskId: number): string {
    return `http://localhost:5279/api/TaskItems/download/${taskId}`;
  }

  // Méthode pour obtenir le nom du fichier
  getFileName(task: TaskItem): string {
    if (!task.filePath) return '';

    // Si c'est un chemin, extraire le nom
    if (task.filePath && task.filePath.includes('/')) {
      const parts = task.filePath.split('/');
      let fileName = parts[parts.length - 1];
      // Enlever le GUID
      fileName = fileName.replace(/^[a-f0-9\-]+_/, '');
      return fileName || 'Fichier';
    }

    return task.filePath || 'Fichier';
  }

  // Méthode pour supprimer un fichier
  deleteFile(taskId: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce fichier ?')) {
      // Appel API pour supprimer
      this.http.delete(`http://localhost:5279/api/TaskItems/file/${taskId}`)
        .subscribe({
          next: (response: any) => {
            console.log('Fichier supprimé:', response);
            // Trouver et mettre à jour la tâche
            const task = this.columnsWithTasks.flatMap(c => c.tasks).find(t => t.id === taskId);
            if (task) {
              task.filePath = '';
            }
            alert('Fichier supprimé avec succès');
          },
          error: (err: any) => {
            console.error('Erreur suppression fichier:', err);
            alert('Erreur lors de la suppression du fichier');
          }
        });
    }
  }


uploadFile(event: Event, taskId: number): void {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    this.taskItemService.uploadFile(taskId, formData).subscribe({
      next: (res) => {
        const task = this.columnsWithTasks.flatMap(c => c.tasks).find(t => t.id === taskId);
        if (task) task.filePath = res.filePath;
      },
      error: err => console.error('Erreur upload', err)
    });
  }
}
openTaskDetails(task: TaskItem): void {
  console.log('Task cliquée :', task);
  const modalRef = this.modalService.open(TaskDetailsModalComponent, { size: 'lg' });
  modalRef.componentInstance.taskId = task.id;
}

deleteTask(taskId: number): void {
  const modalRef = this.modalService.open(ConfirmDialogComponent);
  modalRef.componentInstance.title = 'Suppression de la tâche';
  modalRef.componentInstance.message = 'Êtes-vous sûr de vouloir supprimer cette tâche ?';

  modalRef.result.then((result) => {
    if (result === true) {
      for (let column of this.columnsWithTasks) {
        const index = column.tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          column.tasks.splice(index, 1);
          break;
        }
      }

      this.taskItemService.deleteTask(taskId).subscribe({
        next: () => console.log(`Tâche ${taskId} supprimée`),
        error: (err) => console.error(`Erreur suppression tâche ${taskId}`, err)
      });
    }
  }).catch(() => {});
}
selectedTasks: TaskItem[] = [];

openGanttModal(tasks: TaskItem[]): void {
  console.log("🧩 Tâches envoyées au Gantt :", tasks);
  this.selectedTasks = tasks || [];

  setTimeout(() => {
    const modalElement = document.getElementById('ganttModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }, 100);
}

}
