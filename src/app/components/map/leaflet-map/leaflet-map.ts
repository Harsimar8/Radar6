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
    this.map = L.map('leaflet-map').setView([20.5937, 78.9629], 5);

    // Only emit to service on user-initiated events
     this.map.on('moveend zoomend', () => {

  if (this.syncing) {
    return;
  }

  const center = this.map.getCenter();

console.log("---------------------------");
console.log("Leaflet Zoom :", this.map.getZoom());
console.log("Leaflet Lat  :", center.lat);
console.log("Leaflet Lng  :", center.lng);
console.log("Height Sent  :", 20000000 / Math.pow(2, this.map.getZoom()));

  console.log("Leaflet Zoom:", this.map.getZoom());

  this.mapSyncService.leafletToCesium$.next({

    latitude: center.lat,
    longitude: center.lng,
    zoom: this.map.getZoom(),
     height: this.getCameraHeight(this.map.getZoom())

  });

});
  }

  private getCameraHeight(zoom: number): number {

    const heights: { [key: number]: number } = {

        1: 38000000,
        2: 22000000,
        3: 12000000,
        4: 7000000,
        5: 4000000,
        6: 2200000,
        7: 1200000,
        8: 600000,
        9: 300000,
        10: 150000,
        11: 80000,
        12: 40000,
        13: 20000,
        14: 10000,
        15: 5000,
        16: 2500,
        17: 1200,
        18: 600

    };

    return heights[zoom] ?? 38000000;

}

   private initializeSynchronization(): void {

  this.mapSyncService.cesiumToLeaflet$
    .subscribe(view => {

      if (this.syncing) {
        return;
      }

      this.syncing = true;

      this.map.setView(
        [view.latitude, view.longitude],
        view.zoom,
        {
          animate: false
        }
      );

      // Wait until Leaflet has finished moving
      setTimeout(() => {
        this.syncing = false;
      }, 100);

    });

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

  const searchRange = entity.properties?.["searchRange"];

if (searchRange) {

    L.circle(
        [
            entity.position.latitude,
            entity.position.longitude
        ],
        {
            radius: searchRange,
            color: style.color,
            weight: 2,
            fillColor: style.color,
            fillOpacity: 0.15
        }
    ).addTo(this.markers);

}

}
}
  