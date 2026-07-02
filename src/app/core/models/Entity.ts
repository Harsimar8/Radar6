import { Position } from './Position';
import { EntityType } from '../enums/EntityType';
import { Team } from '../enums/Team';

export abstract class Entity {

   constructor(

    public id: string,

    public name: string,

    public type: EntityType,

    public position: Position,

    public team: Team = Team.Friendly,

    public properties: Record<string, any> = {}

) {}

}