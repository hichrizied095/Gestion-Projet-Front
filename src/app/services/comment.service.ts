import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommentDto } from '../Models';

export interface CreateCommentDto {
  text: string;
  taskItemId: number;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:5279/api/Comments';

  constructor(private http: HttpClient) {}

  addComment(taskId: number, text: string): Observable<CommentDto> {
    const dto: CreateCommentDto = {
      text: text,
      taskItemId: taskId
    };
    return this.http.post<CommentDto>(this.apiUrl, dto);
  }

  getCommentsByTask(taskId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`${this.apiUrl}/by-task/${taskId}`);
  }
}
