import {
  AfterViewInit,
  Component,
  effect
} from '@angular/core';

import * as L from 'leaflet';
import { EntityRenderService } from '../../../core/rendering/entity-render.service';
import { MapSyncService } from '../../../services/map-sync.service';
import { AssetSelectionService } from '../../../services/asset-selection.service';
import { SimulationService } from '../../../services/simulation.service';
import { EntityService } from '../../../services/entity.service';
import { AssetFactory } from '../../../core/asset-library/factories/asset-factory';
import { Entity } from '../../../core/models/Entity';
import { EntityType } from '../../../core/enums/EntityType';

@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  imports: [],
  templateUrl: './leaflet-map.html',
  styleUrl: './leaflet-map.css'
})
export class LeafletMap implements AfterViewInit {

  private map!: L.Map;
  private markers = L.layerGroup();
   private iconCache = new Map<string, L.Icon>();
   private syncing = false;

 

  constructor(
    public simulationService: SimulationService,
    private entityService: EntityService,
    private mapSyncService: MapSyncService,
    private assetSelectionService: AssetSelectionService,
    private renderService: EntityRenderService
) {
    // 1. React to entity changes
    effect(() => {
      this.entityService.entities();
      if (this.map) this.redrawEntities();
    });

    // 2. Handle panel resize
    effect(() => {
      this.simulationService.panelMode();
      if (this.map) {
        setTimeout(() => this.map.invalidateSize(), 50);
      }
    });

    // 3. Sync from Cesium (with guard)
    
  }

  ngAfterViewInit(): void {
    this.initializeMap();
this.initializeTileLayer();
this.markers.addTo(this.map);

this.initializeSynchronization();

this.initializeClickHandler();
this.redrawEntities();
  }

  private initializeMap(): void {
    const initialView = this.mapSyncService.camera$.value;

    this.map = L.map('leaflet-map').setView(
      [initialView.latitude, initialView.longitude],
      initialView.zoom ?? this.getZoomFromHeight(initialView.height)
    );

    // Only emit to service on user-initiated events
     this.map.on('moveend zoomend', () => {

  if (this.syncing) {
    return;
  }

  const center = this.map.getCenter();

   

  const zoom = this.map.getZoom();

  this.mapSyncService.camera$.next({

    latitude: center.lat,
    longitude: center.lng,

    height: this.getCameraHeight(zoom),
    zoom,

    source: 'leaflet'

});

});
  }

  private getCameraHeight(zoom: number): number {
    const baseHeight = 4000000;
    return Math.max(600, baseHeight / Math.pow(2, zoom - 5));
}

  private initializeSynchronization(): void {

    this.mapSyncService.camera$
        .subscribe(camera => {

            if (camera.source === 'leaflet') {
                return;
            }

            this.syncing = true;

            this.map.setView(

                [
                    camera.latitude,
                    camera.longitude
                ],

                camera.zoom ?? this.getZoomFromHeight(camera.height),

                {
                    animate: false
                }

            );

            setTimeout(() => {
    this.syncing = false;
},50);

        });

}

private getZoomFromHeight(height: number): number {
    const baseHeight = 4000000;
    const zoom = 5 + Math.log(baseHeight / height) / Math.log(2);
    return Math.max(1, Math.min(18, Math.round(zoom)));
}

  private getLeafletIcon(path: string): L.Icon {

    if (!this.iconCache.has(path)) {

        this.iconCache.set(
            path,
            L.icon({
                iconUrl: path,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            })
        );

    }

    return this.iconCache.get(path)!;

}

  private initializeTileLayer(): void {
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }
  ).addTo(this.map);
}

    private initializeClickHandler(): void {

  this.map.on('click', (event: L.LeafletMouseEvent) => {

   

const selectedAsset = this.assetSelectionService.selectedAsset();

if (this.assetSelectionService.placing() && selectedAsset) {

    this.placeAsset(
        selectedAsset,
        event.latlng.lat,
        event.latlng.lng
    );

    return;

}

    

  });

}
  
 

   private placeAsset(asset: any, lat: number, lng: number): void {

    const entity = AssetFactory.create(
        asset,
        lat,
        lng
    );

    this.entityService.addEntity(entity);

    console.log("Placed:", entity);
 this.simulationService.selectEntity(entity);
}

  private redrawEntities(): void {
    this.markers.clearLayers();
    for (const entity of this.entityService.entities()) {
      this.drawEntity(entity);
    }
  }

  private drawEntity(entity: Entity): void {

  const style = this.renderService.getStyle(entity);

  let marker: L.Marker;
  console.log(style);
  // Use icon if available
  if (style.icon) {

    marker = L.marker(
      [entity.position.latitude, entity.position.longitude],
      {
        icon: this.getLeafletIcon(style.icon)
      }
    );

  }

  // Otherwise use a colored dot
  else {

    marker = L.marker(
      [entity.position.latitude, entity.position.longitude],
      {
        icon: L.divIcon({
          html: `
            <div style="
              width:14px;
              height:14px;
              border-radius:50%;
              background:${style.color};
              border:2px solid white;
              box-shadow:0 0 5px rgba(0,0,0,0.5);
            "></div>
          `,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      }
    );

  }

  if (style.showLabel) {
    marker.bindTooltip(entity.name, {
      permanent: false,
      direction: 'top'
    });
  }

  marker.on('click', () => {
    this.simulationService.selectEntity(entity);
  });

  marker.addTo(this.markers);

  // ---------------- RADAR ----------------
if (entity.type === EntityType.RadarSite) {

    const searchRange = entity.properties?.["searchRange"];

    if (searchRange) {

        L.circle(
            [
                entity.position.latitude,
                entity.position.longitude
            ],
            {
                radius: searchRange,
                color: 'red',
                weight: 2,
                fillColor: 'red',
                fillOpacity: 0.2
            }
        ).addTo(this.markers);

    }
  }

// ---------------- SAM BATTERY ----------------
else if (entity.type === EntityType.SamBattery) {

    const searchRange =
        entity.properties?.["searchRange"] ??
        Math.sqrt(entity.properties?.["engagementRangeSqr"] ?? 0);

    if (searchRange > 0) {

        // Blue filled engagement area
        L.circle(
            [
                entity.position.latitude,
                entity.position.longitude
            ],
            {
                radius: searchRange,
                color: 'blue',
                weight: 2,
                fillColor: 'blue',
                fillOpacity: 0.15
            }
        ).addTo(this.markers);

        // Blue concentric rings
        const rings = 5;

        for (let i = 1; i <= rings; i++) {

            L.circle(
                [
                    entity.position.latitude,
                    entity.position.longitude
                ],
                {
                    radius: (searchRange / rings) * i,
                    color: 'blue',
                    weight: 1,
                    fill: false,
                    opacity: 0.8
                }
            ).addTo(this.markers);

        }

    }

}
}
}
  