import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Message, ChatService } from '../../services/chat.service';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit {
  users: User[] = [];
  selectedUser?: User;
  messages: Message[] = [];
  newMessage: string = '';
  currentUserId: number | null = null;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUserId();
    console.log("👤 currentUserId :", this.currentUserId);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users.filter(u => u.id !== this.currentUserId);
        console.log("✅ Utilisateurs :", this.users);
      },
      error: (err) => console.error("❌ Erreur utilisateurs :", err)
    });

    if (this.currentUserId) {
      this.chatService.startConnection(this.currentUserId, (msg: any) => {
  if (
    (this.selectedUser && msg.senderId === this.selectedUser.id) ||
    msg.receiverId === this.currentUserId
  ) {
    this.messages.push({
      ...msg,
      senderName: msg.senderName || (msg.senderId === this.currentUserId ? 'Moi' : this.selectedUser?.username)
    });
  }
});

    }
  }

  selectUser(user: User) {
  this.selectedUser = user;

  if (this.currentUserId) {
    this.chatService.getHistory(this.currentUserId, user.id!).subscribe({
      next: (msgs) => this.messages = msgs,
      error: (err) => console.error("❌ Erreur chargement historique :", err)
    });
  }
}


  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedUser || !this.currentUserId) return;

    this.chatService.sendMessage(
      this.currentUserId,
      this.selectedUser.id!,
      this.newMessage
    );

    this.messages.push({
      senderId: this.currentUserId,
      receiverId: this.selectedUser.id!,
      content: this.newMessage
    });

    this.newMessage = '';
  }
}
