import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import Gantt from 'frappe-gantt';
import { TaskItem } from '../../services/task-item.service';

@Component({
  selector: 'app-gantt-chart',
  standalone: false,
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.css'
})
export class GanttChartComponent implements AfterViewInit, OnChanges {
  @Input() tasks: TaskItem[] = [];
  @ViewChild('ganttContainer', { static: true }) ganttContainer!: ElementRef;
  private gantt: any;

  ngAfterViewInit() {
    if (this.tasks.length > 0) this.renderGantt();
  }

  ngOnChanges() {
    if (this.gantt && this.tasks.length > 0) {
      this.gantt.refresh(this.mapTasks());
    } else if (this.tasks.length > 0) {
      this.renderGantt();
    }
  }

  private renderGantt() {
    const options: any = {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
      custom_popup_html: (task: any) => `
        <div class="p-2">
          <h6>${task.name}</h6>
          <p><b>Début :</b> ${task.start}</p>
          <p><b>Fin :</b> ${task.end}</p>
          <p><b>Progression :</b> ${task.progress}%</p>
        </div>
      `
    };

    this.gantt = new Gantt(this.ganttContainer.nativeElement, this.mapTasks(), options);
  }

  private mapTasks() {
  return this.tasks.map(t => ({
    id: String(t.id), // ✅ frappe-gantt attend une string
    name: t.title,
    start: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
    end: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    progress: t.isCompleted ? 100 : this.calculateProgress(t),
    custom_class: this.getTaskClass(t)
  }));
}


  private calculateProgress(task: TaskItem): number {
    if (!task.startDate || !task.dueDate) return 0;
    const total = new Date(task.dueDate).getTime() - new Date(task.startDate).getTime();
    const elapsed = Date.now() - new Date(task.startDate).getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }

  private getTaskClass(task: TaskItem): string {
    if (task.isCompleted) return 'task-completed';
    const now = new Date();
    if (task.dueDate && new Date(task.dueDate) < now) return 'task-late';
    return 'task-in-progress';
  }
}
