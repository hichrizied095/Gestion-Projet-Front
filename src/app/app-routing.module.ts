import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProjectsComponent } from './pages/projects/projects.component';
import { ProjectColumnsComponent } from './pages/project-columns/project-columns.component';
import { UserCreateComponent } from './pages/user-create/user-create.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { authGuard } from './guards/auth.guard';
import { CalendarComponent } from './pages/calendar/calendar.component';
import { UserTasksComponent } from './pages/user-tasks/user-tasks.component';
import { MyTasksComponent } from './pages/my-tasks/my-tasks.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminGuard } from './guards/admin.guard';
import { ChatComponent } from './components/chat/chat.component';
import { MeetingCreateComponent } from './components/meeting-create/meeting-create.component';
import { MeetingDetailsComponent } from './components/meeting-details/meeting-details.component';
import { MeetingListComponent } from './components/meeting-list/meeting-list.component';
import { ProfileComponent } from './components/profile/profile.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [authGuard] },
    { path: 'projects', component: ProjectsComponent, canActivate: [authGuard] },
    { path: 'projects/:id/columns', component: ProjectColumnsComponent, canActivate: [authGuard] },
    { path: 'add-user', component: UserCreateComponent },
    { path: 'calendar', component: CalendarComponent, canActivate: [authGuard] },
    { path: 'projects/:id/participants', component: UserTasksComponent,canActivate: [authGuard] },
    { path: 'mes-taches', component: MyTasksComponent, canActivate: [authGuard] },
    {path: 'admin/users',component: UserManagementComponent,canActivate: [authGuard],data: { roles: ['Admin'] }},
    { path: 'chat', component: ChatComponent,canActivate: [authGuard] },
    { path: 'meetings', component: MeetingListComponent },
    { path: 'meetings/create', component: MeetingCreateComponent },
    { path: 'meetings/:id', component: MeetingDetailsComponent },
    { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
    { path: 'statistics', component: StatisticsComponent, canActivate: [authGuard] },

    // 🔧 Redirection pour les notifications du backend qui utilisent /tasks/:id
    { path: 'tasks/:id', redirectTo: 'mes-taches', pathMatch: 'full' },
    { path: 'tasks', redirectTo: 'mes-taches', pathMatch: 'full' },

    { path: '**', redirectTo: '' },




];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
