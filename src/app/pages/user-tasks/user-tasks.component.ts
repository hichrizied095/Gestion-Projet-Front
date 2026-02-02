import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TaskItem, TaskItemService } from '../../services/task-item.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-user-tasks',
  standalone: false,
  templateUrl: './user-tasks.component.html',
  styleUrl: './user-tasks.component.css'
})
export class UserTasksComponent implements OnInit {
  projectId!: number;
  userTasks: { user: User; tasks: TaskItem[] }[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskItemService
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTasksGroupedByUser();
  }

  // Calcule le statut de la tâche (méthode existante)
  getTaskStatus(task: TaskItem): string {
    const now = new Date();
    const start = task.startDate ? new Date(task.startDate) : null;
    const due = task.dueDate ? new Date(task.dueDate) : null;

    if (task.isCompleted) {
      return 'Terminée';
    }

    if (due && now > due) {
      return 'En retard';
    }

    if (start && now < start) {
      return 'Planifiée';
    }

    return 'En cours';
  }

  // Calcule un ordre numérique pour le tri
  getTaskStatusOrder(task: TaskItem): number {
    const status = this.getTaskStatus(task);

    // Ordre : En retard (1) > En cours (2) > Planifiée (3) > Terminée (4)
    switch(status) {
      case 'En retard': return 1;
      case 'En cours': return 2;
      case 'Planifiée': return 3;
      case 'Terminée': return 4;
      default: return 5;
    }
  }

  // Trier les tâches d'un utilisateur par statut
  sortTasksByStatus(tasks: TaskItem[]): TaskItem[] {
    return [...tasks].sort((a, b) => {
      return this.getTaskStatusOrder(a) - this.getTaskStatusOrder(b);
    });
  }

  toggleTaskCompletion(task: TaskItem): void {
    console.log("✅ Toggle appelé pour la tâche :", task.title);

    const updatedTask = { ...task, isCompleted: !task.isCompleted };
    this.taskService.updateTask(updatedTask.id, updatedTask).subscribe({
      next: () => {
        task.isCompleted = updatedTask.isCompleted;
        this.loadTasksGroupedByUser();  // 🔁 Recharge la liste à jour
      },
      error: (err) => console.error('Erreur de mise à jour', err)
    });
  }

  loadTasksGroupedByUser(): void {
    this.isLoading = true;
    this.taskService.getTasksGroupedByUser(this.projectId).subscribe({
      next: data => {
        // Trier les tâches pour chaque utilisateur
        this.userTasks = data.map(group => ({
          user: group.user,
          tasks: this.sortTasksByStatus(group.tasks)
        }));
        this.isLoading = false;
      },
      error: err => {
        console.error("Erreur chargement des tâches par utilisateur :", err);
        this.isLoading = false;
      }
    });
  }
}
