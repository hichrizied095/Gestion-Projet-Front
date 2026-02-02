import { Component, OnInit } from '@angular/core';
import { CreateProjectDto, ProjectDto } from '../../Models';
import { ProjectService } from '../../services/project.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ConfirmDeleteModalComponent } from '../../components/confirm-delete-modal/confirm-delete-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-projects',
  standalone: false,
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css'
})
export class ProjectsComponent implements OnInit {
  projects: ProjectDto[] = [];
  isLoading = true;
  projectForm!: FormGroup;
  searchTerm = '';
  sortAsc = true;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadProjects();

    this.projectForm = this.fb.group({
      title: ['', Validators.required],
      description: ['']
    });
  }

  loadProjects() {
    this.isLoading = true;
    this.projectService.getAllProjects().subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des projets', err);
        this.isLoading = false;
      }
    });
  }

  get filteredProjects(): ProjectDto[] {
    return this.projects.filter(project =>
      project.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  createProject() {
    if (this.projectForm.invalid) return;

    const dto: CreateProjectDto = this.projectForm.value;
    this.projectService.createProject(dto).subscribe({
      next: (project) => {
        this.projects.push(project);
        this.projectForm.reset();
      },
      error: (err) => {
        console.error('Erreur lors de la création du projet', err);
      }
    });
  }

  sortByTitle() {
    this.sortAsc = !this.sortAsc;
    this.projects.sort((a, b) =>
      this.sortAsc
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    );
  }

  confirmDeleteProject(project: ProjectDto): void {
  const modalRef = this.modalService.open(ConfirmDeleteModalComponent);
  modalRef.componentInstance.projectTitle = project.title;

  modalRef.result.then((confirmed) => {
    if (confirmed) {
      this.projectService.deleteProject(project.id).subscribe({
        next: () => {
          this.projects = this.projects.filter(p => p.id !== project.id);
        },
        error: (err) => {
          console.error('Erreur lors de la suppression', err);
        }
      });
    }
  }).catch(() => {});
}

}
