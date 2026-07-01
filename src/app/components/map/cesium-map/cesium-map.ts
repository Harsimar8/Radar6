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
      if (!this.viewer || camera.source === 'cesium') return;

      const height = this.getCameraHeight(camera.zoom);

      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          camera.longitude,
          camera.latitude,
          height
        ),
        duration: 0.1
      });
    });

   effect(() => {
      this.entityService.entities();
      if (this.viewer) {
        this.viewer.entities.removeAll();
        this.drawEntities();
      }
    });

  // 3. Resize handler
    effect(() => {
      this.simulationService.panelMode();
      if (this.viewer) {
        setTimeout(() => {
          this.viewer.resize();
          this.viewer.scene.requestRender();
        }, 50);
      }
    });
  }

    // <-- constructor ends here

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

    this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 200;
    this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000;
    
    this.initializeClickHandler();
    this.initializeSelectionHandler();
    this.initializeCameraSync();
    this.drawEntities();

}

private initializeCameraSync(): void {
  this.viewer.camera.changed.addEventListener(() => {
    // Get the center of the screen
    const center = new Cesium.Cartesian2(
      this.viewer.canvas.clientWidth / 2,
      this.viewer.canvas.clientHeight / 2
    );
    
    const ray = this.viewer.camera.getPickRay(center);
    
    // ADD THIS NULL CHECK: 
    // The compiler needs to know that 'ray' is defined before using it
    if (!Cesium.defined(ray)) {
      return;
    }

    // Now TypeScript knows 'ray' is safe to use
    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    
    if (!cartesian) return;

    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);

    // Get current height for zoom estimation
    const height = this.viewer.camera.positionCartographic.height;
    const zoom = Math.round(Math.log2(20000000 / Math.max(1, height)));

    this.mapSyncService.update(latitude, longitude, zoom, 'cesium');
  });
}

private getCameraHeight(zoom: number): number {
    const heights: { [key: number]: number } = {
        1: 20000000, 2: 10000000, 3: 5000000, 4: 2500000, 5: 1200000,
        6: 600000, 7: 300000, 8: 150000, 9: 75000, 10: 40000,
        11: 20000, 12: 10000, 13: 5000, 14: 2500, 15: 1200, 16: 600
    };
    return heights[zoom] || 300;
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
   
 

  
}