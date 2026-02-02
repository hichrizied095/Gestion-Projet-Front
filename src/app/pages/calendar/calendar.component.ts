import { Component, OnInit } from '@angular/core';
import { TaskItem, TaskItemService } from '../../services/task-item.service';
import { CalendarOptions } from '@fullcalendar/core'; // et non pas depuis angular
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

@Component({
  selector: 'app-calendar',
  standalone: false,
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  calendarOptions!: CalendarOptions;

  constructor(private taskService: TaskItemService) {}

  ngOnInit(): void {
    this.taskService.getAllTasks().subscribe((tasks: TaskItem[]) => {
      const events = tasks.map(task => ({
        title: task.title,
        start: task.startDate,
        end: task.dueDate,
        color: task.isCompleted ? '#38a169' : '#e53e3e'
      }));

      this.calendarOptions = {
        initialView: 'dayGridMonth',
        plugins: [dayGridPlugin, interactionPlugin], // ✅ ici, pas dans app.module.ts
        events,
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,dayGridWeek'
        }
      };
    });
  }
}
