import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ActorsService } from '../services/actors.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { TranslocoService } from '@jsverse/transloco';
import type { Actor } from '../../../core/models/actor.model';

@Component({
  selector: 'app-actors-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './actors-list.component.html',
  styleUrl: './actors-list.component.scss',
})
export class ActorsListComponent implements OnInit {
  private actorsService = inject(ActorsService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  actors = signal<Actor[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  readonly columns = ['name', 'type', 'location', 'contact', 'createdAt', 'actions'];

  /** Uses i18n `actorTypes.*` with a readable fallback if a new enum value appears. */
  actorTypeLabel(type: string): string {
    const key = `actorTypes.${type}`;
    const out = this.transloco.translate(key);
    return out === key ? type.replace(/_/g, ' ') : out;
  }

  ngOnInit(): void {
    this.loadActors();
  }

  loadActors(): void {
    this.isLoading.set(true);
    this.actorsService
      .getAll(this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.actors.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadActors();
  }

  deleteActor(actor: Actor): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('actors.deleteTitle'),
        message: this.transloco.translate('actors.deleteConfirm', { name: actor.name }),
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.actorsService.delete(actor.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('actors.deleteSuccess'));
          this.loadActors();
        },
      });
    });
  }
}
