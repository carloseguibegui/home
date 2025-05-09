import { Component, Input } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoriaComponent } from '../categoria/categoria.component';
import { CopyrightComponent } from '../../shared/copyright/copyright.component';



@Component({
  selector: 'app-carta',
  imports: [RouterModule, CommonModule, CopyrightComponent],
  templateUrl: './carta.component.html',
  styleUrl: './carta.component.css'
})
export class CartaComponent {
  // @Input() categorias: any[] = [];
  categorias: any;
  cliente: string = '';
  constructor(private route: ActivatedRoute, categoriaComponent: CategoriaComponent) {
    this.categorias = categoriaComponent.data
  }

  ngOnInit(): void {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
  }
}