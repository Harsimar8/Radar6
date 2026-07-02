import { Component } from '@angular/core';

import { SimulationService } from '../../services/simulation.service';

import { EditorTool } from '../../core/enums/EditorTool';


import { Radar } from '../../core/models/Radar';
import { Aircraft } from '../../core/models/Aircraft';
import { EntityType } from '../../core/enums/EntityType';
import { EntityService } from '../../services/entity.service';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [],
  templateUrl: './entity-list.html',
  styleUrl: './entity-list.css',
})
export class EntityList {

  EditorTool = EditorTool;
  hoveredItem: any = null;
  

  constructor(
  public simulationService: SimulationService,
  private entityService: EntityService
) {}

  select(item: any) {
    this.simulationService.selectedTemplate.set(item);
  }

   showCard(item: any) {

  this.hoveredItem = item;

}

hideCard() {

  this.hoveredItem = null;

}

readonly EntityType = EntityType;

isAircraft(entity: any): boolean {
  return entity.type === EntityType.Aircraft;
}

isRadar(entity: any): boolean {
  return entity.type === EntityType.Radar;
}

aircraft(entity: any): Aircraft {
  return entity as Aircraft;
}

radar(entity: any): Radar {
  return entity as Radar;
}

deleteSelected() {

  const entity = this.simulationService.selectedEntity();

  if (!entity) {
    return;
  }

  this.entityService.removeEntity(entity.id);

  this.simulationService.selectEntity(null);

}
}