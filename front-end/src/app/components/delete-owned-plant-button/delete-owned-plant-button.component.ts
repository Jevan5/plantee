import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AlertController } from '@ionic/angular';
import OwnedPlant from 'src/app/models/owned-plant';
import { DocumentService } from 'src/app/services/document/document.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';

@Component({
  selector: 'app-delete-owned-plant-button',
  templateUrl: './delete-owned-plant-button.component.html',
  styleUrls: ['./delete-owned-plant-button.component.scss'],
})
export class DeleteOwnedPlantButtonComponent implements OnInit {
  @Input() ownedPlant: OwnedPlant;
  @Output() ownedPlantDeletedEvent = new EventEmitter<OwnedPlant>();

  constructor(
    private alertController: AlertController,
    private document: DocumentService,
    private responsive: ResponsiveService
  ) { }

  ngOnInit() {}

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: `Deleting ${this.ownedPlant.name}`,
      subHeader: '',
      message: `Are you sure you would like to delete this plant?`,
      buttons: [
        {
          text: 'No',
          handler: () => { }
        },
        {
          text: 'Yes',
          handler: this.deleteOwnedPlant.bind(this)
        }
      ]
    });

    await alert.present();
  }

  async deleteOwnedPlant() {
    try {
      await this.responsive.setLoadingMessage(`Deleting ${this.ownedPlant.name}`);
      const deletedOwnedPlant = await this.document.delete<OwnedPlant>(this.ownedPlant._id, OwnedPlant);
      await this.responsive.setSuccessMessage(`Deleted ${deletedOwnedPlant.name}`);
      this.ownedPlantDeletedEvent.emit(deletedOwnedPlant);
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
