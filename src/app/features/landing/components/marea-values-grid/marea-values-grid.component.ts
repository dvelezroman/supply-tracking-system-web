import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-marea-values-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-values-grid.component.html',
  styleUrl: './marea-values-grid.component.scss',
})
export class MareaValuesGridComponent {
  readonly icons = ['travel_explore', 'family_restroom', 'flag', 'star'] as const;
}
