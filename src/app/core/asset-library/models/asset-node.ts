export interface AssetNode {

    id: string;

    name: string;

    type: 'folder' | 'asset';

    children?: AssetNode[];

    properties?: Record<string, any>;

}