import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OwnedPlantsPage } from './owned-plants.page';

const routes: Routes = [
  {
    path: '',
    component: OwnedPlantsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OwnedPlantsPageRoutingModule {}
