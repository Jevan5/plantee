import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import OwnedPlant from 'src/app/models/owned-plant';
import { DocumentService } from 'src/app/services/document/document.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';

@Component({
  selector: 'app-water-owned-plant-button',
  templateUrl: './water-owned-plant-button.component.html',
  styleUrls: ['./water-owned-plant-button.component.scss'],
})
export class WaterOwnedPlantButtonComponent implements OnInit {
  @Input() ownedPlant: OwnedPlant;
  @Output() ownedPlantWateredEvent = new EventEmitter<OwnedPlant>();

  constructor(
    private document: DocumentService,
    private responsive: ResponsiveService
  ) { }

  ngOnInit() {}

  private static getRandomWateringMessage(ownedPlant: OwnedPlant): string {
    const possibilities = [
      `${ownedPlant.name}: "Ahh, that hit the spot."`,
      `What would ${ownedPlant.name} do without you?`,
      `${ownedPlant.name} will live to see another day.`,
      `Who's a good little plant? Yes you are, ${ownedPlant.name}, yes you are.`,
      `Alright ${ownedPlant.name}, I watered you. Can you grow, please?`
    ];

    return possibilities[Math.floor(Math.random() * possibilities.length)];
  }

  async waterOwnedPlant(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage(`Giving ${this.ownedPlant.name} some water`);
      let updatedOwnedPlant = new OwnedPlant(this.ownedPlant);
      updatedOwnedPlant.lastWatered = new Date();
      updatedOwnedPlant = await this.document.save(updatedOwnedPlant, OwnedPlant);
      this.ownedPlantWateredEvent.emit(updatedOwnedPlant);
      await this.responsive.setSuccessMessage(WaterOwnedPlantButtonComponent.getRandomWateringMessage(updatedOwnedPlant));
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
