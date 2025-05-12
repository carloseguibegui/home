// menu.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private data: any[] = [];
  private menuData = new BehaviorSubject<any[]>([]);
  menuData$ = this.menuData.asObservable();

  constructor(private http: HttpClient) { }

  loadMenu(cliente: string) {
    return this.http.get<any[]>(`/assets/clientes/${cliente}/menu.json`)
      .subscribe({
        next: (data) => {
          this.menuData.next(data);
          console.log('-----',this.data)
        },
        error: (error) => {
          console.error('Error cargando menú:', error);
          this.menuData.next([]);
        }
      });
  }

  getCategorias() {
    return this.data;
  }
}
