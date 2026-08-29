import { Injectable, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslocoService } from '@jsverse/transloco';

@Injectable()
export class TranslocoPaginatorIntl extends MatPaginatorIntl {
  private readonly transloco = inject(TranslocoService);

  constructor() {
    super();
    this.applyLabels();
    this.transloco.langChanges$.subscribe(() => this.applyLabels());
  }

  private applyLabels(): void {
    const t = (key: string) => this.transloco.translate(key);
    this.itemsPerPageLabel = t('common.paginator.itemsPerPage');
    this.nextPageLabel = t('common.paginator.nextPage');
    this.previousPageLabel = t('common.paginator.previousPage');
    this.firstPageLabel = t('common.paginator.firstPage');
    this.lastPageLabel = t('common.paginator.lastPage');
    this.getRangeLabel = (page: number, pageSize: number, length: number) => {
      if (length === 0 || pageSize === 0) {
        return t('common.paginator.rangeEmpty').replace('{{length}}', `${length}`);
      }
      const start = page * pageSize + 1;
      const end = Math.min((page + 1) * pageSize, length);
      return t('common.paginator.range')
        .replace('{{start}}', `${start}`)
        .replace('{{end}}', `${end}`)
        .replace('{{length}}', `${length}`);
    };
    this.changes.next();
  }
}
