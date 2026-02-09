import { Component, OnInit } from '@angular/core';
import { TaskItem, TaskItemService } from '../../services/task-item.service';
import { MeetingService } from '../../services/meeting.service';
import { AuthService } from '../../services/auth.service';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { forkJoin } from 'rxjs';

// ✅ NOUVEAU: Interface pour les événements du jour
interface DayEvent {
  id: string;
  title: string;
  type: 'task' | 'meeting';
  status?: string;
  description?: string;
  assignedUser?: string;
  project?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  attendees?: number;
  backgroundColor: string;
  start?: Date;
  end?: Date;
}

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
  
  // ✅ NOUVEAU: Gestion de la vue de détails du jour
  selectedDate: Date | null = null;
  selectedDateStr: string = '';
  dayEvents: DayEvent[] = [];
  showDayDetails = false;
  
  // Stockage de tous les événements pour filtrage
  allEvents: DayEvent[] = [];
  
  stats = {
    totalTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    upcomingMeetings: 0
  };

  constructor(
    private taskService: TaskItemService,
    private meetingService: MeetingService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCalendarData();
  }

  loadCalendarData(): void {
    this.isLoading = true;
    
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      console.error('❌ Utilisateur non connecté');
      this.isLoading = false;
      return;
    }
    
    forkJoin({
      tasks: this.taskService.getCalendarTasks(userId),
      meetings: this.meetingService.getAll()
    }).subscribe({
      next: ({ tasks, meetings }) => {
        const events: EventInput[] = [];
        this.allEvents = []; // ✅ Réinitialiser
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
          
          let backgroundColor: string;
          let borderColor: string;
          let status: string;
          
          if (task.isCompleted) {
            backgroundColor = '#10b981';
            borderColor = '#059669';
            status = 'Terminée';
          } else if (dueDate < today) {
            backgroundColor = '#ef4444';
            borderColor = '#dc2626';
            status = 'En retard';
          } else if (startDate <= today && dueDate >= today) {
            backgroundColor = '#f97316';
            borderColor = '#ea580c';
            status = 'En cours';
          } else {
            backgroundColor = '#3b82f6';
            borderColor = '#2563eb';
            status = 'Planifiée';
          }
          
          const eventData = {
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
          };
          
          events.push(eventData);
          
          // ✅ Stocker pour filtrage par jour
          this.allEvents.push({
            id: `task-${task.id}`,
            title: task.title,
            type: 'task',
            status,
            description: task.description || 'Aucune description',
            assignedUser: task.assignedUserName || 'Non assigné',
            project: task.projectTitle || 'Aucun projet',
            backgroundColor,
            start: task.startDate ? new Date(task.startDate) : undefined,
            end: new Date(task.dueDate)
          });
        });

        // Convertir les réunions en événements
        meetings.forEach(meeting => {
          if (!meeting.meetingDate) return;
          
          let startDateTime = meeting.meetingDate;
          if (meeting.startTime && meeting.meetingDate.length === 10) {
            startDateTime = `${meeting.meetingDate}T${meeting.startTime}`;
          }
          
          const eventData = {
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
          };
          
          events.push(eventData);
          
          // ✅ Stocker pour filtrage par jour
          this.allEvents.push({
            id: `meeting-${meeting.id}`,
            title: meeting.projectTitle || 'Réunion',
            type: 'meeting',
            project: meeting.projectTitle || 'Aucun projet',
            attendees: meeting.attendees?.length || 0,
            duration: meeting.durationMinutes || 0,
            startTime: meeting.startTime || '',
            endTime: meeting.endTime || '',
            backgroundColor: '#8b5cf6',
            start: new Date(startDateTime),
            end: meeting.endTime && meeting.meetingDate.length === 10 ? 
                 new Date(`${meeting.meetingDate}T${meeting.endTime}`) : undefined
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
          dateClick: this.handleDateClick.bind(this), // ✅ NOUVEAU
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
        console.error('❌ Erreur lors du chargement du calendrier:', err);
        this.isLoading = false;
      }
    });
  }

  // ✅ NOUVEAU: Gérer le clic sur une date
  handleDateClick(arg: DateClickArg): void {
    this.selectedDate = arg.date;
    this.selectedDateStr = this.formatDate(arg.date);
    
    // Filtrer les événements du jour sélectionné
    this.dayEvents = this.getEventsForDate(arg.date);
    this.showDayDetails = true;
    
    console.log(`📅 Jour sélectionné: ${this.selectedDateStr}`, this.dayEvents);
    
    // Scroller vers les détails
    setTimeout(() => {
      const detailsElement = document.getElementById('day-details-section');
      if (detailsElement) {
        detailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  // ✅ NOUVEAU: Récupérer tous les événements d'une date
  getEventsForDate(date: Date): DayEvent[] {
    const targetDateStr = this.dateToString(date);
    
    return this.allEvents.filter(event => {
      // Pour les tâches avec période (start - end)
      if (event.start && event.end) {
        const startStr = this.dateToString(event.start);
        const endStr = this.dateToString(event.end);
        
        return targetDateStr >= startStr && targetDateStr <= endStr;
      }
      
      // Pour les événements ponctuels (réunions)
      if (event.start) {
        const eventDateStr = this.dateToString(event.start);
        return targetDateStr === eventDateStr;
      }
      
      return false;
    }).sort((a, b) => {
      // Trier par heure de début si disponible
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      // Sinon, mettre les réunions avant les tâches
      if (a.type === 'meeting' && b.type === 'task') return -1;
      if (a.type === 'task' && b.type === 'meeting') return 1;
      return 0;
    });
  }

  // ✅ NOUVEAU: Fermer les détails du jour
  closeDayDetails(): void {
    this.showDayDetails = false;
    this.selectedDate = null;
    this.dayEvents = [];
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

  // ✅ NOUVEAUX: Méthodes utilitaires
  private dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}