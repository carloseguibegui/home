import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  @Input() item_placeholder: string = "";
  @Output() search = new EventEmitter<string>();  // <-- agregamos esta línea
  cliente: string = '';
  searchTerm: string = '';
  constructor(private route: ActivatedRoute) { }
  ngOnInit() {
    this.cliente = this.route.snapshot.paramMap.get('cliente') || '';
    this.searchTerm = ''; // Esto borra el input al iniciar
    this.search.emit('');
  }
  onInputChange(value: string) {
    this.search.emit(value);
  }
  get clienteClass(): string {
    return `cliente-${this.cliente.toLowerCase()}`;
  }
}