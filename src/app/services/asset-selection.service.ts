import { Injectable, signal } from '@angular/core';
import { Asset } from '../core/asset-library/models/asset';

@Injectable({
  providedIn: 'root'
})
export class AssetSelectionService {

  private readonly _selectedAsset = signal<Asset | null>(null);

  readonly selectedAsset = this._selectedAsset.asReadonly();

  private readonly _placing = signal(false);

  readonly placing = this._placing.asReadonly();

  select(asset: Asset): void {

    this._selectedAsset.set(asset);

    this._placing.set(true);

}

clear(): void {

    this._selectedAsset.set(null);

    this._placing.set(false);

}





}