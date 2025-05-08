import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequetericoComponent } from './requeterico.component';

describe('RequetericoComponent', () => {
  let component: RequetericoComponent;
  let fixture: ComponentFixture<RequetericoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequetericoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequetericoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
