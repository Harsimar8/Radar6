import { Component, signal } from '@angular/core';

import { Toolbar } from './components/toolbar/toolbar';

import { MapComponent } from './components/map/map';
import { AssetBrowser } from './components/asset-browser/asset-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Toolbar,
    AssetBrowser,
    MapComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('AirDefense');
}