import { Component, OnInit } from '@angular/core';
import { TaskItem, TaskItemService } from '../../services/task-item.service';
import { MeetingService } from '../../services/meeting.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  calendarOptions!: CalendarOptions;
  isLoading = true;
  currentView = 'dayGridMonth';
  
  // Statistiques
  stats = {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    upcomingMeetings: 0
  };

  constructor(
    private taskService: TaskItemService,
    private meetingService: MeetingService
  ) {}

  ngOnInit(): void {
    this.loadCalendarData();
  }

  loadCalendarData(): void {
    this.isLoading = true;
    
    // Charger les tâches et réunions en parallèle
    forkJoin({
      tasks: this.taskService.getAllTasks(),
      meetings: this.meetingService.getAll()
    }).subscribe({
      next: ({ tasks, meetings }) => {
        const events: EventInput[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Statistiques
        this.stats.totalTasks = tasks.length;
        this.stats.completedTasks = tasks.filter(t => t.isCompleted).length;
        this.stats.overdueTasks = tasks.filter(t => {
          if (!t.dueDate) return false;
          return !t.isCompleted && new Date(t.dueDate) < today;
        }).length;
        this.stats.upcomingMeetings = meetings.filter(m => {
          if (!m.meetingDate) return false;
          const meetingDate = new Date(m.meetingDate);
          meetingDate.setHours(0, 0, 0, 0);
          return meetingDate >= today;
        }).length;

        // Convertir les tâches en événements
        tasks.forEach(task => {
          if (!task.dueDate) return;
          
          const startDate = task.startDate ? new Date(task.startDate) : new Date();
          const dueDate = new Date(task.dueDate);
          
          // Déterminer le statut et la couleur
          let backgroundColor: string;
          let borderColor: string;
          let status: string;
          
          if (task.isCompleted) {
            // ✅ Terminé - Vert
            backgroundColor = '#10b981';
            borderColor = '#059669';
            status = 'Terminée';
          } else if (dueDate < today) {
            // 🔴 En retard - Rouge
            backgroundColor = '#ef4444';
            borderColor = '#dc2626';
            status = 'En retard';
          } else if (startDate <= today && dueDate >= today) {
            // 🟠 En cours - Orange
            backgroundColor = '#f97316';
            borderColor = '#ea580c';
            status = 'En cours';
          } else {
            // 🔵 Planifié - Bleu
            backgroundColor = '#3b82f6';
            borderColor = '#2563eb';
            status = 'Planifiée';
          }
          
          events.push({
            id: `task-${task.id}`,
            title: `📋 ${task.title}`,
            start: task.startDate,
            end: task.dueDate,
            backgroundColor,
            borderColor,
            extendedProps: {
              type: 'task',
              description: task.description || 'Aucune description',
              status,
              assignedUser: task.assignedUserName || 'Non assigné',
              project: task.projectTitle || 'Aucun projet'
            }
          });
        });

        // Convertir les réunions en événements
        meetings.forEach(meeting => {
          if (!meeting.meetingDate) return;
          
          // Combiner date et heure pour un affichage précis
          let startDateTime = meeting.meetingDate;
          if (meeting.startTime && meeting.meetingDate.length === 10) {
            // Si meetingDate est au format YYYY-MM-DD, on ajoute l'heure
            startDateTime = `${meeting.meetingDate}T${meeting.startTime}`;
          }
          
          events.push({
            id: `meeting-${meeting.id}`,
            title: `🎯 ${meeting.projectTitle || 'Réunion'}`,
            start: startDateTime,
            end: meeting.endTime && meeting.meetingDate.length === 10 ? 
                 `${meeting.meetingDate}T${meeting.endTime}` : undefined,
            backgroundColor: '#8b5cf6',
            borderColor: '#7c3aed',
            extendedProps: {
              type: 'meeting',
              project: meeting.projectTitle || 'Aucun projet',
              attendees: meeting.attendees?.length || 0,
              duration: meeting.durationMinutes || 0,
              startTime: meeting.startTime || '',
              endTime: meeting.endTime || ''
            }
          });
        });

        this.calendarOptions = {
          initialView: this.currentView,
          plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
          locale: frLocale,
          events,
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },
          buttonText: {
            today: "Aujourd'hui",
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
          },
          height: 'auto',
          eventClick: this.handleEventClick.bind(this),
          eventMouseEnter: this.handleEventMouseEnter.bind(this),
          eventMouseLeave: this.handleEventMouseLeave.bind(this),
          dayCellClassNames: (arg) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = new Date(arg.date);
            cellDate.setHours(0, 0, 0, 0);
            
            return cellDate.getTime() === today.getTime() ? ['today-cell'] : [];
          }
        };

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du calendrier:', err);
        this.isLoading = false;
      }
    });
  }

  handleEventClick(info: any): void {
    const event = info.event;
    const props = event.extendedProps;
    
    let message = `${event.title}\n\n`;
    
    if (props.type === 'task') {
      message += `Statut: ${props.status}\n`;
      message += `Projet: ${props.project}\n`;
      message += `Assigné à: ${props.assignedUser}\n`;
      if (props.description) message += `\nDescription: ${props.description}`;
    } else if (props.type === 'meeting') {
      message += `Projet: ${props.project}\n`;
      if (props.startTime && props.endTime) {
        message += `Horaire: ${props.startTime} - ${props.endTime}\n`;
      }
      if (props.duration) {
        message += `Durée: ${props.duration} minutes\n`;
      }
      message += `Participants: ${props.attendees}`;
    }
    
    alert(message);
  }

  handleEventMouseEnter(info: any): void {
    info.el.style.cursor = 'pointer';
    info.el.style.transform = 'scale(1.05)';
    info.el.style.transition = 'transform 0.2s ease';
  }

  handleEventMouseLeave(info: any): void {
    info.el.style.transform = 'scale(1)';
  }

  changeView(view: string): void {
    this.currentView = view;
    if (this.calendarOptions) {
      this.calendarOptions.initialView = view;
    }
  }
}

