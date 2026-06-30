import {
  AfterViewInit,
  Component,
  OnDestroy,
  effect,
  inject
} from '@angular/core';

import * as Cesium from 'cesium';
import { MapSyncService } from '../../../services/map-sync.service';

import { SimulationService } from '../../../services/simulation.service';
import { EntityService } from '../../../services/entity.service';

import { Aircraft } from '../../../core/models/Aircraft';
import { Radar } from '../../../core/models/Radar';
import { Entity } from '../../../core/models/Entity';
import { Position } from '../../../core/models/Position';

import { EditorTool } from '../../../core/enums/EditorTool';
import { EntityType } from '../../../core/enums/EntityType';

import { IdGenerator } from '../../../core/utils/id-generator';

@Component({
  selector: 'app-cesium-map',
  standalone: true,
  templateUrl: './cesium-map.html',
  styleUrl: './cesium-map.css'
})


export class CesiumMapComponent
implements AfterViewInit, OnDestroy {

  private viewer!: Cesium.Viewer;

  private entityService = inject(EntityService);

  private simulationService = inject(SimulationService);

  private mapSyncService = inject(MapSyncService);

  constructor() {

   effect(() => {

  const camera = this.mapSyncService.center();

  if (!this.viewer) return;

  const zoom = camera.zoom;

  const height =
    Math.max(500, 20000000 / Math.pow(2, zoom));

  this.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(
      camera.longitude,
      camera.latitude,
      height
    )
  });

});

effect(() => {

  // Listen for entity changes
  this.entityService.entities();

  if (!this.viewer) {
    return;
  }

  console.log("Refreshing Cesium...");

  this.viewer.entities.removeAll();

  this.drawEntities();

});

effect(() => {

  // Listen for panel mode changes
  this.simulationService.panelMode();

  if (!this.viewer) {
    return;
  }

  setTimeout(() => {

    this.viewer.resize();

    this.viewer.scene.requestRender();

  }, 50);

});

  }   // <-- constructor ends here

   ngAfterViewInit(): void {

    Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzY2ZiMTI4MC0yODcxLTRhN2MtYTVmNi01MmFlYThjMzllODIiLCJpZCI6NDQyMjYxLCJzdWIiOiJIYXJzaW1hcjA4IiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6IlVudGl0bGVkIiwiaWF0IjoxNzgyODAxMjQwfQ.FCFiKY8xR6oixiTfcg9AaQLL3Xb4IidcE-9aInSeQ88";

this.viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
  animation: false,
  timeline: false,
  homeButton: true,
  sceneModePicker: true,
  baseLayerPicker: true,
  navigationHelpButton: false,
  geocoder: false,
});


console.log(this.viewer);
console.log(this.viewer.scene);
console.log(this.viewer.scene.globe);
console.log(this.viewer.scene.terrainProvider);
  this.viewer.scene.globe.depthTestAgainstTerrain = false;
this.viewer.scene.globe.maximumScreenSpaceError = 1.5;
this.viewer.scene.requestRenderMode = false;
this.viewer.scene.globe.depthTestAgainstTerrain = false;
this.viewer.scene.globe.maximumScreenSpaceError = 1.5;

