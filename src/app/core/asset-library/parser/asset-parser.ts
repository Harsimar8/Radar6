import { AssetNode } from '../models/asset-node';

export class AssetParser {

  static parse(json: any): AssetNode[] {

    return this.parseObject(json);

  }

  private static parseObject(obj: any): AssetNode[] {

    const nodes: AssetNode[] = [];

    for (const key of Object.keys(obj)) {

      const value = obj[key];

      if (this.isAsset(value)) {

        nodes.push({
          id: crypto.randomUUID(),
          name: key,
          type: 'asset',
          properties: value
        });

      } else {

        nodes.push({
          id: crypto.randomUUID(),
          name: key,
          type: 'folder',
          children: this.parseObject(value)
        });

      }

    }

    return nodes;

  }

  private static isAsset(value: any): boolean {

    if (typeof value !== 'object')
      return true;

    if (Array.isArray(value))
      return false;

    return (
      'properties' in value ||
      'entityType' in value ||
      'range' in value ||
      'speed' in value
    );

  }

}