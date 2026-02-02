import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateProjectDto, ProjectDto } from '../Models';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:5279/api/Projects';

  constructor(private http: HttpClient) {}

  getAllProjects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(this.apiUrl);
  }
  createProject(dto: CreateProjectDto): Observable<ProjectDto> {
  return this.http.post<ProjectDto>(this.apiUrl, dto);
}
deleteProject(id: number) {
  return this.http.delete(`${this.apiUrl}/${id}`);
}

}
