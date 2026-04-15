import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MareaLandingImages } from '../../marea-landing-images';

export type MareaTraceStage = 's1' | 's2' | 's3';

@Component({
  selector: 'app-marea-traceability-flow',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-traceability-flow.component.html',
  styleUrl: './marea-traceability-flow.component.scss',
})
export class MareaTraceabilityFlowComponent {
  readonly photos = MareaLandingImages.trace;

  selected = signal<MareaTraceStage>('s1');

  select(stage: MareaTraceStage): void {
    this.selected.set(stage);
  }

  isActive(stage: MareaTraceStage): boolean {
    return this.selected() === stage;
  }
}
