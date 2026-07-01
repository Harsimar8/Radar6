import { Asset } from '../models/asset';

import { Entity } from '../../models/Entity';
import { Aircraft } from '../../models/Aircraft';
import { Radar } from '../../models/Radar';

import { Position } from '../../models/Position';

import { EntityType } from '../../enums/EntityType';

import { IdGenerator } from '../../utils/id-generator';

export class AssetFactory {

    static create(
        asset: Asset,
        latitude: number,
        longitude: number
    ): Entity {

        switch (asset.entityType) {

            case "Aircraft":

                return new Aircraft(
                    IdGenerator.generate("Aircraft"),
                    asset.name,
                    new Position(latitude, longitude, 10000),
                    0,
                    0
                );

            case "RadarSite":

                return new Radar(
                    IdGenerator.generate("Radar"),
                    asset.name,
                    new Position(latitude, longitude, 0),
                    asset.properties["searchRange"] ?? 50000
                );

            default:

                throw new Error(
                    "Unsupported asset type: " + asset.entityType
                );

        }

    }

}