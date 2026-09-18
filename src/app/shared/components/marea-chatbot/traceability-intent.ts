/** Detect free-text questions about public lot traceability (not recipe RAG). */
export function isTraceabilityQuestion(message: string, lang: 'es' | 'en'): boolean {
  const normalized = message
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();
  if (!normalized) return false;

  const esPatterns = [
    /\btrazabilidad\b/,
    /\bc[oó]digo\s+de\s+lote\b/,
    /\bconsultar\s+(el\s+)?lote\b/,
    /\bbuscar\s+(el\s+)?lote\b/,
    /\bverificar\s+(el\s+)?lote\b/,
    /\bcomo\s+(consulto|veo|encuentro|busco)\b.*\b(lote|trazabilidad)\b/,
    /\bescanear\b.*\bqr\b/,
    /\bqr\b.*\b(lote|trazabilidad|etiqueta)\b/,
    /\bleer\b.*\betiqueta\b/,
    /\bpiscina\b.*\b(lote|trazabilidad)\b/,
    /\bmmyy\b/,
    /\bp\d+\s*-\s*\d{4}\b/,
  ];

  const enPatterns = [
    /\btraceability\b/,
    /\blot\s+code\b/,
    /\blook\s*up\b.*\blot\b/,
    /\bfind\s+(my\s+)?lot\b/,
    /\bverify\b.*\blot\b/,
    /\bhow\s+(do\s+i|to)\b.*\b(trace|lot)\b/,
    /\bscan\b.*\bqr\b/,
    /\bqr\b.*\b(lot|trace|label|packaging)\b/,
    /\bread\b.*\blabel\b/,
    /\bpool\b.*\b(lot|trace)\b/,
    /\bmmyy\b/,
    /\bp\d+\s*-\s*\d{4}\b/,
  ];

  const patterns = lang === 'en' ? enPatterns : esPatterns;
  return patterns.some((re) => re.test(normalized));
}
