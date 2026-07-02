import { Injectable, signal } from '@angular/core';

export interface MapViewState {

  latitude: number;
  longitude: number;

  // Leaflet zoom
  zoom: number;

  // Cesium camera height
  height: number;

  source: 'leaflet' | 'cesium';

}

@Injectable({
  providedIn: 'root'
})
export class MapSyncService {

  readonly view = signal<MapViewState>({
    latitude: 20.5937,
    longitude: 78.9629,
    zoom: 5,
    height: 1200000,
    source: 'leaflet'
  });

  update(state: MapViewState): void {

    this.view.set(state);

  }

}