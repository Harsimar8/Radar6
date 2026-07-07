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

    private readonly earthCircumference = 40075016.686;
    private readonly tileSize = 256;
    private readonly cesiumFov = Math.PI / 3;

    readonly camera$ = new BehaviorSubject<MapView>({

        latitude: 20.5937,
        longitude: 78.9629,

        height: 4000000,
        zoom: 5,

        source: 'leaflet'

    });

    getZoomFromHeight(height: number, latitude: number, viewportHeight: number): number {
        const safeHeight = Math.max(1, height);
        const safeViewportHeight = Math.max(1, viewportHeight);
        const latitudeRadians = (latitude * Math.PI) / 180;
        const visibleMeters = 2 * safeHeight * Math.tan(this.cesiumFov / 2);
        const resolution = visibleMeters / safeViewportHeight;
        const latitudeFactor = Math.cos(latitudeRadians);
        const zoom = Math.log2((this.earthCircumference * latitudeFactor) / (resolution * this.tileSize));

        return this.clampZoom(zoom);
    }

    getHeightFromZoom(zoom: number, latitude: number, viewportHeight: number): number {
        const safeZoom = Math.max(1, zoom);
        const safeViewportHeight = Math.max(1, viewportHeight);
        const latitudeRadians = (latitude * Math.PI) / 180;
        const resolution = (this.earthCircumference * Math.cos(latitudeRadians)) / (this.tileSize * Math.pow(2, safeZoom));
        const visibleMeters = resolution * safeViewportHeight;
        const height = visibleMeters / (2 * Math.tan(this.cesiumFov / 2));

        return Math.max(600, height);
    }

    private clampZoom(zoom: number): number {
        return Math.max(1, Math.min(18, zoom));
    }

}