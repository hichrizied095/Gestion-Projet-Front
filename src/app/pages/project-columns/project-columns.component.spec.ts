import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectColumnsComponent } from './project-columns.component';

describe('ProjectColumnsComponent', () => {
  let component: ProjectColumnsComponent;
  let fixture: ComponentFixture<ProjectColumnsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectColumnsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectColumnsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
