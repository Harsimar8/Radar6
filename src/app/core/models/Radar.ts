import { Entity } from './Entity';
import { EntityType } from '../enums/EntityType';
import { Position } from './Position';
import { Team } from '../enums/Team';

export class Radar extends Entity {

  constructor(

    id: string,

    name: string,

    position: Position,

    public range: number = 50000,

    team: Team = Team.Friendly

  ) {

    super(

      id,

      name,

      EntityType.RadarSite,

      position,

      team

    );

  }

}