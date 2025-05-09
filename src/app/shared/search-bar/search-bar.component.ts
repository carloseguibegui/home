import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css'
})
export class SearchBarComponent {
  @Input() item_placeholder: string = "";
  @Output() search = new EventEmitter<string>();  // <-- agregamos esta línea

  onInputChange(value: string) {
    this.search.emit(value);
  }
}