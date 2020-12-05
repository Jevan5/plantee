import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DocumentService } from 'src/app/services/document/document.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import OwnedPlant from 'src/app/models/owned-plant';

@Component({
  selector: 'app-save-owned-plant-modal',
  templateUrl: './save-owned-plant-modal.component.html',
  styleUrls: ['./save-owned-plant-modal.component.scss'],
})
export class SaveOwnedPlantModalComponent implements OnInit {
  @Input() ownedPlant: OwnedPlant;

  name: string;
  amountWaterMl: number;
  wateringPeriodDays: number;

  constructor(
    private document: DocumentService,
    public modalController: ModalController,
    private responsive: ResponsiveService
  ) { }

  ngOnInit() {
    if (!this.creatingNewOwnedPlant()) {
      this.name = this.ownedPlant.name;
      this.amountWaterMl = this.ownedPlant.amountWaterMl;
      this.wateringPeriodDays = this.ownedPlant.wateringPeriodDays;
    }
  }

  creatingNewOwnedPlant(): boolean {
    return this.ownedPlant == null;
  }

  async saveOwnedPlant(): Promise<void> {
    try {
      if (this.creatingNewOwnedPlant()) {
        await this.responsive.setLoadingMessage(`Creating ${this.name}`);
        let newOwnedPlant = new OwnedPlant({
          amountWaterMl: this.amountWaterMl,
          lastWatered: new Date(),
          name: this.name,
          wateringPeriodDays: this.wateringPeriodDays
        });
  
        newOwnedPlant = await this.document.save(newOwnedPlant, OwnedPlant);
        await this.responsive.setSuccessMessage(`Created ${newOwnedPlant.name}`);
        await this.modalController.dismiss(newOwnedPlant);
      } else {
        await this.responsive.setLoadingMessage(`Saving changes to ${this.ownedPlant.name}`);
        let updatedOwnedPlant = new OwnedPlant();
        updatedOwnedPlant._id = this.ownedPlant._id;
        updatedOwnedPlant.lastWatered = this.ownedPlant.lastWatered;
        updatedOwnedPlant.name = this.name;
        updatedOwnedPlant.amountWaterMl = this.amountWaterMl;
        updatedOwnedPlant.wateringPeriodDays = this.wateringPeriodDays;

        updatedOwnedPlant = await this.document.save(updatedOwnedPlant, OwnedPlant);
        await this.responsive.setSuccessMessage(`Saved changes to ${updatedOwnedPlant.name}`);
        await this.modalController.dismiss(updatedOwnedPlant);
      }
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
