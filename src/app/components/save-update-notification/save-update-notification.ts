import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { BoardService } from '../../services/board';

@Component({
  selector: 'app-save-update-notification',
  imports: [CommonModule],
  templateUrl: './save-update-notification.html',
  styleUrl: './save-update-notification.css',
})
export class SaveUpdateNotification {
  boardService = inject(BoardService);

}
