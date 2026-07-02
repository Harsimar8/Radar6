import { Component, computed, effect } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { AssetLibraryService } from '../../core/asset-library/services/asset-library.service';
import { AssetSelectionService } from '../../services/asset-selection.service';

import { Asset } from '../../core/asset-library/models/asset';

interface AssetRoleGroup {
  role: string;
  assets: Asset[];
}

interface AssetTypeGroup {
  entityType: string;
  roles: AssetRoleGroup[];
}

@Component({
  selector: 'app-asset-browser',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './asset-browser.html',
  styleUrl: './asset-browser.css'
})
export class AssetBrowser {

  constructor(
    private assetLibraryService: AssetLibraryService,
    public assetSelectionService: AssetSelectionService
){

     effect(() => {

    console.log("Placement Mode:", this.assetSelectionService.placing());

  });

  }

  expandedCategory = '';

expandedType = '';

expandedRole = '';

  groupedCategories = computed(() => {

  return this.categories().map(category => {

    const groups = new Map<string, Map<string, Asset[]>>();

    for (const asset of category.assets) {

      const entityType = asset.entityType;
      const role = asset.role;

      if (!groups.has(entityType)) {
        groups.set(entityType, new Map());
      }

      const roleMap = groups.get(entityType)!;

      if (!roleMap.has(role)) {
        roleMap.set(role, []);
      }

      roleMap.get(role)!.push(asset);
    }

    return {

      id: category.id,

      name: category.name,

      types: Array.from(groups.entries()).map(([entityType, roleMap]) => ({
        entityType,
        roles: Array.from(roleMap.entries()).map(([role, assets]) => ({
          role,
          assets
        }))
      }))

    };

  });

});

  categories = computed(() =>
    this.assetLibraryService.library()?.categories ?? []
  );

  

  toggleCategory(id: string): void {

  this.expandedCategory =
    this.expandedCategory === id ? '' : id;

}

toggleType(type: string): void {

  this.expandedType =
    this.expandedType === type ? '' : type;

}

toggleRole(role: string): void {

  this.expandedRole =
    this.expandedRole === role ? '' : role;

}

  selectAsset(asset: Asset): void {

    this.assetSelectionService.select(asset);

    console.log(asset);

  }

}