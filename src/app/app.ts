import { Component, signal } from '@angular/core';

import { Toolbar } from './components/toolbar/toolbar';
import { PropertyPanel } from './components/property-panel/property-panel';
import { EntityList } from './components/entity-list/entity-list';
import { MapComponent } from './components/map/map';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Toolbar,
    MapComponent,
    EntityList
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AirDefense');
}