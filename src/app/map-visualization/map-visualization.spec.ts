import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapVisualization } from './map-visualization';

describe('MapVisualization', () => {
  let component: MapVisualization;
  let fixture: ComponentFixture<MapVisualization>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapVisualization]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapVisualization);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
