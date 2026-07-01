import { Injectable, signal } from '@angular/core';
import { AssetLibrary } from '../models/asset-library';

@Injectable({
  providedIn: 'root'
})
export class AssetLibraryService {

  private readonly _library = signal<AssetLibrary | null>(null);

  readonly library = this._library.asReadonly();

  setLibrary(library: AssetLibrary): void {

      this._library.set(library);

  }

  clear(): void {

      this._library.set(null);

  }

}