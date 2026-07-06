import { Injectable } from '@angular/core';
import { Entity } from '../models/Entity';
import { EntityStyle } from './entity-style';
import { EntityType } from '../enums/EntityType'; // <-- adjust path if needed

export interface RenderStyle {
  icon?: string;
  color: string;
  showLabel: boolean;
  showRange: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EntityRenderService {

  private readonly styles: Record<EntityType, RenderStyle> = {

    [EntityType.Aircraft]: {
      icon: 'icons/aircraft.png',
      color: '#1976d2',
      showLabel: true,
      showRange: false
    },

    [EntityType.RadarSite]: {
      icon: 'icons/radar.png',
      color: '#d32f2f',
      showLabel: true,
      showRange: true
    },

    [EntityType.Ship]: {
      color: '#0097a7',
      showLabel: true,
      showRange: false
    },

    [EntityType.GroundTarget]: {
      color: '#ef6c00',
      showLabel: true,
      showRange: false
    },

    [EntityType.Missile]: {
      color: '#fbc02d',
      showLabel: false,
      showRange: false
    },

    [EntityType.SamBattery]: {
      icon: 'icons/sam.png',
      color: '#43a047',
      showLabel: true,
      showRange: true
    },

    [EntityType.AWACS]: {
      color: '#7b1fa2',
      showLabel: true,
      showRange: true
    },

    [EntityType.UAV]: {
      color: '#5e35b1',
      showLabel: true,
      showRange: false
    }
  };

  getStyle(entity: Entity): EntityStyle {

    console.log('Rendering entity:', entity);
    console.log('Entity type:', entity.type);

    switch (entity.type) {

      case EntityType.Aircraft:
        return {
          icon: 'icons/aircraft.png',
          color: '#1976d2',
          size: 18,
          showLabel: true,
          showRange: false
        };

      case EntityType.RadarSite:
        return {
          icon: 'icons/radar.png',
          color: '#d32f2f',
          size: 18,
          showLabel: true,
          showRange: true
        };

      case EntityType.Ship:
        return {
          color: '#0097a7',
          size: 18,
          showLabel: true,
          showRange: false
        };

      case EntityType.GroundTarget:
        return {
          color: '#ef6c00',
          size: 18,
          showLabel: true,
          showRange: false
        };

      case EntityType.Missile:
        return {
          color: '#fbc02d',
          size: 18,
          showLabel: false,
          showRange: false
        };

      case EntityType.SamBattery:
        return {
          icon: 'icons/sam.png', 
          color: '#43a047',
          size: 18,
          showLabel: true,
          showRange: true
        };

      case EntityType.AWACS:
        return {
          color: '#7b1fa2',
          size: 18,
          showLabel: true,
          showRange: true
        };

      case EntityType.UAV:
        return {
          color: '#5e35b1',
          size: 18,
          showLabel: true,
          showRange: false
        };

      default:
        console.warn('Unknown entity type:', entity.type);

        return {
          color: '#616161',
          size: 18,
          showLabel: true,
          showRange: false
        };
    }
  }
}