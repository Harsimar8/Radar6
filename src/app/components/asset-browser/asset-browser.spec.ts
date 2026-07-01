import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetBrowser } from './asset-browser';

describe('AssetBrowser', () => {
  let component: AssetBrowser;
  let fixture: ComponentFixture<AssetBrowser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetBrowser],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetBrowser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
