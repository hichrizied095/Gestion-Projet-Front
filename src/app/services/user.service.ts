import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  username: string;
  passwordHash: string;
  password?: string;
  role?: string;
  isApproved?: boolean;

}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5279/api/Users';

  constructor(private http: HttpClient) { }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }
  updateUserRole(id: number, user: User): Observable<User> {
  return this.http.put<User>(`${this.apiUrl}/${id}`, user);
}
deleteUser(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/${id}`);
}
getPendingUsers(): Observable<User[]> {
  return this.http.get<User[]>('http://localhost:5279/api/Users/pending');
}

approveUser(userId: number): Observable<any> {
  return this.http.put(`http://localhost:5279/api/Users/approve/${userId}`, {});
}

rejectUser(userId: number): Observable<any> {
  return this.http.delete(`http://localhost:5279/api/Users/reject/${userId}`);
}


}
