import { Component } from '@angular/core';

import { SimulationService } from '../../services/simulation.service';
import { EntityService } from '../../services/entity.service';
import { KeyValuePipe } from '@angular/common';
import { EditorTool } from '../../core/enums/EditorTool';
import { EntityType } from '../../core/enums/EntityType';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [KeyValuePipe],
  templateUrl: './entity-list.html',
  styleUrl: './entity-list.css',
})
export class EntityList {

  EditorTool = EditorTool;
  EntityType = EntityType;

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

  deleteSelected() {

    const entity = this.simulationService.selectedEntity();

    if (!entity) {
      return;
    }

    this.entityService.removeEntity(entity.id);
    this.simulationService.selectEntity(null);

  }

}