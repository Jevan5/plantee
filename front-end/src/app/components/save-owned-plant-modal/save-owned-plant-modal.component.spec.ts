import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SaveOwnedPlantModalComponent } from './save-owned-plant-modal.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

describe('SaveOwnedPlantModalComponent', () => {
  let component: SaveOwnedPlantModalComponent;
  let fixture: ComponentFixture<SaveOwnedPlantModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveOwnedPlantModalComponent ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SaveOwnedPlantModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
