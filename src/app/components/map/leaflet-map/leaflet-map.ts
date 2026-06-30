import {
  AfterViewInit,
  Component,
  effect
} from '@angular/core';

import * as L from 'leaflet';
import { MapSyncService } from '../../../services/map-sync.service';

import { SimulationService } from '../../../services/simulation.service';
import { EntityService } from '../../../services/entity.service';

import { Aircraft } from '../../../core/models/Aircraft';
import { Radar } from '../../../core/models/Radar';
import { Entity } from '../../../core/models/Entity';
import { Position } from '../../../core/models/Position';

import { IdGenerator } from '../../../core/utils/id-generator';

import { EditorTool } from '../../../core/enums/EditorTool';
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

  private aircraftIcon = L.icon({
    iconUrl: 'icons/aircraft.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  private radarIcon = L.icon({
    iconUrl: 'icons/radar.jpg',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

    constructor(
  public simulationService: SimulationService,
  private entityService: EntityService,
  private mapSyncService: MapSyncService
) {

    effect(() => {

      // React whenever the entity list changes
      this.entityService.entities();

      // Map not ready yet
      if (!this.map) {
        return;
      }

      this.redrawEntities();

    });

    effect(() => {

  // Listen for panel mode changes
  this.simulationService.panelMode();

  if (!this.map) {
    return;
  }

  setTimeout(() => {
    this.map.invalidateSize();
  }, 50);

});

    effect(() => {

  const camera = this.mapSyncService.center();

  if (!this.map) {
    return;
  }

  // Ignore updates that originated from Leaflet
  if (camera.source === 'leaflet') {
    return;
  }

  this.map.setView(
    [camera.latitude, camera.longitude],
    camera.zoom,
    {
      animate: false
    }
  );

});

    

  }

  ngAfterViewInit(): void {

    this.initializeMap();

    this.initializeTileLayer();

    this.markers.addTo(this.map);

    this.initializeClickHandler();

    // Draw entities already stored (refresh support)
    this.redrawEntities();

  }

  private initializeMap(): void {

    this.map = L.map('leaflet-map').setView(
      [20.5937, 78.9629],
      5
    );

      this.map.on('moveend zoomend', () => {

  const center = this.map.getCenter();

this.mapSyncService.update(
  center.lat,
  center.lng,
  this.map.getZoom(),
  'leaflet'
);

});

  }

  private initializeTileLayer(): void {

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution: '© OpenStreetMap'
      }
    ).addTo(this.map);

  }

  private initializeClickHandler(): void {

    this.map.on('click', (event: L.LeafletMouseEvent) => {

      switch (this.simulationService.currentTool()) {

        case EditorTool.Aircraft:
          this.placeAircraft(
            event.latlng.lat,
            event.latlng.lng
          );
          break;

        case EditorTool.Radar:
          this.placeRadar(
            event.latlng.lat,
            event.latlng.lng
          );
          break;

      }

    });

  }

  private placeAircraft(lat: number, lng: number): void {

  const selected = this.simulationService.selectedTemplate();

  const aircraft = new Aircraft(

    IdGenerator.generate('Aircraft'),

    selected?.name ?? 'Aircraft',

    new Position(

      lat,

      lng,

      selected?.altitude ?? 10000

    ),

    selected?.speed ?? 0,

    selected?.heading ?? 0

  );

  this.entityService.addEntity(aircraft);

}

   private placeRadar(lat: number, lng: number): void {

  const selected = this.simulationService.selectedTemplate();

  const radar = new Radar(

    IdGenerator.generate('Radar'),

    selected?.name ?? 'Radar',

    new Position(

      lat,

      lng,

      0

    ),

    selected?.range ?? 50000

  );

  this.entityService.addEntity(radar);

}

  private redrawEntities(): void {

    this.markers.clearLayers();

    const entities = this.entityService.entities();

    for (const entity of entities) {

      this.drawEntity(entity);

    }

  }

  private drawEntity(entity: Entity): void {

    let icon = this.aircraftIcon;

    switch (entity.type) {

      case EntityType.Radar:
        icon = this.radarIcon;
        break;

      case EntityType.Aircraft:
      default:
        icon = this.aircraftIcon;
        break;

    }

    const marker = L.marker(
  [
    entity.position.latitude,
    entity.position.longitude
  ],
  {
    icon
  }
);

marker.bindPopup(entity.name);

marker.on('mouseover', () => {
  this.simulationService.selectEntity(entity);
});



marker.addTo(this.markers);

    if (entity.type === EntityType.Radar) {

      this.drawRadarRange(entity as Radar);

    }

  }

  private drawRadarRange(radar: Radar): void {

    L.circle(
      [
        radar.position.latitude,
        radar.position.longitude
      ],
      {
        radius: radar.range,
        color: 'red',
        weight: 2,
        fillOpacity: 0.1
      }
    ).addTo(this.markers);

  }

}