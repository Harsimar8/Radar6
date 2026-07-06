import { Team } from '../../enums/Team';

export interface Asset {

    id: string;

    name: string;

    entityType: string;

    role: string;

    team?: Team;

    properties: Record<string, any>;

    icon?: string;

    color?: string;

}