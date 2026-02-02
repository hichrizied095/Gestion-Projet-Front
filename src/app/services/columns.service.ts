import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface BoardColumn {
  id: number;
  name: string;
  projectId: number;
}

@Injectable({ providedIn: 'root' })
export class ColumnsService {
  private apiUrl = 'http://localhost:5279/api/BoardColumns';

  constructor(private http: HttpClient) {}

  getColumns(projectId: number): Observable<BoardColumn[]> {
    return this.http.get<BoardColumn[]>(`${this.apiUrl}/project/${projectId}`);
  }

  addColumn(column: Partial<BoardColumn>): Observable<BoardColumn> {
    return this.http.post<BoardColumn>(this.apiUrl, column);
  }

  deleteColumn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

