import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MapSyncService {
  // A lock to prevent circular feedback loops
  private isUpdating = false;

  readonly center = signal({
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5,
    source: '' as 'leaflet' | 'cesium' | ''
  });

  update(
    latitude: number,
    longitude: number,
    zoom: number,
    source: 'leaflet' | 'cesium'
  ) {
    // If a sync is already in progress, ignore this update
    if (this.isUpdating) {
      return;
    }

    // Set the lock
    this.isUpdating = true;

    // Update the signal
    this.center.set({
      latitude,
      longitude,
      zoom,
      source
    });

    // Release the lock after 100ms
    // This delay is long enough to let the maps process the change
    // but short enough that the user won't notice a delay
    setTimeout(() => {
      this.isUpdating = false;
    }, 100);
  }
}