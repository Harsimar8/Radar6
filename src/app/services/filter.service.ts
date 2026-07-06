import { Injectable, signal } from '@angular/core';
import { Team } from '../core/enums/Team';
import { EntityType } from '../core/enums/EntityType';

@Injectable({
  providedIn: 'root'
})
export class FilterService {

  readonly filters = signal(
    new Map<EntityType, boolean>(
      Object.values(EntityType).map(type => [type, true])
    )
  );

  readonly teamFilters = signal(
  new Map<Team, boolean>(
    Object.values(Team).map(team => [team, true])
  )
);

  readonly teamHighlights = signal(
    new Map<Team, boolean>(
      Object.values(Team).map(team => [team, false])
    )
  );

  isVisible(type: EntityType): boolean {
    return this.filters().get(type) ?? true;
  }

  setVisible(type: EntityType, visible: boolean): void {

    const updated = new Map(this.filters());

    updated.set(type, visible);

    this.filters.set(updated);

  }

  isTeamVisible(team: Team): boolean {
    return this.teamFilters().get(team) ?? true;
  }

  setTeamVisible(team: Team, visible: boolean): void {
    const updated = new Map(this.teamFilters());
    updated.set(team, visible);
    this.teamFilters.set(updated);
  }

  isTeamHighlighted(team: Team): boolean {
    return this.teamHighlights().get(team) ?? false;
  }

  setTeamHighlighted(team: Team, highlighted: boolean): void {
    const updated = new Map(this.teamHighlights());
    updated.set(team, highlighted);
    this.teamHighlights.set(updated);
  }

  toggleTeamHighlighted(team: Team): void {
    this.setTeamHighlighted(team, !this.isTeamHighlighted(team));
  }
}