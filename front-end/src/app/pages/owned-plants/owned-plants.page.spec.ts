import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OwnedPlantsPage } from './owned-plants.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('OwnedPlantsPage', () => {
  let component: OwnedPlantsPage;
  let fixture: ComponentFixture<OwnedPlantsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OwnedPlantsPage ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(OwnedPlantsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
