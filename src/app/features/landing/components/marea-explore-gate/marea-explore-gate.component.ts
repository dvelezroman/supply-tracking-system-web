import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MAREA_CHAT_OPEN_EVENT } from '../marea-mary-section/marea-mary-section.component';

@Component({
  selector: 'app-marea-explore-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatIconModule],
  templateUrl: './marea-explore-gate.component.html',
  styleUrl: './marea-explore-gate.component.scss',
})
export class MareaExploreGateComponent {
  openMary(): void {
    window.dispatchEvent(new CustomEvent(MAREA_CHAT_OPEN_EVENT, { detail: {} }));
  }
}
