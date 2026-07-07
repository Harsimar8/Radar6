import { TestBed } from '@angular/core/testing';
import { MapSyncService } from './map-sync.service';

describe('MapSyncService', () => {
  let service: MapSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapSyncService);
  });

  it('converts height to zoom and back with a small error', () => {
    const height = 4_000_000;
    const latitude = 20.5937;
    const viewportHeight = 600;

    const zoom = service.getZoomFromHeight(height, latitude, viewportHeight);
    const roundTripHeight = service.getHeightFromZoom(zoom, latitude, viewportHeight);

    expect(zoom).toBeGreaterThan(1);
    expect(zoom).toBeLessThan(20);
    expect(Math.abs(roundTripHeight - height)).toBeLessThan(height * 0.05);
  });

  it('keeps zoom values in a valid range for small heights', () => {
    const zoom = service.getZoomFromHeight(600, 0, 600);

    expect(zoom).toBeGreaterThan(1);
    expect(zoom).toBeLessThan(20);
  });
});
