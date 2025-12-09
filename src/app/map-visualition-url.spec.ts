import { TestBed } from '@angular/core/testing';

import { MapVisualitionUrl } from './map-visualition-url';

describe('MapVisualitionUrl', () => {
  let service: MapVisualitionUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapVisualitionUrl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
