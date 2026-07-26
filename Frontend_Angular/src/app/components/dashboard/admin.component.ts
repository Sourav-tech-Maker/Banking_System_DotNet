import { Component } from '@angular/core';
import { AdminLayoutComponent } from './admin/admin-layout.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [AdminLayoutComponent],
  template: `<app-admin-layout />`
})
export class AdminPanelComponent {}
