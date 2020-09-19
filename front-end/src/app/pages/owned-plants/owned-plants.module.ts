import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OwnedPlantsPageRoutingModule } from './owned-plants-routing.module';

import { OwnedPlantsPage } from './owned-plants.page';
import { SaveOwnedPlantButtonComponent } from 'src/app/components/add-owned-plant-button/add-owned-plant-button.component';
import { SaveOwnedPlantModalComponent } from 'src/app/components/saved-owned-plant-modal/save-owned-plant-modal.component';
import { DeleteOwnedPlantButtonComponent } from 'src/app/components/delete-owned-plant-button/delete-owned-plant-button.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OwnedPlantsPageRoutingModule
  ],
  declarations: [
    SaveOwnedPlantButtonComponent,
    SaveOwnedPlantModalComponent,
    OwnedPlantsPage,
    DeleteOwnedPlantButtonComponent
  ]
})
export class OwnedPlantsPageModule {}
