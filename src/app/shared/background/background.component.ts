import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-background',
  imports: [CommonModule],
  templateUrl: './background.component.html',
  styleUrl: './background.component.css'
})
export class BackgroundComponent {
  @Input() imageUrl: string = '';
}
