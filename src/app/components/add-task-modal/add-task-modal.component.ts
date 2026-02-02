import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { User, UserService } from '../../services/user.service';


@Component({
  selector: 'app-add-task-modal',
  standalone: false,
  templateUrl: './add-task-modal.component.html',
  styleUrl: './add-task-modal.component.css'
})
export class AddTaskModalComponent implements AfterViewInit {
  @ViewChild('titleInput') titleInput!: ElementRef;

  title = '';
  startDate: string = '';
  dueDate: string = '';
  users: User[] = [];
selectedUserId?: number;

  constructor(public activeModal: NgbActiveModal,  private userService: UserService,
) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.titleInput.nativeElement.focus(), 0);
  }

  submit() {
    if (!this.title.trim() || !this.startDate || !this.dueDate) return;

    this.activeModal.close({
      title: this.title,
      startDate: this.startDate,
      dueDate: this.dueDate,
      assignedUserId: this.selectedUserId 
    });
  }
  ngOnInit(): void {
  this.userService.getUsers().subscribe({
    next: (users) => this.users = users
  });
  }
  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
