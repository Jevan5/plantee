import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WaterOwnedPlantButtonComponent } from './water-owned-plant-button.component';

describe('WaterOwnedPlantButtonComponent', () => {
  let component: WaterOwnedPlantButtonComponent;
  let fixture: ComponentFixture<WaterOwnedPlantButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaterOwnedPlantButtonComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WaterOwnedPlantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
