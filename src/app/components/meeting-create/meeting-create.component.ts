// FILE: meeting-create.component.ts
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { MeetingService } from '../../services/meeting.service';
import { UserService } from '../../services/user.service';
import { ProjectService } from '../../services/project.service';
import { TaskItemService } from '../../services/task-item.service';
import { AuthService } from '../../services/auth.service';
import { CreateMeetingDto } from '../../Models';

@Component({
  selector: 'app-meeting-create',
  standalone: false,
  templateUrl: './meeting-create.component.html',
  styleUrl: './meeting-create.component.css'
})
export class MeetingCreateComponent implements OnInit {

  form!: FormGroup;
  projects: any[] = [];
  users: any[] = [];
  tasks: any[] = [];

  isLoading = true;
  isSubmitting = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private meetingService: MeetingService,
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskItemService,
    public router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.projectService.getAllProjects().subscribe(p => this.projects = p);
    this.userService.getUsers().subscribe(u => this.users = u);
    this.isLoading = false;
  }

  /** FORMULAIRE */
  buildForm() {
    this.form = this.fb.group({
      projectId: ['', Validators.required],
      meetingDate: ['', Validators.required],
      startTime: ['09:00', Validators.required],    // ← NOUVEAU : Valeur par défaut 9h
      endTime: ['10:00', Validators.required],      // ← NOUVEAU : Valeur par défaut 10h
      durationMinutes: [60, Validators.required], // ← NOUVEAU

      // liste d'IDs utilisateur
      attendees: this.fb.array([this.fb.control('', Validators.required)]),

      // liste d'IDs de tasks
      decisions: this.fb.array([])
    });

    // Écouter les changements d'heure pour recalculer la durée
    this.form.get('startTime')?.valueChanges.subscribe(() => this.calculateDuration());
    this.form.get('endTime')?.valueChanges.subscribe(() => this.calculateDuration());
    this.calculateDuration();

  }

  /** GETTERS */
  get attendees(): FormArray {
    return this.form.get('attendees') as FormArray;
  }

  get decisions(): FormArray {
    return this.form.get('decisions') as FormArray;
  }

  /** CALCULER LA DURÉE */
 // FILE: meeting-create.component.ts - Modifiez calculateDuration()
calculateDuration(): void {
  const startTime = this.form.get('startTime')?.value;
  const endTime = this.form.get('endTime')?.value;

  if (startTime && endTime) {
    const start = this.timeStringToMinutes(startTime);
    const end = this.timeStringToMinutes(endTime);

    if (end > start) {
      const duration = end - start;
      this.form.get('durationMinutes')?.setValue(duration, { emitEvent: false });

      // Validation : durée minimum de 15 minutes
      if (duration < 15) {
        this.form.get('endTime')?.setErrors({ minDuration: true });
        this.error = "La durée minimum d'une réunion est de 15 minutes.";
      } else {
        this.form.get('endTime')?.setErrors(null);
        if (this.error?.includes('durée')) this.error = '';
      }

      // Validation : durée maximum de 8 heures (480 minutes)
      if (duration > 480) {
        this.form.get('endTime')?.setErrors({ maxDuration: true });
        this.error = "La durée maximum d'une réunion est de 8 heures.";
      } else {
        if (this.error?.includes('maximum')) this.error = '';
      }
    } else {
      this.form.get('endTime')?.setErrors({ invalidTime: true });
      this.error = "L'heure de fin doit être après l'heure de début.";
    }
  }
}

  /** CONVERTIR HEURE EN MINUTES */
  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /** FORMATER LA DURÉE POUR L'AFFICHAGE */
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

  /** PARTICIPANTS */
  addAttendee() {
    this.attendees.push(this.fb.control('', Validators.required));
  }

  removeAttendee(index: number) {
    if (this.attendees.length > 1) {
      this.attendees.removeAt(index);
    }
  }

  /** DÉCISIONS */
  addDecision() {
    this.decisions.push(this.fb.control('', Validators.required));
  }

  removeDecision(i: number) {
    if (this.decisions.length > 0) {
      this.decisions.removeAt(i);
    }
  }

  /** CHARGER LES TÂCHES DU PROJET */
  onProjectChange() {
    const projectId = this.form.value.projectId;
    if (!projectId) return;

    this.taskService.getTasksByProject(projectId).subscribe({
      next: t => this.tasks = t,
      error: err => console.error(err)
    });
  }

  /** SOUMISSION */
  submit() {
  if (this.form.invalid) {
    this.error = "Veuillez remplir tous les champs obligatoires.";
    this.form.markAllAsTouched();
    return;
  }

  // Validation supplémentaire des heures
  const startTime = this.timeStringToMinutes(this.form.value.startTime);
  const endTime = this.timeStringToMinutes(this.form.value.endTime);
  const duration = this.form.value.durationMinutes;

  if (endTime <= startTime) {
    this.error = "L'heure de fin doit être après l'heure de début.";
    return;
  }

  if (duration <= 0) {
    this.error = "La durée doit être positive.";
    return;
  }

  if (duration < 15) {
    this.error = "La durée minimum d'une réunion est de 15 minutes.";
    return;
  }

  if (duration > 480) {
    this.error = "La durée maximum d'une réunion est de 8 heures.";
    return;
  }

  if (!this.auth.isAdmin() && !this.auth.hasRole('Manager')) {
    this.error = "Vous n'avez pas la permission de créer une réunion.";
    return;
  }

  this.isSubmitting = true;
  this.error = '';

  // S'assurer que la durée est un nombre
  const dto: CreateMeetingDto = {
    projectId: Number(this.form.value.projectId),
    meetingDate: this.form.value.meetingDate,
    startTime: this.form.value.startTime,
    endTime: this.form.value.endTime,
    durationMinutes: Number(this.form.value.durationMinutes),
    attendeesIds: this.form.value.attendees.map((id: any) => Number(id)),
    taskItemIds: this.form.value.decisions.map((id: any) => Number(id))
  };

  console.log('DTO envoyé:', dto); // Pour déboguer

  this.meetingService.create(dto).subscribe({
    next: () => {
      this.success = "Réunion créée avec succès !";
      this.isSubmitting = false;
      setTimeout(() => {
        this.router.navigate(['/meetings']);
      }, 2000);
    },
    error: err => {
      this.error = "Erreur lors de la création : " + (err.error?.message || err.message);
      this.isSubmitting = false;
      console.error('Erreur détaillée:', err);
    }
  });
}
}
