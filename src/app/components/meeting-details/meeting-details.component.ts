import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service';
import { TaskItemService } from '../../services/task-item.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-meeting-details',
  standalone: false,
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.css']
})
export class MeetingDetailsComponent implements OnInit {
  meeting: any;
  tasks: any[] = []; // Tâches complètes avec leur poids
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private meetingService: MeetingService,
    private taskService: TaskItemService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadMeeting(id);
    } else {
      this.error = 'ID de réunion invalide';
      this.isLoading = false;
    }
  }

  loadMeeting(id: number): void {
    this.isLoading = true;
    this.meetingService.getById(id).subscribe({
      next: (data: any) => {
        this.meeting = data;
        console.log('✅ Réunion chargée:', this.meeting);
        
        // Charger les détails complets des tâches si elles ont des IDs
        if (this.meeting.decisions && this.meeting.decisions.length > 0) {
          this.loadTasksDetails();
        } else {
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement réunion:', err);
        this.error = 'Impossible de charger les détails de la réunion';
        this.isLoading = false;
      }
    });
  }

  loadTasksDetails(): void {
    // Récupérer les IDs des tâches depuis les décisions
    const taskIds = this.meeting.decisions
      .map((d: any) => d.taskId || d.id)
      .filter((id: any) => id != null);

    if (taskIds.length === 0) {
      this.isLoading = false;
      return;
    }

    // Charger les détails de toutes les tâches en parallèle
    const taskRequests = taskIds.map((taskId: number) => 
      this.taskService.getTaskDetails(taskId)
    );

    forkJoin(taskRequests).subscribe({
      next: (tasks) => {
        this.tasks = tasks as any[];
        console.log('✅ Tâches chargées avec détails:', this.tasks);
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement tâches:', err);
        // Continuer même si les tâches ne se chargent pas
        this.isLoading = false;
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/meetings']);
  }

  getInitials(attendee: any): string {
    // Gérer les cas où attendee est un objet ou une string
    const name = typeof attendee === 'string' ? attendee : (attendee?.username || '');
    if (!name) return '??';
    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Retourne le poids de la tâche (percentage)
  getTaskWeight(index: number): number {
    // Utiliser les tâches complètes chargées
    if (!this.tasks || index >= this.tasks.length) {
      return 0;
    }
    
    const task = this.tasks[index];
    const weight = task.percentage || 0;
    console.log('📊 Poids de la tâche #' + (index + 1) + ':', weight);
    
    return weight;
  }

  // Retourne le statut de la tâche basé sur columnId
  getTaskStatus(task: any): string {
    // columnId 1 = À faire, 2 = En cours, 3 = Terminé
    if (!task || !task.columnId) {
      return 'Inconnu';
    }
    
    switch (task.columnId) {
      case 1:
        return 'À faire';
      case 2:
        return 'En cours';
      case 3:
        return 'Terminée';
      default:
        return task.isCompleted ? 'Terminée' : 'En cours';
    }
  }

  // Vérifie si la tâche est terminée
  isTaskCompleted(task: any): boolean {
    return task?.columnId === 3 || task?.isCompleted === true;
  }
}
