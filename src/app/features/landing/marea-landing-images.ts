/**
 * Imágenes remotas para la landing Marea Alta (Unsplash y assets propios en S3).
 * Licencia Unsplash: https://unsplash.com/license
 */
export const MareaLandingImages = {
  /** Océano — fondo hero (ambient) */
  heroBackground: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=2000&q=82',
  /** Camarón en plato — producto (Oksana Z) */
  heroProduct: 'https://images.unsplash.com/photo-1627841825438-ee3e7d8febd4?auto=format&fit=crop&w=1400&q=82',
  /** Fundadores — sección «Cómo nace Marea Alta» (hosting S3) */
  story: 'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/Foto_pareja.png',
  /** Empaque de ejemplo con etiqueta y QR — «Del envase a la prueba» */
  consumerPackageExample:
    'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/ejemplo_de_empaque.png',
  /** Menú de restaurante con QR por plato — CTA «Eleve el estándar de su negocio» */
  finalCtaMenu:
    'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/menu_restaurante.png',
  timeline: {
    /** Mar abierto — raíz costera de la industria */
    e1: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?auto=format&fit=crop&w=900&q=80',
    /** Químicos — camarón crudo (S3) */
    e2:
      'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/sustancia-ocultas-camaron.jpg',
    /** Sabor — metabisulfito de sodio (S3) */
    e3:
      'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/metabisulfito-de-sodio.jpeg',
    /** Camarón — presente y calidad (CHUTTERSNAP) */
    e4: 'https://images.unsplash.com/photo-1548468868-c656a1c9dad3?auto=format&fit=crop&w=900&q=80',
  },
  trace: {
    /** Infografía «Camino del camarón» — cabecera sección trazabilidad (S3) */
    valueProposition:
      'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/Imagen_propuesta_de_valor.png',
    /** Genética y larvas (S3) */
    s1: 'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/genetica_y_larvas.png',
    /** Cultivo extensivo y saludable (S3) */
    s2:
      'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/cultivo_extensivo_saludable.png',
    /** Transformación y empaque (S3) */
    s3:
      'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/transformacion_empaque.png',
  },
  testimonials: {
    t1: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
    t2: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=400&q=80',
    t3: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    t4: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    t5: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  },
} as const;
