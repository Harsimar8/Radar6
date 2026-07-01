import { Component, computed, effect } from '@angular/core';

import { AssetLibraryService } from '../../core/asset-library/services/asset-library.service';
import { AssetSelectionService } from '../../services/asset-selection.service';

import { Asset } from '../../core/asset-library/models/asset';

@Component({
  selector: 'app-asset-browser',
  standalone: true,
  imports: [],
  templateUrl: './asset-browser.html',
  styleUrl: './asset-browser.css'
})
export class AssetBrowser {

  constructor(
    private assetLibraryService: AssetLibraryService,
    private assetSelectionService: AssetSelectionService
  ) {

     effect(() => {

    console.log("Placement Mode:", this.assetSelectionService.placing());

  });

  }

  categories = computed(() =>
    this.assetLibraryService.library()?.categories ?? []
  );

  selectAsset(asset: Asset): void {

    this.assetSelectionService.select(asset);

    console.log(asset);

  }

}