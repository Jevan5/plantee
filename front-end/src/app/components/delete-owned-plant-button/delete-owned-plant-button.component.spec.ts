import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DeleteOwnedPlantButtonComponent } from './delete-owned-plant-button.component';

describe('DeleteOwnedPlantButtonComponent', () => {
  let component: DeleteOwnedPlantButtonComponent;
  let fixture: ComponentFixture<DeleteOwnedPlantButtonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeleteOwnedPlantButtonComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteOwnedPlantButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
