import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-delete-modal',
  standalone: false,
  template: `
    <div class="modal-header">
      <h5 class="modal-title text-danger">Confirmer la suppression</h5>
      <button type="button" class="btn-close" aria-label="Close" (click)="activeModal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>Êtes-vous sûr de vouloir supprimer le projet <strong>{{ projectTitle }}</strong> ?</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" (click)="activeModal.dismiss()">Annuler</button>
      <button class="btn btn-danger" (click)="activeModal.close(true)">Supprimer</button>
    </div>
  `
})
export class ConfirmDeleteModalComponent {
  @Input() projectTitle = '';
  constructor(public activeModal: NgbActiveModal) {}
}
