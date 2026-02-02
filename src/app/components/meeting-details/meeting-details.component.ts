import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MeetingDto } from '../../Models';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service'; // ← Ajoutez AuthService

@Component({
  selector: 'app-meeting-details',
  standalone: false,
  templateUrl: './meeting-details.component.html',
  styleUrls: ['./meeting-details.component.css'] // ← Changez styleUrl en styleUrls
})
export class MeetingDetailsComponent implements OnInit {

  meeting!: any; // Changez de MeetingDto à any pour plus de flexibilité
  isLoading = true;
  error = '';
  canEdit = false;
  canDelete = false;

  constructor(
    private route: ActivatedRoute,
    private meetingService: MeetingService,
    public auth: AuthService, // ← Injectez AuthService
    private router: Router // ← Injectez Router pour la navigation
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadMeeting(id);
  }

  loadMeeting(id: number): void {
    this.meetingService.getById(id).subscribe({
      next: (m: any) => {
        this.meeting = m;
        this.checkPermissions();
        this.isLoading = false;
      },
      error: (e: any) => {
        console.error(e);
        this.error = 'Impossible de charger la réunion.';
        this.isLoading = false;
      }
    });
  }

  checkPermissions(): void {
    const userId = this.auth.getCurrentUserId();
    const role = this.auth.getCurrentUserRole();

    // Admin peut tout faire
    if (role === 'Admin') {
      this.canEdit = true;
      this.canDelete = true;
      return;
    }

    // Chef de projet peut modifier/supprimer ses propres réunions
    if (role === 'Manager' && this.meeting.projectOwnerId === userId) {
      this.canEdit = true;
      this.canDelete = true;
      return;
    }

    // Participants peuvent seulement voir
    this.canEdit = false;
    this.canDelete = false;
  }

  deleteMeeting(): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réunion ?')) {
      return;
    }

    this.meetingService.delete(this.meeting.id).subscribe({
      next: () => {
        alert('Réunion supprimée avec succès.');
        this.router.navigate(['/meetings']);
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'Erreur lors de la suppression de la réunion.';
      }
    });
  }

  navigateToEdit(): void {
    this.router.navigate(['/meetings', this.meeting.id, 'edit']);
  }

  navigateBack(): void {
    this.router.navigate(['/meetings']);
  }

  isParticipant(): boolean {
    const userId = this.auth.getCurrentUserId();
    return this.meeting.attendeesIds?.includes(userId) || false;
  }

  isTaskAssigned(): boolean {
    const userId = this.auth.getCurrentUserId();
    return this.meeting.taskAssignedUserIds?.includes(userId) || false;
  }
  // Ajoutez ces méthodes à la classe MeetingDetailsComponent

getInitials(name: string): string {
  if (!name) return '??';
  return name.split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

isCurrentUser(attendeeName: string): boolean {
  const currentUsername = this.auth.getCurrentUsername();
  return attendeeName === currentUsername;
}

getParticipantsCountText(): string {
  const count = this.meeting.attendees?.length || 0;
  if (count === 0) return 'Aucun participant';
  if (count === 1) return '1 participant';
  return `${count} participants`;
}

isMeetingPast(): boolean {
  if (!this.meeting?.meetingDate) return false;
  const meetingDate = new Date(this.meeting.meetingDate);
  const now = new Date();
  return meetingDate < now;
}

isOverdue(decision: any): boolean {
  if (!decision?.dueDate) return false;
  const dueDate = new Date(decision.dueDate);
  const now = new Date();
  return dueDate < now && !decision.isCompleted;
}

getTaskStatusText(decision: any): string {
  if (decision.isCompleted) return 'Terminée';
  if (this.isOverdue(decision)) return 'En retard';
  return 'En cours';
}

generateReport(): void {
  // Fonction pour générer un rapport PDF (à implémenter)
  alert('Fonction d\'export PDF à implémenter');
  // Vous pouvez utiliser une librairie comme jsPDF ou html2pdf
}
formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} minute${mins > 1 ? 's' : ''}`;
  } else if (mins === 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours}h${mins.toString().padStart(2, '0')}`;
  }
}

getDaysRemaining(): string {
  if (!this.meeting?.meetingDate) return '';

  const meetingDate = new Date(this.meeting.meetingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  meetingDate.setHours(0, 0, 0, 0);

  const diffTime = meetingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Terminée il y a ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return "Aujourd'hui";
  } else if (diffDays === 1) {
    return "Demain";
  } else {
    return `Dans ${diffDays} jours`;
  }
}

getCompletedTasksCount(): number {
  if (!this.meeting?.decisions) return 0;
  return this.meeting.decisions.filter((d: any) => d.isCompleted).length;
}

getTaskCompletionPercentage(): number {
  if (!this.meeting?.decisions || this.meeting.decisions.length === 0) return 0;
  return Math.round((this.getCompletedTasksCount() / this.meeting.decisions.length) * 100);
}

countCurrentUserParticipants(): number {
  if (!this.meeting?.attendees) return 0;
  const currentUsername = this.auth.getCurrentUsername();
  return this.meeting.attendees.filter((attendee: string) =>
    attendee === currentUsername
  ).length;
}

isTaskAssignedToCurrentUser(decision: any): boolean {
  const currentUsername = this.auth.getCurrentUsername();
  return decision.assignedTo === currentUsername || decision.owner === currentUsername;
}

markTaskAsComplete(decision: any): void {
  if (confirm('Marquer cette tâche comme terminée ?')) {
    // Implémentez l'appel API ici
    console.log('Marquer la tâche comme terminée:', decision);
    // Rafraîchir les données
    this.loadMeeting(this.meeting.id);
  }
}

shareMeeting(): void {
  const url = window.location.href;
  navigator.clipboard.writeText(url).then(() => {
    alert('Lien copié dans le presse-papier !');
  });
}

addToCalendar(): void {
  // Implémentez l'ajout au calendrier (iCal, Google Calendar, etc.)
  alert('Fonction d\'ajout au calendrier à implémenter');
}

exportTasks(): void {
  // Implémentez l'export des tâches (CSV, Excel, etc.)
  alert('Fonction d\'export des tâches à implémenter');
}
}
