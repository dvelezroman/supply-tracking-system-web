import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import type {
  RecipeIngredient,
  RecipeStatus,
  RecipeStep,
  RecipeUpsertPayload,
} from '../../models/recipe.model';
import { RecipesAdminApiService } from '../../services/recipes-api.service';

const PRESENTATIONS = [
  'SHELL_ON',
  'BUTTERFLY',
  'PD_TAIL_OFF',
  'PD_TAIL_ON',
] as const;

const STATUSES: RecipeStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
];

@Component({
  selector: 'app-admin-recipe-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-recipe-form.component.html',
  styleUrl: './admin-recipe-form.component.scss',
})
export class AdminRecipeFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private api = inject(RecipesAdminApiService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);
  isReindexing = signal(false);
  chunkCount = signal(0);
  likeCount = signal(0);

  readonly presentations = PRESENTATIONS;
  readonly statuses = STATUSES;

  form = this.fb.group({
    name: ['', Validators.required],
    slug: [''],
    description: [''],
    category: [''],
    cuisine: [''],
    region: [''],
    language: ['es'],
    difficulty: [''],
    prepMinutes: [null as number | null],
    cookMinutes: [null as number | null],
    servings: [null as number | null],
    tips: [''],
    techniquesCsv: [''],
    tagsCsv: [''],
    allergensCsv: [''],
    dietaryTagsCsv: [''],
    suitablePresentations: [[] as string[]],
    imageUrl: [''],
    sourceType: ['MANUAL'],
    sourceUrl: [''],
    sourceName: [''],
    attribution: [''],
    license: [''],
    status: ['DRAFT' as RecipeStatus],
    ingredients: this.fb.array([this.createIngredientGroup()]),
    steps: this.fb.array([this.createStepGroup(1)]),
  });

  get ingredients(): FormArray {
    return this.form.get('ingredients') as FormArray;
  }

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.api.getById(this.id!).subscribe({
        next: (res) => {
          const r = res.data;
          this.chunkCount.set(r._count?.chunks ?? 0);
          this.likeCount.set(r.likeCount ?? 0);
          while (this.ingredients.length) this.ingredients.removeAt(0);
          while (this.steps.length) this.steps.removeAt(0);

          const ings = (r.ingredients ?? []) as RecipeIngredient[];
          if (ings.length) {
            ings.forEach((i) => this.ingredients.push(this.createIngredientGroup(i)));
          } else {
            this.ingredients.push(this.createIngredientGroup());
          }

          const st = (r.steps ?? []) as RecipeStep[];
          if (st.length) {
            st
              .slice()
              .sort((a, b) => a.order - b.order)
              .forEach((s) => this.steps.push(this.createStepGroup(s.order, s.text)));
          } else {
            this.steps.push(this.createStepGroup(1));
          }

          this.form.patchValue({
            name: r.name,
            slug: r.slug,
            description: r.description ?? '',
            category: r.category ?? '',
            cuisine: r.cuisine ?? '',
            region: r.region ?? '',
            language: r.language ?? 'es',
            difficulty: r.difficulty ?? '',
            prepMinutes: r.prepMinutes ?? null,
            cookMinutes: r.cookMinutes ?? null,
            servings: r.servings ?? null,
            tips: r.tips ?? '',
            techniquesCsv: (r.techniques ?? []).join(', '),
            tagsCsv: (r.tags ?? []).join(', '),
            allergensCsv: (r.allergens ?? []).join(', '),
            dietaryTagsCsv: (r.dietaryTags ?? []).join(', '),
            suitablePresentations: r.suitablePresentations ?? [],
            imageUrl: r.imageUrl ?? '',
            sourceType: r.sourceType,
            sourceUrl: r.sourceUrl ?? '',
            sourceName: r.sourceName ?? '',
            attribution: r.attribution ?? '',
            license: r.license ?? '',
            status: r.status,
          });
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  createIngredientGroup(i?: RecipeIngredient) {
    return this.fb.group({
      name: [i?.name ?? '', Validators.required],
      qty: [i?.qty ?? ''],
      unit: [i?.unit ?? ''],
      notes: [i?.notes ?? ''],
    });
  }

  createStepGroup(order: number, text = '') {
    return this.fb.group({
      order: [order, Validators.required],
      text: [text, Validators.required],
    });
  }

  addIngredient(): void {
    this.ingredients.push(this.createIngredientGroup());
  }

  removeIngredient(index: number): void {
    if (this.ingredients.length <= 1) return;
    this.ingredients.removeAt(index);
  }

  addStep(): void {
    this.steps.push(this.createStepGroup(this.steps.length + 1));
  }

  removeStep(index: number): void {
    if (this.steps.length <= 1) return;
    this.steps.removeAt(index);
    this.steps.controls.forEach((c, i) => c.patchValue({ order: i + 1 }));
  }

  private splitCsv(value: string | null | undefined): string[] {
    return (value ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private toPayload(): RecipeUpsertPayload {
    const raw = this.form.getRawValue();
    return {
      name: raw.name!.trim(),
      slug: raw.slug?.trim() || undefined,
      description: raw.description?.trim() || undefined,
      category: raw.category?.trim() || undefined,
      cuisine: raw.cuisine?.trim() || undefined,
      region: raw.region?.trim() || undefined,
      language: raw.language?.trim() || 'es',
      difficulty: raw.difficulty?.trim() || undefined,
      prepMinutes: raw.prepMinutes != null ? Number(raw.prepMinutes) : null,
      cookMinutes: raw.cookMinutes != null ? Number(raw.cookMinutes) : null,
      servings: raw.servings != null ? Number(raw.servings) : null,
      tips: raw.tips?.trim() || undefined,
      techniques: this.splitCsv(raw.techniquesCsv),
      tags: this.splitCsv(raw.tagsCsv),
      allergens: this.splitCsv(raw.allergensCsv),
      dietaryTags: this.splitCsv(raw.dietaryTagsCsv),
      suitablePresentations: raw.suitablePresentations ?? [],
      imageUrl: raw.imageUrl?.trim() || undefined,
      sourceType: (raw.sourceType as RecipeUpsertPayload['sourceType']) || 'MANUAL',
      sourceUrl: raw.sourceUrl?.trim() || undefined,
      sourceName: raw.sourceName?.trim() || undefined,
      attribution: raw.attribution?.trim() || undefined,
      license: raw.license?.trim() || undefined,
      status: raw.status as RecipeStatus,
      ingredients: (raw.ingredients ?? []).map((i) => ({
        name: String(i.name ?? '').trim(),
        qty: String(i.qty ?? '').trim() || undefined,
        unit: String(i.unit ?? '').trim() || undefined,
        notes: String(i.notes ?? '').trim() || undefined,
      })),
      steps: (raw.steps ?? []).map((s, idx) => ({
        order: Number(s.order) || idx + 1,
        text: String(s.text ?? '').trim(),
      })),
    };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    const payload = this.toPayload();
    const req$ = this.isEditMode()
      ? this.api.update(this.id!, payload)
      : this.api.create(payload);

    req$.subscribe({
      next: (res) => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode()
              ? 'recipes.admin.updatedOk'
              : 'recipes.admin.createdOk',
          ),
        );
        if (!this.isEditMode()) {
          this.router.navigate(['/recipes', res.data.id]);
        } else {
          this.chunkCount.set(res.data._count?.chunks ?? this.chunkCount());
          this.likeCount.set(res.data.likeCount ?? this.likeCount());
          this.isSaving.set(false);
        }
      },
      error: () => this.isSaving.set(false),
    });
  }

  reindex(): void {
    if (!this.id) return;
    this.isReindexing.set(true);
    this.api.reindex(this.id).subscribe({
      next: () => {
        this.isReindexing.set(false);
        this.snackbar.success(
          this.transloco.translate('recipes.admin.reindexOk'),
        );
        this.api.getById(this.id!).subscribe({
          next: (res) => this.chunkCount.set(res.data._count?.chunks ?? 0),
        });
      },
      error: () => {
        this.isReindexing.set(false);
        this.snackbar.error(
          this.transloco.translate('recipes.admin.reindexFail'),
        );
      },
    });
  }
}
