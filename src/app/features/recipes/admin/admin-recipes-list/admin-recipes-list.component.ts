import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import type { RecipeListItem, RecipeStatus } from '../../models/recipe.model';
import { RecipesAdminApiService } from '../../services/recipes-api.service';

@Component({
  selector: 'app-admin-recipes-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-recipes-list.component.html',
  styleUrl: './admin-recipes-list.component.scss',
})
export class AdminRecipesListComponent implements OnInit {
  private api = inject(RecipesAdminApiService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  isImporting = signal(false);
  recipes = signal<RecipeListItem[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchTerm = signal('');
  statusFilter = signal<RecipeStatus | ''>('');
  importQuery = signal('shrimp');
  importUrl = signal('');

  readonly statuses: RecipeStatus[] = [
    'DRAFT',
    'PENDING_REVIEW',
    'PUBLISHED',
    'ARCHIVED',
  ];
  readonly columns = [
    'name',
    'category',
    'status',
    'likes',
    'source',
    'updatedAt',
    'actions',
  ];
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.load();
      });
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  onStatusChange(value: RecipeStatus | ''): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.load();
  }

  onPage(ev: PageEvent): void {
    this.currentPage.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api
      .list({
        page: this.currentPage(),
        limit: this.pageSize(),
        q: this.searchTerm() || undefined,
        status: this.statusFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.recipes.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  publish(row: RecipeListItem): void {
    this.api.setStatus(row.id, 'PUBLISHED').subscribe({
      next: () => {
        this.snackbar.success(
          this.transloco.translate('recipes.admin.publishedOk'),
        );
        this.load();
      },
    });
  }

  archive(row: RecipeListItem): void {
    this.api.setStatus(row.id, 'ARCHIVED').subscribe({
      next: () => {
        this.snackbar.success(
          this.transloco.translate('recipes.admin.archivedOk'),
        );
        this.load();
      },
    });
  }

  reindex(row: RecipeListItem): void {
    this.api.reindex(row.id).subscribe({
      next: () =>
        this.snackbar.success(
          this.transloco.translate('recipes.admin.reindexOk'),
        ),
      error: () =>
        this.snackbar.error(
          this.transloco.translate('recipes.admin.reindexFail'),
        ),
    });
  }

  confirmDelete(row: RecipeListItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('recipes.admin.deleteTitle'),
        message: this.transloco.translate('recipes.admin.deleteMessage', {
          name: row.name,
        }),
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.remove(row.id).subscribe({
        next: () => {
          this.snackbar.success(
            this.transloco.translate('recipes.admin.deletedOk'),
          );
          this.load();
        },
      });
    });
  }

  runImportApi(): void {
    this.isImporting.set(true);
    this.api.importApi(this.importQuery().trim() || 'shrimp').subscribe({
      next: (res) => {
        this.isImporting.set(false);
        this.snackbar.success(
          this.transloco.translate('recipes.admin.importApiOk', {
            count: res.data.createdCount,
          }),
        );
        this.load();
      },
      error: () => this.isImporting.set(false),
    });
  }

  runImportUrl(): void {
    const url = this.importUrl().trim();
    if (!url) return;
    this.isImporting.set(true);
    this.api.importUrl(url).subscribe({
      next: () => {
        this.isImporting.set(false);
        this.snackbar.success(
          this.transloco.translate('recipes.admin.importUrlOk'),
        );
        this.importUrl.set('');
        this.load();
      },
      error: () => this.isImporting.set(false),
    });
  }
}
