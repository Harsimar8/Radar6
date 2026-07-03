import {
  AfterViewInit,
  Component,
  OnDestroy,
  effect,
  inject
} from '@angular/core';

import { AssetFactory } from '../../../core/asset-library/factories/asset-factory';
import * as Cesium from 'cesium';
import { MapSyncService } from '../../../services/map-sync.service';

import { SimulationService } from '../../../services/simulation.service';
import { EntityService } from '../../../services/entity.service';
import { AssetSelectionService } from '../../../services/asset-selection.service';
import { EntityRenderService } from '../../../core/rendering/entity-render.service';
import { Entity } from '../../../core/models/Entity';

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
  private renderService = inject(EntityRenderService);

  private syncing = false;
  private assetSelectionService = inject(AssetSelectionService);
  constructor() {
  

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

this.initializeSynchronization();
this.initializeCameraSync();

this.drawEntities();

}
   private initializeSynchronization(): void {

  this.mapSyncService.leafletToCesium$
    .subscribe(view => {

      if (this.syncing) {
        return;
      }

      this.syncing = true;

      this.viewer.camera.setView({

        destination: Cesium.Cartesian3.fromDegrees(
          view.longitude,
          view.latitude,
          view.height
        )

      });

      this.syncing = false;

    });

}
     private initializeCameraSync(): void {

  this.viewer.camera.moveEnd.addEventListener(() => {

    const center = new Cesium.Cartesian2(
      this.viewer.canvas.clientWidth / 2,
      this.viewer.canvas.clientHeight / 2
    );

    const ray = this.viewer.camera.getPickRay(center);

    if (!ray) {
      return;
    }

    const cartesian = this.viewer.scene.globe.pick(
      ray,
      this.viewer.scene
    );

    if (!cartesian) {
      return;
    }

    const cartographic =
      Cesium.Cartographic.fromCartesian(cartesian);

    const latitude =
      Cesium.Math.toDegrees(cartographic.latitude);

    const longitude =
      Cesium.Math.toDegrees(cartographic.longitude);

    const height =
      this.viewer.camera.positionCartographic.height;

    const zoom = Math.max(
      1,
      Math.round(Math.log2(20000000 / height))
    );

    if (this.syncing) {
  return;
}

this.mapSyncService.cesiumToLeaflet$.next({

  latitude,
  longitude,
  zoom,
  height

});

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

        const picked = this.viewer.scene.pick(click.position);

        if (Cesium.defined(picked)) {
            return;
        }

        const ray = this.viewer.camera.getPickRay(click.position);

        if (!ray) {
            return;
        }

        const cartesian = this.viewer.scene.globe.pick(
            ray,
            this.viewer.scene
        );

        if (!cartesian) {
            return;
        }

        const cartographic =
            Cesium.Cartographic.fromCartesian(cartesian);

        const latitude =
            Cesium.Math.toDegrees(cartographic.latitude);

        const longitude =
            Cesium.Math.toDegrees(cartographic.longitude);

        const asset =
            this.assetSelectionService.selectedAsset();

        if (asset && this.assetSelectionService.placing()) {

            this.placeAsset(
                asset,
                latitude,
                longitude
            );

            this.assetSelectionService.clear();
        }

    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

}

private placeAsset(asset: any, lat: number, lng: number): void {

    const entity = AssetFactory.create(
        asset,
        lat,
        lng
    );

    this.entityService.addEntity(entity);

    console.log("Placed:", entity);

}

  

   private initializeSelectionHandler(): void {

    const handler = new Cesium.ScreenSpaceEventHandler(
        this.viewer.scene.canvas
    );

    handler.setInputAction((click: any) => {

        const picked = this.viewer.scene.pick(click.position);

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
  


   const style = this.renderService.getStyle(entity);

    const position = Cesium.Cartesian3.fromDegrees(
        entity.position.longitude,
        entity.position.latitude,
        entity.position.altitude
    );
    




    const cesiumEntity: Cesium.Entity.ConstructorOptions = {

        id: entity.id,

        name: entity.name,

        position,

        label: {
            text: entity.name,
            pixelOffset: new Cesium.Cartesian2(0, -22),
            scale: 0.7
        }

    };

    if (style.icon) {

        cesiumEntity.billboard = {

           image: style.icon,

            width: 32,

            height: 32,

            verticalOrigin: Cesium.VerticalOrigin.BOTTOM

        };

    }

    else {

        cesiumEntity.point = {

            pixelSize: 12,

           color: Cesium.Color.fromCssColorString(
    style.color
)

        };

    }

    this.viewer.entities.add(cesiumEntity);

    const searchRange = entity.properties?.["searchRange"];

    if (searchRange) {

        this.viewer.entities.add({

            position,

            ellipse: {

                semiMajorAxis: searchRange,

                semiMinorAxis: searchRange,

                height: 0,

                material: Cesium.Color.fromCssColorString(
    style.color
).withAlpha(0.15),

                outline: true,

                

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