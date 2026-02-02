import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateMeetingDto, MeetingDto } from '../Models';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  private apiUrl = 'http://localhost:5279/api/Meetings';

  constructor(private http: HttpClient) { }

  getAll(): Observable<MeetingDto[]> {
    return this.http.get<MeetingDto[]>(this.apiUrl);
  }

  getById(id: number): Observable<MeetingDto> {
    return this.http.get<MeetingDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: CreateMeetingDto): Observable<any> {
    return this.http.post(this.apiUrl, dto);
  }

  update(id: number, dto: CreateMeetingDto): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
