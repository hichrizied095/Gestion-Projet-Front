import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProjectColumnsComponent } from './pages/project-columns/project-columns.component';
import { UserCreateComponent } from './pages/user-create/user-create.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { AddTaskModalComponent } from './components/add-task-modal/add-task-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDeleteModalComponent } from './components/confirm-delete-modal/confirm-delete-modal.component';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { RouterModule } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { TaskDetailsModalComponent } from './components/task-details-modal/task-details-modal.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { UserTasksComponent } from './pages/user-tasks/user-tasks.component';
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { StatCardComponent } from './components/stat-card/stat-card.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ChatComponent } from './components/chat/chat.component';
import { GanttChartComponent } from './components/gantt-chart/gantt-chart.component';
import { GanttModalComponent } from './components/gantt-modal/gantt-modal.component';

// ✅ Correction: BaseChartDirective au lieu de ChartsModule
import { BaseChartDirective } from 'ng2-charts';
import { MeetingListComponent } from './components/meeting-list/meeting-list.component';
import { MeetingCreateComponent } from './components/meeting-create/meeting-create.component';
import { MeetingDetailsComponent } from './components/meeting-details/meeting-details.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { ProfileComponent } from './components/profile/profile.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProjectsComponent,
    ProjectColumnsComponent,
    UserCreateComponent,
    RegisterComponent,
    LoginComponent,
    AddTaskModalComponent,
    ConfirmDeleteModalComponent,
    CalendarComponent,
    TaskDetailsModalComponent,
    ConfirmDialogComponent,
    UserTasksComponent,
    MyTasksComponent,
    UserManagementComponent,
    AdminDashboardComponent,
    StatCardComponent,
    NavbarComponent,
    ChatComponent,
    GanttChartComponent,
    GanttModalComponent,
    MeetingListComponent,
    MeetingCreateComponent,
    MeetingDetailsComponent,
    ProfileComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    RouterModule,
    CommonModule,
    DragDropModule,
    NgSelectModule,
    BaseChartDirective, // ✅ Correction: BaseChartDirective
    //FullCalendarModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    DatePipe // ✅ Ajout du DatePipe pour les pipes de date
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
