/** Canonical lot code: P{pool}-{MMYY}-{presentation}-{packaging}[-suffix] */
export const LOT_CODE_REGEX = /^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;

/** Normalize pasted or typed input into canonical lot code segments. */
export function normalizeLotCodeInput(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return '';

  // Already canonical
  if (LOT_CODE_REGEX.test(trimmed)) return trimmed;

  // Collapse spaces and unify separators
  const compact = trimmed.replace(/\s+/g, '').replace(/_/g, '-');
  if (LOT_CODE_REGEX.test(compact)) return compact;

  // Try to rebuild from alphanumeric chunks (e.g. "P1 0726 PD IQF")
  const alnum = compact.replace(/[^A-Z0-9]/g, '');
  const poolMatch = alnum.match(/^P(\d+)/i);
  if (!poolMatch) return compact;

  let rest = alnum.slice(poolMatch[0].length);
  if (rest.length < 4) return compact;

  const mmyy = rest.slice(0, 4);
  rest = rest.slice(4);
  if (!/^\d{4}$/.test(mmyy) || rest.length < 2) return compact;

  // Presentation: 2 chars (PD, SO, BF, PT) or longer run until packaging
  const packagingCandidates = ['IQF', 'CBX'];
  let presentation = '';
  let packaging = '';
  let suffix = '';

  for (const pkg of packagingCandidates) {
    const idx = rest.indexOf(pkg);
    if (idx >= 2) {
      presentation = rest.slice(0, idx);
      const afterPkg = rest.slice(idx + pkg.length);
      packaging = pkg;
      suffix = afterPkg ? `-${afterPkg}` : '';
      break;
    }
  }

  if (!presentation || !packaging) return compact;

  const candidate = `P${poolMatch[1]}-${mmyy}-${presentation}-${packaging}${suffix}`;
  return LOT_CODE_REGEX.test(candidate) ? candidate : compact;
}

export function isValidLotCode(value: string): boolean {
  return LOT_CODE_REGEX.test(normalizeLotCodeInput(value));
}
