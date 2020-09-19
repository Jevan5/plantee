import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SaveOwnedPlantModalComponent } from '../saved-owned-plant-modal/save-owned-plant-modal.component';
import OwnedPlant from 'src/app/models/owned-plant';

@Component({
  selector: 'app-add-owned-plant-button',
  templateUrl: './add-owned-plant-button.component.html',
  styleUrls: ['./add-owned-plant-button.component.scss'],
})
export class SaveOwnedPlantButtonComponent implements OnInit {
  @Output() ownedPlantCreatedEvent = new EventEmitter<OwnedPlant>();

  constructor(private modalController: ModalController) { }

  ngOnInit() {}

  async presentModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: SaveOwnedPlantModalComponent
    });

    await modal.present();

    const data = await modal.onDidDismiss();

    if (data.data) this.ownedPlantCreatedEvent.emit(data.data);
  }
}
