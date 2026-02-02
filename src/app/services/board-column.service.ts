import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardColumnDto } from '../Models';

@Injectable({
  providedIn: 'root'
})
export class BoardColumnService {
  private apiUrl = 'http://localhost:5279/api/BoardColumns';

  constructor(private http: HttpClient) {}

  getColumnsByProjectId(projectId: number): Observable<BoardColumnDto[]> {
    return this.http.get<BoardColumnDto[]>(`${this.apiUrl}?projectId=${projectId}`);
  }
}
