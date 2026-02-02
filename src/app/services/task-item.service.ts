import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from './user.service';
import { CommentDto } from '../Models';

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  columnId: number;
  isCompleted: boolean;
  updated?: boolean;
  startDate?: Date; // Important: utiliser string pour les dates retournées par l'API
  dueDate?: Date;
  filePath?: string;
  assignedUserId?: number;
  assignedUserName?: string;
  projectId?:number;
  projectTitle?: string;
  delayReason?:string;
  editingDelayReason?: string;
  progress?: number;
  comments?: CommentDto[];
  newComment?: string;
  attachments?: TaskAttachment[];
}
export interface TaskAttachment {
  id?: number;
  name: string;
  url: string;
  size?: number;
}


export interface TaskItemDetails {
  id: number;
  title: string;
  description: string;
  columnId: number;
  isCompleted: boolean;
  startDate: string;
  dueDate: string;
  filePath?: string;
  attachments: TaskAttachment[];
  comments: CommentDto[];
  assignedUserId?: number;
  assignedUsername?: string;
  delayReason?: string;

}


@Injectable({
  providedIn: 'root'
})
export class TaskItemService {
  private apiUrl = 'http://localhost:5279/api/TaskItems';

  constructor(private http: HttpClient) {}

  getTasksByColumn(columnId: number): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.apiUrl}/by-column/${columnId}`);
  }

  createTask(task: Partial<TaskItem>): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, task);
  }
  updateTask(id: number, task: TaskItem): Observable<TaskItem> {
  return this.http.put<TaskItem>(`${this.apiUrl}/${id}`, task);
}


  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getAllTasks(): Observable<TaskItem[]> {
  return this.http.get<TaskItem[]>(`${this.apiUrl}`);
}

uploadFile(taskId: number, formData: FormData) {
  return this.http.post<{ filePath: string }>(`http://localhost:5279/api/TaskItems/${taskId}/upload`, formData);
}
getTaskDetails(id: number): Observable<TaskItemDetails> {
  return this.http.get<TaskItemDetails>(`${this.apiUrl}/${id}/details`);
}
getTaskById(id: number): Observable<TaskItemDetails> {
    return this.http.get<TaskItemDetails>(`${this.apiUrl}/${id}/details`);
  }
getTasksByUser(username: string): Observable<TaskItem[]> {
  return this.http.get<TaskItem[]>(`http://localhost:5279/api/TaskItems/by-user/${username}`);
}
getTasksGroupedByUser(projectId: number): Observable<{ user: User; tasks: TaskItem[] }[]> {
  return this.http.get<{ user: User; tasks: TaskItem[] }[]>(`http://localhost:5279/api/TaskItems/project/${projectId}/grouped-by-user`);
}
saveDelayReason(taskId: number, reason: string) {
  return this.http.post(`${this.apiUrl}/${taskId}/delay-reason`, { reason });
}

getTasksWithAssignedUsers(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(`${this.apiUrl}/with-assigned-users`);
  }

  getTasksByProject(projectId: number) {
  return this.http.get<TaskItem[]>(`${this.apiUrl}/by-project/${projectId}`);
}
getTaskComments(taskId: number): Observable<CommentDto[]> {
    return this.http.get<CommentDto[]>(`http://localhost:5279/api/Comments/by-task/${taskId}`);
  }

}
