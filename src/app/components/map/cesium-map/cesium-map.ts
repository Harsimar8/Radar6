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
                console.log("---------------------------");
                console.log("Cesium received");
                console.log(view);

                this.viewer.camera.setView({

                    destination: Cesium.Cartesian3.fromDegrees(
                        view.longitude,
                        view.latitude,
                        view.height
                    )

                });

                // Wait until camera movement has completely finished
                setTimeout(() => {

                    this.syncing = false;

                }, 300);

            });

    }
    private initializeCameraSync(): void {

        this.viewer.camera.moveEnd.addEventListener(() => {

            if (this.syncing) {
                return;
            }
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

            console.log("---------------------------");
            console.log("Camera Height :", height);
            console.log("Computed Zoom :", zoom);
            console.log("Latitude      :", latitude);
            console.log("Longitude     :", longitude);
            if (this.syncing) {
                return;
            }
            console.log("Broadcasting to Leaflet");
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


    private createRadarPolygon(
    latitude: number,
    longitude: number,
    radius: number
): Cesium.Cartesian3[] {

    const positions: Cesium.Cartesian3[] = [];

    for (let angle = 0; angle <= 360; angle += 2) {

        const radians = Cesium.Math.toRadians(angle);

        const dLat =
            (radius * Math.cos(radians)) / 111320;

        const dLon =
            (radius * Math.sin(radians)) /
            (111320 * Math.cos(
                Cesium.Math.toRadians(latitude)
            ));

        positions.push(
            Cesium.Cartesian3.fromDegrees(
                longitude + dLon,
                latitude + dLat
            )
        );

    }

    return positions;
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

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

            };

        }

        else {

            cesiumEntity.point = {

                pixelSize: 12,

                color: Cesium.Color.fromCssColorString(style.color),

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

            };

        }

        this.viewer.entities.add(cesiumEntity);

        const searchRange = entity.properties?.["searchRange"];

        if (searchRange) {

            this.viewer.entities.add({

                position,

                polygon: {

    hierarchy: new Cesium.PolygonHierarchy(
        this.createRadarPolygon(
            entity.position.latitude,
            entity.position.longitude,
            searchRange
        )
    ),

    material: Cesium.Color.RED.withAlpha(0.25),

    outline: true,

    outlineColor: Cesium.Color.RED,

    classificationType: Cesium.ClassificationType.TERRAIN

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