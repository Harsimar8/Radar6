import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface MapView {

    latitude: number;
    longitude: number;

    height: number;
    zoom: number;

    source: 'leaflet' | 'cesium';

}

@Injectable({
    providedIn: 'root'
})
export class MapSyncService {

    readonly camera$ = new BehaviorSubject<MapView>({

        latitude: 20.5937,
        longitude: 78.9629,

        height: 4000000,
        zoom: 5,

        source: 'leaflet'

    });

}