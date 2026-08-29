import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { filter, map, startWith } from 'rxjs';
import { MAREA_CHAT_OPEN_EVENT } from '../../../features/landing/components/marea-mary-section/marea-mary-section.component';

@Component({
  selector: 'app-marea-public-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, TranslocoPipe, MatIconModule],
  templateUrl: './marea-public-dock.component.html',
  styleUrl: './marea-public-dock.component.scss',
})
export class MareaPublicDockComponent implements OnInit {
  private router = inject(Router);
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  /** Hide on auth console entry — dock is for public guests. */
  readonly visible = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => !e.urlAfterRedirects.startsWith('/auth')),
      startWith(!this.router.url.startsWith('/auth')),
    ),
    { initialValue: true },
  );

  constructor() {
    effect(() => {
      this.doc.documentElement.classList.toggle(
        'marea-dock-active',
        !!this.visible(),
      );
    });
  }

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.doc.documentElement.classList.remove('marea-dock-active');
    });
  }

  openMary(): void {
    window.dispatchEvent(new CustomEvent(MAREA_CHAT_OPEN_EVENT, { detail: {} }));
  }
}
