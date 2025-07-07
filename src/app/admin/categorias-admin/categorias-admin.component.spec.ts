import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoriasAdminComponent } from './categorias-admin.component';

describe('CategoriasAdminComponent', () => {
  let component: CategoriasAdminComponent;
  let fixture: ComponentFixture<CategoriasAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoriasAdminComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoriasAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
