import { Component } from '@angular/core';
import { CheckInComponent } from './pages/check-in/check-in.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CheckInComponent],
  template: '<app-check-in />'
})
export class AppComponent {}
