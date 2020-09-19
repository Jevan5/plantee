import { Component, OnInit } from '@angular/core';
import { DocumentService } from 'src/app/services/document/document.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import OwnedPlant from 'src/app/models/owned-plant';
import { ModalController } from '@ionic/angular';
import { SaveOwnedPlantModalComponent } from 'src/app/components/saved-owned-plant-modal/save-owned-plant-modal.component';

@Component({
  selector: 'app-owned-plants',
  templateUrl: './owned-plants.page.html',
  styleUrls: ['./owned-plants.page.scss'],
})
export class OwnedPlantsPage implements OnInit {
  ownedPlants: OwnedPlant[];

  constructor(
    private document: DocumentService,
    private modalController: ModalController,
    private responsive: ResponsiveService
  ) { }

  ngOnInit() {
  }

  async ionViewWillEnter(): Promise<void> {
    this.ownedPlants = [];

    try {
      await this.responsive.setLoadingMessage('Loading your plants');
      this.ownedPlants = await this.document.getMany<OwnedPlant>(OwnedPlant);
      this.ownedPlants.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
      });
      await this.responsive.stopLoading();
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }

  async ownedPlantCreated($event): Promise<void> {
    await this.ionViewWillEnter();
  }

  async ownedPlantDeleted($event): Promise<void> {
    await this.ionViewWillEnter();
  }

  async viewOwnedPlant(ownedPlant): Promise<void> {
    const modal = await this.modalController.create({
      component: SaveOwnedPlantModalComponent,
      componentProps: {
        ownedPlant: ownedPlant
      }
    });

    await modal.present();

    const res = await modal.onDidDismiss();

    if (res.data) await this.ionViewWillEnter();
  }
}
