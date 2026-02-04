import { Component, OnInit, AfterViewInit } from '@angular/core';
import { 
  StatisticsService, 
  StatisticsOverview, 
  ProjectStats, 
  UserStats, 
  TasksByStatus,
  MonthlyStats,
  ColumnStats,
  AdvancedStats
} from '../../services/statistics.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  standalone: false,
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css'
})
export class StatisticsComponent implements OnInit, AfterViewInit {
  // Données
  overview!: StatisticsOverview;
  projectStats: ProjectStats[] = [];
  userStats: UserStats[] = [];
  tasksByStatus: TasksByStatus[] = [];
  monthlyStats: MonthlyStats[] = [];
  columnStats: ColumnStats[] = [];
  advancedStats!: AdvancedStats;

  // Graphiques
  projectChart: any;
  statusChart: any;
  monthlyChart: any;

  // État de chargement
  loading = true;
  dataLoaded = false;  // ✅ NOUVEAU FLAG

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit(): void {
    this.loadAllStatistics();
  }

  // ✅ NOUVEAU: Créer les graphiques après que la vue soit initialisée
  ngAfterViewInit(): void {
    // Attendre que les données soient chargées
    const checkData = setInterval(() => {
      if (this.dataLoaded) {
        clearInterval(checkData);
        setTimeout(() => {
          this.createAllCharts();
        }, 100);
      }
    }, 100);
  }

  /**
   * Charge toutes les statistiques
   */
  loadAllStatistics(): void {
    this.loading = true;
    let loadedCount = 0;
    const totalLoads = 7;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalLoads) {
        this.loading = false;
        this.dataLoaded = true;  // ✅ Indiquer que les données sont prêtes
      }
    };

    // Vue d'ensemble
    this.statisticsService.getOverview().subscribe({
      next: (data) => {
        this.overview = data;
        console.log('✅ Overview loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur overview:', err);
        checkAllLoaded();
      }
    });

    // Statistiques par projet
    this.statisticsService.getProjectStats().subscribe({
      next: (data) => {
        this.projectStats = data;
        console.log('✅ Project stats loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur project stats:', err);
        checkAllLoaded();
      }
    });

    // Statistiques par utilisateur
    this.statisticsService.getUserStats().subscribe({
      next: (data) => {
        this.userStats = data;
        console.log('✅ User stats loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur user stats:', err);
        checkAllLoaded();
      }
    });

    // Tâches par statut
    this.statisticsService.getTasksByStatus().subscribe({
      next: (data) => {
        this.tasksByStatus = data;
        console.log('✅ Tasks by status loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur tasks by status:', err);
        checkAllLoaded();
      }
    });

    // Statistiques mensuelles
    this.statisticsService.getMonthlyStats().subscribe({
      next: (data) => {
        this.monthlyStats = data;
        console.log('✅ Monthly stats loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur monthly stats:', err);
        checkAllLoaded();
      }
    });

    // Statistiques par colonne
    this.statisticsService.getColumnStats().subscribe({
      next: (data) => {
        this.columnStats = data;
        console.log('✅ Column stats loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur column stats:', err);
        checkAllLoaded();
      }
    });

    // Statistiques avancées
    this.statisticsService.getAdvancedStats().subscribe({
      next: (data) => {
        this.advancedStats = data;
        console.log('✅ Advanced stats loaded:', data);
        checkAllLoaded();
      },
      error: (err) => {
        console.error('❌ Erreur advanced stats:', err);
        checkAllLoaded();
      }
    });
  }

  /**
   * ✅ NOUVELLE MÉTHODE: Créer tous les graphiques
   */
  createAllCharts(): void {
    console.log('🎨 Création des graphiques...');
    this.createProjectChart();
    this.createStatusChart();
    this.createMonthlyChart();
  }

  /**
   * Graphique: Tâches par projet (Top 10)
   */
  createProjectChart(): void {
    const ctx = document.getElementById('projectChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas projectChart non trouvé');
      return;
    }

    // Détruire le graphique existant
    if (this.projectChart) {
      this.projectChart.destroy();
    }

    const top10 = this.projectStats.slice(0, 10);

    if (top10.length === 0) {
      console.warn('⚠️ Pas de données projet pour le graphique');
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: top10.map(p => p.projectTitle),
        datasets: [
          {
            label: 'Tâches totales',
            data: top10.map(p => p.taskCount),
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 2
          },
          {
            label: 'Tâches terminées',
            data: top10.map(p => p.completedTasks),
            backgroundColor: 'rgba(40, 167, 69, 0.6)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Top 10 Projets par Nombre de Tâches',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.projectChart = new Chart(ctx, config);
    console.log('✅ Graphique projet créé');
  }

  /**
   * Graphique: Répartition par statut (Donut)
   */
  createStatusChart(): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas statusChart non trouvé');
      return;
    }

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    if (this.tasksByStatus.length === 0) {
      console.warn('⚠️ Pas de données statut pour le graphique');
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.tasksByStatus.map(s => s.status),
        datasets: [{
          data: this.tasksByStatus.map(s => s.count),
          backgroundColor: this.tasksByStatus.map(s => s.color),
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Répartition des Tâches par Statut',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };

    this.statusChart = new Chart(ctx, config);
    console.log('✅ Graphique statut créé');
  }

  /**
   * Graphique: Évolution temporelle (Ligne)
   */
  createMonthlyChart(): void {
    const ctx = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas monthlyChart non trouvé');
      return;
    }

    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }

    if (this.monthlyStats.length === 0) {
      console.warn('⚠️ Pas de données mensuelles pour le graphique');
      return;
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.monthlyStats.map(m => m.monthLabel),
        datasets: [
          {
            label: 'Tâches créées',
            data: this.monthlyStats.map(m => m.created),
            borderColor: 'rgba(102, 126, 234, 1)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Tâches terminées',
            data: this.monthlyStats.map(m => m.completed),
            borderColor: 'rgba(40, 167, 69, 1)',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Évolution des Tâches (6 derniers mois)',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.monthlyChart = new Chart(ctx, config);
    console.log('✅ Graphique mensuel créé');
  }

  /**
   * Rafraîchir toutes les statistiques
   */
  refresh(): void {
    this.dataLoaded = false;
    this.loadAllStatistics();
  }

  /**
   * Obtenir la classe CSS pour le badge de rôle
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin':
        return 'bg-danger';
      case 'Manager':
      case 'ProjectOwner':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }
}