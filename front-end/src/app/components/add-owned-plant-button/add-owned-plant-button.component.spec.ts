import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SaveOwnedPlantButtonComponent } from './add-owned-plant-button.component';

describe('AddOwnedPlantButtonComponent', () => {
  let component: SaveOwnedPlantButtonComponent;
  let fixture: ComponentFixture<SaveOwnedPlantButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveOwnedPlantButtonComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SaveOwnedPlantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
