import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdmimDashboard } from './admim-dashboard';

describe('AdmimDashboard', () => {
  let component: AdmimDashboard;
  let fixture: ComponentFixture<AdmimDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdmimDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdmimDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
