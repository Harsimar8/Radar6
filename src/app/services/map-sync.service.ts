import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface MapView {

  latitude: number;
  longitude: number;
  zoom: number;
  height: number;

}

@Injectable({
  providedIn: 'root'
})
export class MapSyncService {

  leafletToCesium$ = new Subject<MapView>();

  cesiumToLeaflet$ = new Subject<MapView>();

}