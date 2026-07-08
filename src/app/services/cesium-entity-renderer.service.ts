import { Injectable, inject } from '@angular/core';
import * as Cesium from 'cesium';
import { Team } from '../core/enums/Team';
import { Entity } from '../core/models/Entity';
import { EntityType } from '../core/enums/EntityType';
import { EntityRenderService } from '../core/rendering/entity-render.service';
@Injectable({
    providedIn: 'root'
})
export class CesiumEntityRendererService {

    private renderService = inject(EntityRenderService);

    draw(
        viewer: Cesium.Viewer,
        entity: Entity,
        highlighted = false
    ): void {

        console.log(entity.name);
        console.log(entity.properties);

        const style = this.renderService.getStyle(entity);

        const position = this.isGroundEntity(entity)
            ? Cesium.Cartesian3.fromDegrees(
                entity.position.longitude,
                entity.position.latitude,
                0
            )
            : Cesium.Cartesian3.fromDegrees(
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

    show: true,

    font: '14px Arial',

   fillColor:
    entity.team === Team.Blue
        ? Cesium.Color.DEEPSKYBLUE
        : entity.team === Team.Red
        ? Cesium.Color.RED
        : Cesium.Color.WHITE,

    outlineColor: Cesium.Color.WHITE,

    outlineWidth: 2,

    style: Cesium.LabelStyle.FILL_AND_OUTLINE,

    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,

    pixelOffset: new Cesium.Cartesian2(50,0),

    disableDepthTestDistance: Number.POSITIVE_INFINITY
},
        properties: new Cesium.PropertyBag({

    ...(entity.properties ?? {}),

    team: entity.team

})

        };

        if (style.icon) {

            cesiumEntity.billboard = {

                image: style.icon,

                width: highlighted ? 48 : 36,

                height: highlighted ? 48 : 36,

                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,

                color: Cesium.Color.WHITE

            };

        }
        else {

            cesiumEntity.point = {

                pixelSize: highlighted ? 16 : 12,

                color: Cesium.Color.fromCssColorString(style.color),

                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND

            };

        }

        viewer.entities.add(cesiumEntity);

        

this.drawCoverage(
    viewer,
    entity,
    position
);
    }


   private drawRadarCoverage(
    viewer: Cesium.Viewer,
    entity: Entity,
    position: Cesium.Cartesian3,
    searchRange: number
): void {

    viewer.entities.add({

        position,

        ellipse: {

            semiMajorAxis: searchRange,
            semiMinorAxis: searchRange,

            height: 0,

            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,

            material: Cesium.Color.RED.withAlpha(0.25),

            outline: true,

            outlineColor: Cesium.Color.RED

        }

    });

}

private drawSamCoverage(
    viewer: Cesium.Viewer,
    position: Cesium.Cartesian3,
    searchRange: number
): void {

    viewer.entities.add({

        position,

        ellipsoid: {

            radii: new Cesium.Cartesian3(
    searchRange * 0.6,
    searchRange * 0.6,
    searchRange * 0.6
),

            maximumCone: Cesium.Math.PI_OVER_TWO,

            material: Cesium.Color.BLUE.withAlpha(0.25),

            outline: true,

            outlineColor: Cesium.Color.CYAN

        }

    });

}
private drawRadarSector(
    viewer: Cesium.Viewer,
    entity: Entity,
    searchRange: number
): void {

    const heading = entity.properties?.["radarHeading"] ?? 0;
    const beamWidth = entity.properties?.["beamWidth"] ?? 40;

    const positions: Cesium.Cartesian3[] = [];

    // Center point
    positions.push(
        Cesium.Cartesian3.fromDegrees(
            entity.position.longitude,
            entity.position.latitude,
            searchRange * 0.15
        )
    );

    const start = heading - beamWidth / 2;
    const end = heading + beamWidth / 2;

    for (let angle = start; angle <= end; angle += 2) {

        const rad = Cesium.Math.toRadians(angle);

        const dLat =
            (searchRange * 0.6 * Math.cos(rad)) / 111320;

        const dLon =
            (searchRange * 0.6 * Math.sin(rad)) /
            (111320 * Math.cos(
                Cesium.Math.toRadians(entity.position.latitude)
            ));

        positions.push(
            Cesium.Cartesian3.fromDegrees(
                entity.position.longitude + dLon,
                entity.position.latitude + dLat,
                searchRange * 0.15
            )
        );
    }

    viewer.entities.add({

        polygon: {

            hierarchy: positions,

            material: Cesium.Color.LIME.withAlpha(0.55),

            perPositionHeight: true

        }

    });

}
    private isGroundEntity(entity: Entity): boolean {

        return entity.type === EntityType.RadarSite ||
               entity.type === EntityType.SamBattery;

    }
    private drawCoverage(
    viewer: Cesium.Viewer,
    entity: Entity,
    position: Cesium.Cartesian3
): void {

    const searchRange =
        entity.properties?.["searchRange"] ??
        Math.sqrt(entity.properties?.["engagementRangeSqr"] ?? 0);

    if (!searchRange) {
        return;
    }

    if (entity.type === EntityType.RadarSite) {

        this.drawRadarCoverage(
            viewer,
            entity,
            position,
            searchRange
        );

    }

    else if (entity.type === EntityType.SamBattery) {

        this.drawSamCoverage(
        viewer,
        position,
        searchRange
    );

    this.drawRadarSector(
        viewer,
        entity,
        searchRange
    );

    }

}

private drawRadarCone(
    viewer: Cesium.Viewer,
    position: Cesium.Cartesian3,
    searchRange: number
): void {

    viewer.entities.add({

        position: position,

        cylinder: {

            length: searchRange * 0.6,

            topRadius: 0,

            bottomRadius: searchRange * 0.15,

            material: Cesium.Color.LIME.withAlpha(0.45),

            outline: false

        }

    });

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
                (111320 * Math.cos(Cesium.Math.toRadians(latitude)));

            positions.push(
                Cesium.Cartesian3.fromDegrees(
                    longitude + dLon,
                    latitude + dLat
                )
            );

        }

        return positions;

    }

}