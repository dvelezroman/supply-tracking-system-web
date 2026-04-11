import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../features/auth/services/auth.service';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';

@Component({
  selector: 'app-main-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    LanguageToggleComponent,
  ],
  templateUrl: './main-shell.component.html',
  styleUrl: './main-shell.component.scss',
})
export class MainShellComponent implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  protected authService = inject(AuthService);

  sidenavOpen = signal(true);
  isMobile = signal(false);

  currentUser = this.authService.currentUser;
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  readonly navItems = [
    { labelKey: 'shell.nav.dashboard', icon: 'dashboard', route: '/dashboard' },
    { labelKey: 'shell.nav.products', icon: 'inventory_2', route: '/products' },
    { labelKey: 'shell.nav.actors', icon: 'groups', route: '/actors' },
    { labelKey: 'shell.nav.lots', icon: 'view_list', route: '/lots' },
    { labelKey: 'shell.nav.traceability', icon: 'route', route: '/traceability' },
    {
      labelKey: 'shell.nav.users',
      icon: 'manage_accounts',
      route: '/users',
      adminOnly: true,
    },
  ];

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
        this.sidenavOpen.set(!result.matches);
      });
  }

  toggleSidenav(): void {
    this.sidenavOpen.set(!this.sidenavOpen());
  }

  logout(): void {
    this.authService.logout();
  }
}
