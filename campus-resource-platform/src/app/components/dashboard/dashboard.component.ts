import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../layout/navbar/navbar.component';
import { SidebarComponent } from '../layout/sidebar/sidebar.component';
import { BottomNavComponent } from '../layout/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent, BottomNavComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  isMobileDrawerOpen = false;

  openMobileDrawer() {
    this.isMobileDrawerOpen = true;
  }

  closeMobileDrawer() {
    this.isMobileDrawerOpen = false;
  }
}
