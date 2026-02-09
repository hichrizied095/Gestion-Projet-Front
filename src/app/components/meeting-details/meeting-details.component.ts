import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-meeting-details',
  standalone: false,
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.css']
})
export class MeetingDetailsComponent implements OnInit {
  meeting: any;
  tasks: any[] = [];  // ✅ Maintenant rempli directement depuis decisionsDetails
  isLoading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private meetingService: MeetingService,
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
        
        // ✅ CORRECTION: Utiliser decisionsDetails au lieu de decisions
        if (this.meeting.decisionsDetails && this.meeting.decisionsDetails.length > 0) {
          this.tasks = this.meeting.decisionsDetails.map((decision: any) => ({
            id: decision.taskId,
            title: decision.taskTitle,
            description: decision.description || 'Aucune description',
            assignedUsername: decision.owner,
            dueDate: decision.dueDate,
            percentage: decision.percentage || 0,  // ✅ Poids
            isCompleted: decision.isCompleted,  // ✅ Statut
            columnId: decision.columnId,  // ✅ Colonne
            assignedUserId: decision.assignedUserId
          }));
          
          console.log('✅ Tâches chargées depuis decisionsDetails:', this.tasks);
        } else {
          console.warn('⚠️ Pas de decisionsDetails, anciennes données?');
          this.tasks = [];
        }
        
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement réunion:', err);
        this.error = 'Impossible de charger les détails de la réunion';
        this.isLoading = false;
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/meetings']);
  }

  getInitials(attendee: any): string {
    const name = typeof attendee === 'string' ? attendee : (attendee?.username || '');
    if (!name) return '??';
    return name
      .split(' ')
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // ✅ CORRECTION: Utiliser directement task.percentage
  getTaskWeight(index: number): number {
    if (!this.tasks || index >= this.tasks.length) {
      return 0;
    }
    
    const task = this.tasks[index];
    const weight = task.percentage || 0;
    //console.log('📊 Poids de la tâche #' + (index + 1) + ':', weight);
    
    return weight;
  }

  getTaskStatus(task: any): string {
    if (!task) return 'Planifiée';
    
    // ✅ PRIORITÉ 1: Si la tâche est terminée
    if (task.isCompleted) return 'Terminée';

    // ✅ PRIORITÉ 2: Utiliser columnId si disponible (reflète l'état réel)
    // columnId 1 = À faire, 2 = En cours, 3 = Terminé
    if (task.columnId) {
      switch (task.columnId) {
        case 1:
          return 'Planifiée';  // Colonne "À faire"
        case 2:
          return 'En cours';   // Colonne "En cours" - priorité sur le retard
        case 3:
          return 'Terminée';   // Colonne "Terminé"
      }
    }

    // ✅ PRIORITÉ 3: Fallback sur les dates - CORRECTION TIMEZONE
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const startDateStr = task.startDate 
      ? (() => {
          const d = new Date(task.startDate);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })()
      : null;
    
    const dueDateStr = task.dueDate 
      ? (() => {
          const d = new Date(task.dueDate);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })()
      : null;

    // En retard seulement APRÈS l'échéance (pas le jour même)
    if (dueDateStr && todayStr > dueDateStr) {
      return 'En retard';
    }

    // En cours si aujourd'hui >= début
    if (startDateStr && todayStr >= startDateStr) {
      return 'En cours';
    }

    // Planifiée par défaut
    return 'Planifiée';
  }

  // Vérifie si la tâche est terminée
  isTaskCompleted(task: any): boolean {
    return task?.columnId === 3 || task?.isCompleted === true;
  }
}