export interface Asset {

    id: string;

    name: string;

    entityType: string;

    role: string;

    properties: Record<string, any>;

    icon?: string;

    color?: string;

}