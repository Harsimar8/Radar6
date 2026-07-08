import { Component, computed, effect } from '@angular/core';
import { FilterService } from '../../services/filter.service';
import { Team } from '../../core/enums/Team';
import { AssetLibraryService } from '../../core/asset-library/services/asset-library.service';
import { AssetSelectionService } from '../../services/asset-selection.service';
import { KeyValuePipe } from '@angular/common';
import { Asset } from '../../core/asset-library/models/asset';
import { SimulationService } from '../../services/simulation.service';
import { EntityService } from '../../services/entity.service';

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
  public assetSelectionService: AssetSelectionService,
  public simulationService: SimulationService,
  private entityService: EntityService,
  public filterService: FilterService
){
    effect(() => {
        console.log("Placement Mode:", this.assetSelectionService.placing());
    });
}

  expandedCategory = '';

  expandedType = '';

  expandedRole = '';
  selectedBrowserAsset: Asset | null = null;

  hoveredAsset: Asset | null = null;

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
    this.expandedCategory = this.expandedCategory === id ? '' : id;
  }

  toggleType(type: string): void {
    this.expandedType = this.expandedType === type ? '' : type;
  }

  toggleRole(role: string): void {
    this.expandedRole = this.expandedRole === role ? '' : role;
  }

  showProperties(asset: Asset): void {

  this.hoveredAsset = asset;

}
deleteSelectedEntity(): void {

    const entity = this.simulationService.selectedEntity();

    if (!entity) {
        return;
    }

    this.entityService.removeEntity(entity.id);

    this.simulationService.selectEntity(null);
}

closeSelectedEntity(): void {

    this.simulationService.selectEntity(null);

}
hideProperties(): void {

  this.hoveredAsset = null;

}
  selectAsset(asset: Asset): void {

    console.log("Asset clicked:", asset);

    this.selectedBrowserAsset = asset;

}

cancelPlacement(): void {

    this.selectedBrowserAsset = null;

    this.assetSelectionService.clear();

}
closePreview(): void {

    this.selectedBrowserAsset = null;

}

placeSelectedAsset(): void {

    if (!this.selectedBrowserAsset) {
        return;
    }

    this.assetSelectionService.select(this.selectedBrowserAsset);

    console.log("Placement Mode Started");

}

getCurrentForce(): Team {
    return this.filterService.getSelectedTeam();
}

isBlueForce(): boolean {
    return this.getCurrentForce() === Team.Blue;
}

isRedForce(): boolean {
    return this.getCurrentForce() === Team.Red;
}

}