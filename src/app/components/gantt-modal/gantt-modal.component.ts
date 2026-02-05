import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
} from '@angular/core';
import Gantt from 'frappe-gantt';
import { TaskItem } from '../../services/task-item.service';

import * as html2canvas_ from 'html2canvas';
const html2canvas = (html2canvas_ as any).default || html2canvas_;
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-gantt-modal',
  standalone: false,
  templateUrl: './gantt-modal.component.html',
  styleUrls: ['./gantt-modal.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class GanttModalComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() tasks: TaskItem[] = [];
  @Input() projectTitle?: string;
  @ViewChild('ganttContainer', { static: false }) ganttContainer!: ElementRef;

  selectedFilter: string = 'Toutes';
  selectedView: string = 'Week';
  selectedUser: string = 'Tous';
  sortBy: string = 'date';
  
  filteredTasks: TaskItem[] = [];
  uniqueUsers: string[] = [];
  gantt: any;
  
  stats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    planned: 0,
    completionRate: 0
  };

  private resizeObserver?: ResizeObserver;

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeData();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks'] && this.tasks) {
      console.log('📦 Tasks reçues pour Gantt:', this.tasks.length);
      this.initializeData();
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    if (this.gantt) {
      this.gantt = null;
    }
  }

  // ✅ NOUVEAU: Date/heure actuelle
  getCurrentDateTime(): string {
    return new Date().toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ✅ NOUVEAU: Initialisation
  private initializeData(): void {
    this.extractUniqueUsers();
    this.calculateStats();
    this.filterTasks();
    this.setupResizeObserver();
  }

  // ✅ NOUVEAU: Extraire utilisateurs uniques
  private extractUniqueUsers(): void {
    const usersSet = new Set<string>();
    
    this.tasks.forEach(task => {
      const userName = this.getUserName(task);
      if (userName && userName !== 'Non assigné') {
        usersSet.add(userName);
      }
    });

    this.uniqueUsers = Array.from(usersSet).sort();
    console.log('👥 Utilisateurs trouvés:', this.uniqueUsers);
  }

  // ✅ NOUVEAU: Calculer statistiques
  private calculateStats(): void {
    const tasks = this.filteredTasks.length > 0 ? this.filteredTasks : this.tasks;

    this.stats.total = tasks.length;
    this.stats.completed = tasks.filter(t => t.isCompleted).length;
    this.stats.overdue = tasks.filter(t => this.getTaskStatus(t) === 'En retard').length;
    this.stats.inProgress = tasks.filter(t => this.getTaskStatus(t) === 'En cours').length;
    this.stats.planned = tasks.filter(t => this.getTaskStatus(t) === 'Planifiée').length;
    this.stats.completionRate = this.stats.total > 0 
      ? Math.round((this.stats.completed / this.stats.total) * 100) 
      : 0;
  }

  // ✅ AMÉLIORÉ: Filtrage multi-critères
  filterTasks(): void {
    if (!this.tasks || this.tasks.length === 0) {
      this.renderEmpty();
      this.calculateStats();
      return;
    }

    let filtered = this.selectedFilter === 'Toutes'
      ? [...this.tasks]
      : this.tasks.filter(t => this.getTaskStatus(t) === this.selectedFilter);

    if (this.selectedUser !== 'Tous') {
      filtered = filtered.filter(t => this.getUserName(t) === this.selectedUser);
    }

    filtered = this.sortTasks(filtered);

    this.filteredTasks = filtered;
    this.calculateStats();

    console.log(`🎯 Filtres: ${this.filteredTasks.length} tâches`);
    this.renderGantt();
  }

  // ✅ NOUVEAU: Tri
  private sortTasks(tasks: TaskItem[]): TaskItem[] {
    switch (this.sortBy) {
      case 'date':
        return tasks.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        });
      
      case 'dueDate':
        return tasks.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        });
      
      case 'name':
        return tasks.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      
      case 'user':
        return tasks.sort((a, b) => 
          this.getUserName(a).localeCompare(this.getUserName(b))
        );
      
      case 'status':
        return tasks.sort((a, b) => 
          this.getTaskStatus(a).localeCompare(this.getTaskStatus(b))
        );
      
      default:
        return tasks;
    }
  }

  // ✅ NOUVEAU: Changer le tri
  changeSorting(): void {
    this.filterTasks();
  }

  // ✅ NOUVEAU: Reset filtres
  resetFilters(): void {
    this.selectedFilter = 'Toutes';
    this.selectedUser = 'Tous';
    this.sortBy = 'date';
    this.selectedView = 'Week';
    this.filterTasks();
  }

  // ✅ NOUVEAU: Export CSV
  exportAsCSV(): void {
    if (this.filteredTasks.length === 0) {
      alert('Aucune tâche à exporter');
      return;
    }

    const headers = ['Tâche', 'Assigné à', 'Début', 'Échéance', 'Statut', 'Progression'];
    const rows = this.filteredTasks.map(task => [
      task.title || 'Sans titre',
      this.getUserName(task),
      task.startDate ? new Date(task.startDate).toLocaleDateString('fr-FR') : '',
      task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : '',
      this.getTaskStatus(task),
      `${this.calculateProgress(task)}%`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const projectName = this.projectTitle || 'gantt';
    const date = new Date().toISOString().split('T')[0];
    link.download = `${projectName}_data_${date}.csv`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Données exportées en CSV');
  }

  // ✅ Export image (avec html2canvas si disponible)
  async exportAsImage(): Promise<void> {
    if (!this.ganttContainer?.nativeElement) return;

    try {
      const element = this.ganttContainer.nativeElement;
      const canvas = await (html2canvas as any)(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true // ✅ Utile si images externes
      } as any);

      const link = document.createElement('a');
      const projectName = this.projectTitle || 'gantt';
      const date = new Date().toISOString().split('T')[0];
      link.download = `${projectName}_${date}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      console.log('✅ Image exportée');
    } catch (error) {
      console.error('❌ Erreur export:', error);
      alert('Erreur export. Vérifiez que html2canvas est installé.');
    }
  }

  async exportAsPDF(): Promise<void> {
    if (!this.ganttContainer?.nativeElement) return;

    try {
      const element = this.ganttContainer.nativeElement;
      const canvas = await (html2canvas as any)(element, { scale: 2 } as any);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const projectName = this.projectTitle || 'gantt';
      pdf.save(`${projectName}_export.pdf`);
      console.log('✅ PDF exporté');
    } catch (error) {
      console.error('❌ Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF.');
    }
  }

  // ✅ AMÉLIORÉ: Impression
  printDiagram(): void {
    if (!this.ganttContainer?.nativeElement) return;

    const printWindow = window.open('', '', 'width=1200,height=800');
    if (!printWindow) {
      alert('Vérifiez votre bloqueur de popups.');
      return;
    }

    const svg = this.ganttContainer.nativeElement.querySelector('svg');
    if (!svg) {
      alert('Diagramme introuvable.');
      return;
    }

    const svgClone = svg.cloneNode(true) as SVGElement;
    this.applyColorsToSvg(svgClone);

    const title = this.projectTitle || 'Diagramme de Gantt';
    const date = new Date().toLocaleDateString('fr-FR');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - ${date}</title>
        <style>
          @page { size: landscape; margin: 1cm; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .print-stats { display: flex; justify-content: space-around; margin: 20px 0; padding: 10px; background: #f5f5f5; }
          .stat-item { text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
          .stat-label { font-size: 12px; color: #666; }
          svg { width: 100%; height: auto; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h1>${title}</h1>
          <p>Généré le ${date}</p>
        </div>
        <div class="print-stats">
          <div class="stat-item"><div class="stat-value">${this.stats.total}</div><div class="stat-label">Total</div></div>
          <div class="stat-item"><div class="stat-value">${this.stats.completed}</div><div class="stat-label">Terminées</div></div>
          <div class="stat-item"><div class="stat-value">${this.stats.inProgress}</div><div class="stat-label">En cours</div></div>
          <div class="stat-item"><div class="stat-value">${this.stats.overdue}</div><div class="stat-label">En retard</div></div>
          <div class="stat-item"><div class="stat-value">${this.stats.completionRate}%</div><div class="stat-label">Complétion</div></div>
        </div>
        ${svgClone.outerHTML}
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  }

  changeView(): void {
    this.renderGantt();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      if (this.gantt) {
        setTimeout(() => this.applyColorsViaDOM(), 200);
      }
    });

    if (this.ganttContainer?.nativeElement) {
      this.resizeObserver.observe(this.ganttContainer.nativeElement);
    }
  }

  private renderEmpty(): void {
    if (this.ganttContainer) {
      this.ganttContainer.nativeElement.innerHTML =
        '<div class="text-center p-5"><p class="text-muted">⚠️ Aucune tâche à afficher</p></div>';
    }
  }

  private renderGantt(): void {
    if (!this.ganttContainer?.nativeElement) {
      console.error('❌ Conteneur Gantt non trouvé');
      return;
    }

    if (!this.filteredTasks || this.filteredTasks.length === 0) {
      this.renderEmpty();
      return;
    }

    try {
      const tasksData = this.prepareGanttData();
      this.ganttContainer.nativeElement.innerHTML = '';

      const options = {
        view_mode: this.selectedView as 'Day' | 'Week' | 'Month',
        language: 'fr',
        bar_height: 32,
        padding: 18,
        date_format: 'DD/MM/YYYY',
        custom_popup_html: this.customPopupHtml.bind(this),
      };

      this.gantt = new Gantt(
        this.ganttContainer.nativeElement,
        tasksData,
        options
      );

      this.forceColorApplication();
      console.log('✅ Gantt créé avec succès');

    } catch (error) {
      console.error('❌ Erreur critique lors du rendu du Gantt:', error);
      this.renderEmpty();
    }
  }

  private prepareGanttData(): any[] {
    return this.filteredTasks
      .filter(task => task && task.title)
      .map((task, index) => {
        const startDate = this.validateAndFormatDate(task.startDate);
        const dueDate = this.validateAndFormatDate(task.dueDate);

        let finalStartDate = startDate;
        let finalDueDate = dueDate;

        if (finalStartDate && finalDueDate && new Date(finalDueDate) <= new Date(finalStartDate)) {
          const end = new Date(finalStartDate);
          end.setDate(end.getDate() + 1);
          finalDueDate = end.toISOString().split('T')[0];
        }

        return {
          id: task.id?.toString() || `task-${index}`,
          name: this.formatTaskName(task),
          start: finalStartDate || new Date().toISOString().split('T')[0],
          end: finalDueDate || new Date().toISOString().split('T')[0],
          progress: this.calculateProgress(task),
          dependencies: '',
          custom_class: this.getTaskColorClass(task),
        };
      });
  }

  private validateAndFormatDate(date: any): string | null {
    if (!date) return null;

    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn('❌ Date invalide:', date);
        return null;
      }
      
      // ✅ CORRECTION: Utiliser la date locale au lieu de UTC
      // pour éviter les décalages de fuseau horaire
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.warn('❌ Erreur de parsing de date:', date, error);
      return null;
    }
  }

  private calculateProgress(task: TaskItem): number {
    if (task.isCompleted) return 100;
    if (task.progress !== undefined) return Math.max(0, Math.min(100, task.progress));
    return this.getTaskStatus(task) === 'En cours' ? 50 : 0;
  }

  private formatTaskName(task: TaskItem): string {
    const userName = this.getUserName(task);
    const userIcon = this.getUserIcon(userName);
    const maxLength = 30;
    let taskTitle = task.title || 'Sans titre';

    if (taskTitle.length > maxLength) {
      taskTitle = taskTitle.substring(0, maxLength - 3) + '...';
    }

    return `${userIcon} ${userName} - ${taskTitle}`;
  }

  private getUserName(task: TaskItem): string {
    const possibleProperties = [
      'assignedUserName',
      'assignedUsername',
      'assignedUser',
      'userName',
      'username',
      'user'
    ];

    for (const prop of possibleProperties) {
      const value = (task as any)[prop];
      if (value && typeof value === 'string' && value !== 'null' && value !== 'undefined') {
        return value;
      }
    }

    if ((task as any).assignedUserDto) {
      const userDto = (task as any).assignedUserDto;
      if (userDto.username && userDto.username !== 'null') return userDto.username;
      if (userDto.name && userDto.name !== 'null') return userDto.name;
    }

    if (task.assignedUserId) {
      return `User${task.assignedUserId}`;
    }

    return 'Non assigné';
  }

  private getUserIcon(userName: string): string {
    const icons = ['👤', '💼', '🔧', '🎨', '⚡', '🌟', '🚀'];
    const safeName = userName || 'Non assigné';
    const firstChar = safeName.charAt(0);
    const index = Math.abs(firstChar.charCodeAt(0)) % icons.length;
    return icons[index];
  }

  private customPopupHtml(task: any): string {
    const taskId = task.id;
    const originalTask = this.filteredTasks.find(t =>
      t.id?.toString() === taskId ||
      t.id === parseInt(taskId) ||
      `task-${this.filteredTasks.indexOf(t)}` === taskId
    );

    if (!originalTask) {
      return `
        <div class="gantt-popup">
          <h5>${task.name}</h5>
          <p>Détails non disponibles</p>
        </div>
      `;
    }

    const userName = this.getUserName(originalTask);
    const status = this.getTaskStatus(originalTask);
    const startDate = originalTask.startDate ? new Date(originalTask.startDate).toLocaleDateString('fr-FR') : 'Non définie';
    const dueDate = originalTask.dueDate ? new Date(originalTask.dueDate).toLocaleDateString('fr-FR') : 'Non définie';
    const progress = this.calculateProgress(originalTask);

    return `
      <div class="gantt-popup">
        <div class="popup-header">
          <h5>${originalTask.title || 'Sans titre'}</h5>
          <span class="status-badge status-${status.toLowerCase().replace(' ', '-')}">${status}</span>
        </div>
        <div class="popup-content">
          <div class="popup-field">
            <strong>👤 Assigné à :</strong> ${userName}
          </div>
          <div class="popup-field">
            <strong>📅 Début :</strong> ${startDate}
          </div>
          <div class="popup-field">
            <strong>⏰ Échéance :</strong> ${dueDate}
          </div>
          <div class="popup-field">
            <strong>📊 Progression :</strong> ${progress}%
            <div class="progress" style="height: 8px; margin-top: 5px;">
              <div class="progress-bar" style="width: ${progress}%; background-color: ${this.getTaskColorHex(originalTask)};"></div>
            </div>
          </div>
          <div class="popup-field">
            <strong>📝 Description :</strong> ${originalTask.description || 'Aucune description'}
          </div>
        </div>
      </div>
    `;
  }

  private forceColorApplication(): void {
    [100, 300, 500, 1000].forEach(delay => {
      setTimeout(() => {
        if (this.gantt) {
          this.applyColorsViaDOM();
        }
      }, delay);
    });
  }

  private applyColorsViaDOM(): void {
    if (!this.ganttContainer?.nativeElement) return;

    const svg = this.ganttContainer.nativeElement.querySelector('svg');
    if (!svg) {
      console.warn('⏳ SVG non encore disponible...');
      return;
    }

    const barWrappers = svg.querySelectorAll('.bar-wrapper');
    let coloredBars = 0;

    barWrappers.forEach((barWrapper: Element) => {
      const taskId = barWrapper.getAttribute('data-id');
      if (!taskId) return;

      const task = this.filteredTasks.find(t =>
        t.id?.toString() === taskId ||
        t.id === parseInt(taskId)
      );

      if (!task) return;

      const color = this.getTaskColorHex(task);
      const bar = barWrapper.querySelector('.bar') as SVGElement;
      const barProgress = barWrapper.querySelector('.bar-progress') as SVGElement;

      if (bar) {
        bar.setAttribute('fill', color);
        bar.setAttribute('stroke', this.darkenColor(color, 15));
        bar.setAttribute('style', `fill: ${color}`);
        coloredBars++;
      }

      if (barProgress) {
        const lighterColor = this.lightenColor(color, 25);
        barProgress.setAttribute('fill', lighterColor);
        barProgress.setAttribute('style', `fill: ${lighterColor}`);
      }
    });

    if (coloredBars > 0) {
      console.log(`🎨 ${coloredBars} barres colorées avec succès`);
    }
  }

  private applyColorsToSvg(svg: SVGElement): void {
    const barWrappers = svg.querySelectorAll('.bar-wrapper');

    barWrappers.forEach((barWrapper: Element) => {
      const taskId = barWrapper.getAttribute('data-id');
      if (!taskId) return;

      const task = this.filteredTasks.find(t =>
        t.id?.toString() === taskId ||
        t.id === parseInt(taskId)
      );

      if (!task) return;

      const color = this.getTaskColorHex(task);
      const bar = barWrapper.querySelector('.bar') as SVGElement;
      const barProgress = barWrapper.querySelector('.bar-progress') as SVGElement;

      if (bar) {
        bar.setAttribute('fill', color);
        bar.setAttribute('stroke', this.darkenColor(color, 15));
        bar.style.fill = color;
      }

      if (barProgress) {
        const lighterColor = this.lightenColor(color, 25);
        barProgress.setAttribute('fill', lighterColor);
        barProgress.style.fill = lighterColor;
      }
    });
  }

  private getTaskStatus(task: TaskItem): string {
    if (!task) return 'Planifiée';
    if (task.isCompleted) return 'Terminée';

    // Normaliser les dates pour comparer uniquement le jour, mois, année
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = task.startDate ? new Date(task.startDate) : null;
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    // 1. D'abord vérifier si la tâche est en retard
    if (dueDate && today > dueDate) {
      return 'En retard';
    }

    // 2. Vérifier si la tâche a commencé
    if (startDate) {
      if (today < startDate) {
        return 'Planifiée';
      }
      return 'En cours';
    }

    return 'Planifiée';
  }

  private getTaskColorClass(task: TaskItem): string {
    const status = this.getTaskStatus(task);
    return `gantt-bar-${status.toLowerCase().replace(' ', '-')}`;
  }

  private getTaskColorHex(task: TaskItem): string {
    const status = this.getTaskStatus(task);
    switch (status) {
      case 'Terminée': return '#4CAF50';
      case 'En cours': return '#FF9800';
      case 'Planifiée': return '#2196F3';
      case 'En retard': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  private lightenColor(color: string, percent: number): string {
    switch (color) {
      case '#4CAF50': return '#81C784';
      case '#FF9800': return '#FFB74D';
      case '#2196F3': return '#64B5F6';
      case '#F44336': return '#E57373';
      default: return color;
    }
  }

  private darkenColor(color: string, percent: number): string {
    switch (color) {
      case '#4CAF50': return '#388E3C';
      case '#FF9800': return '#F57C00';
      case '#2196F3': return '#1976D2';
      case '#F44336': return '#D32F2F';
      default: return color;
    }
  }
}