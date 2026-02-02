import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GanttModalComponent } from './gantt-modal.component';

describe('GanttModalComponent', () => {
  let component: GanttModalComponent;
  let fixture: ComponentFixture<GanttModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GanttModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GanttModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
