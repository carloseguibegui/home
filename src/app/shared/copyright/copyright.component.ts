import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './copyright.component.html',
  styleUrl: './copyright.component.css'
})
export class CopyrightComponent {
  @Input() marginBotClassAnchor: string = ''; 
  @Input() marginBotClassDiv: string = ''; 
  @Input() cliente: string = ''; 
}
