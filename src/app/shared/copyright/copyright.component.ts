import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-copyright',
  imports: [RouterLink],
  templateUrl: './copyright.component.html',
  styleUrl: './copyright.component.css'
})
export class CopyrightComponent {
  @Input() marginBotClassAnchor: string = ''; // valor por defecto
  @Input() marginBotClassDiv: string = ''; // valor por defecto
}