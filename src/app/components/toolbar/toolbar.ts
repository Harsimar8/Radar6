import { Component,computed } from '@angular/core';

import { SimulationService } from '../../services/simulation.service';
import { AssetLibraryService } from '../../core/asset-library/services/asset-library.service';
import { EditorTool } from '../../core/enums/EditorTool';
import { ViewMode } from '../../core/enums/ViewMode';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css'
})
export class Toolbar {

  EditorTool = EditorTool;
  ViewMode = ViewMode;

  constructor(public simulationService: SimulationService, public assetLibraryService: AssetLibraryService) {}
  categories = computed(() =>
    this.assetLibraryService.library()?.categories ?? []
);

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (!input.files?.length)
        return;

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {

        try {

           const json = JSON.parse(reader.result as string);

this.assetLibraryService.setLibrary(json);

console.log("Library uploaded successfully.");

console.log(this.assetLibraryService.library());

        }
        catch (e) {

            alert("Invalid JSON");

        }

    };

    reader.readAsText(file);

}
}