this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 200;
this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000;
   
  this.viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(
    86.9250,
    27.9881,
    12000
  )
});

  this.initializeClickHandler();

  this.initializeSelectionHandler();
  this.initializeCameraSync();

  this.drawEntities();

}
  private initializeClickHandler(): void {

  const handler = new Cesium.ScreenSpaceEventHandler(
    this.viewer.scene.canvas
  );

  handler.setInputAction((click: any) => {
    console.log("Cesium clicked");
    console.log(this.simulationService.currentTool());
    console.log(this.simulationService.selectedTemplate());

    
    // If an existing entity was clicked, don't place a new one
    const picked = this.viewer.scene.pick(click.position);

    if (Cesium.defined(picked)) {
      return;
    }

    const ray = this.viewer.camera.getPickRay(click.position);

console.log("Ray:", ray);

if (!ray) return;

const cartesian = this.viewer.scene.globe.pick(
  ray,
  this.viewer.scene
);

console.log("Cartesian:", cartesian);

if (!cartesian) return;

    const cartographic =
      Cesium.Cartographic.fromCartesian(cartesian);

    const latitude =
      Cesium.Math.toDegrees(cartographic.latitude);

    const longitude =
      Cesium.Math.toDegrees(cartographic.longitude);

    switch (this.simulationService.currentTool()) {

      case EditorTool.Aircraft:
        this.placeAircraft(latitude, longitude);
        break;

      case EditorTool.Radar:
        this.placeRadar(latitude, longitude);
        break;

    }

  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

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

  console.log("Aircraft Added");
  console.log(this.entityService.entities());

}

  private placeRadar(lat: number, lng: number): void {

  const selected =
    this.simulationService.selectedTemplate();

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

    private initializeSelectionHandler(): void {

  const handler = new Cesium.ScreenSpaceEventHandler(
    this.viewer.scene.canvas
  );

  handler.setInputAction((movement: any) => {

    const picked = this.viewer.scene.pick(
      movement.endPosition
    );

    if (!Cesium.defined(picked)) {

      this.simulationService.selectEntity(null);

      return;

    }

    const pickedEntity = picked.id;

    if (!pickedEntity?.id) {
      return;
    }

    const entity = this.entityService
      .entities()
      .find(e => e.id === pickedEntity.id);

    if (entity) {

      this.simulationService.selectEntity(entity);

    }

  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

}

  private drawEntity(entity: Entity): void {

  if (entity.type === EntityType.Aircraft) {

    const aircraft = entity as Aircraft;

    this.viewer.entities.add({

      id: aircraft.id,

      name: aircraft.name,

      position: Cesium.Cartesian3.fromDegrees(
        aircraft.position.longitude,
        aircraft.position.latitude,
        aircraft.position.altitude
      ),

      point: {
        pixelSize: 12,
scaleByDistance: new Cesium.NearFarScalar(
  1.0e2,
  1.5,
  1.0e7,
  0.8
),
        color: Cesium.Color.BLUE
      },

      label: {
        text: aircraft.name,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        scale: 0.7
      }

    });

  }

  else if (entity.type === EntityType.Radar) {

    const radar = entity as Radar;

    this.viewer.entities.add({

      id: radar.id,

      name: radar.name,

      position: Cesium.Cartesian3.fromDegrees(
        radar.position.longitude,
        radar.position.latitude,
        0
      ),

      point: {
        pixelSize: 12,
scaleByDistance: new Cesium.NearFarScalar(
  1.0e2,
  1.5,
  1.0e7,
  0.8
),
        color: Cesium.Color.RED
      },

      label: {
        text: radar.name,
        pixelOffset: new Cesium.Cartesian2(0, -20),
        scale: 0.7
      }

    });

    this.viewer.entities.add({

      position: Cesium.Cartesian3.fromDegrees(
        radar.position.longitude,
        radar.position.latitude
      ),

      ellipse: {
    semiMajorAxis: radar.range,
    semiMinorAxis: radar.range,

    height: 0,

    material: Cesium.Color.RED.withAlpha(0.2),

    outline: true,

    outlineColor: Cesium.Color.RED
}

    });

  }

}
  private drawEntities(): void {

  const entities = this.entityService.entities();

  for (const entity of entities) {

    this.drawEntity(entity);

  }

}

  ngOnDestroy(): void {

    if (this.viewer) {
      this.viewer.destroy();
    }

  }
   private initializeCameraSync(): void {

  this.viewer.camera.changed.addEventListener(() => {

    const cartographic =
      Cesium.Cartographic.fromCartesian(
        this.viewer.camera.position
      );

    const latitude =
      Cesium.Math.toDegrees(cartographic.latitude);

    const longitude =
      Cesium.Math.toDegrees(cartographic.longitude);

    const height =
      cartographic.height;

    const zoom =
      Math.round(
        Math.log2(20000000 / height)
      );

    this.mapSyncService.update(
  latitude,
  longitude,
  zoom,
  'cesium'
);

  });

}

  private getCameraHeight(zoom: number): number {

  switch (zoom) {
    case 1: return 20000000;
    case 2: return 10000000;
    case 3: return 5000000;
    case 4: return 2500000;
    case 5: return 1200000;
    case 6: return 600000;
    case 7: return 300000;
    case 8: return 150000;
    case 9: return 75000;
    case 10: return 40000;
    case 11: return 20000;
    case 12: return 10000;
    case 13: return 5000;
    case 14: return 2500;
    case 15: return 1200;
    case 16: return 600;
    default: return 300;
  }

}

}