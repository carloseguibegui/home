import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import * as authModule from '@angular/fire/auth';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    spyOn(authModule, 'authState').and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows an inline error message when login fails', async () => {
    spyOn(authModule, 'signInWithEmailAndPassword').and.rejectWith(new Error('bad credentials'));

    component.email = 'user@example.com';
    component.password = 'wrong-password';
    component.onLogin();
    await fixture.whenStable();

    expect(component.errorMessage).toContain('No se pudo iniciar sesión');
    expect(component.successMessage).toBe('');
  });

  it('shows a success message after a successful registration', async () => {
    component.isLogin = false;
    component.email = 'new@example.com';
    component.password = 'password123';
    component.confirmPassword = 'password123';
    spyOn(authModule, 'createUserWithEmailAndPassword').and.resolveTo({} as any);

    component.onRegister();
    await fixture.whenStable();

    expect(component.isLogin).toBeTrue();
    expect(component.successMessage).toContain('Registro exitoso');
    expect(component.errorMessage).toBe('');
  });
});
