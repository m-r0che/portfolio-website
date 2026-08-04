export type StationId =
  | 'superstack'
  | 'salesape'
  | 'movetech'
  | 'hpc'
  | 'writing'
  | 'recommendations'
  | 'cv'
  | 'contact';

export interface Station {
  id: StationId;
  label: string;
  subtitle: string;
  blurb: string;
}

export const stations: Station[] = [
  {
    id: 'superstack',
    label: 'SuperStack',
    subtitle: 'Link-in-bio, powered by testimonials',
    blurb: 'Built the whole product; grew it to 100+ customers. Founder.'
  },
  {
    id: 'salesape',
    label: 'SalesAPE',
    subtitle: 'AI sales agents in production',
    blurb: 'Founding product engineer — pre-revenue to approaching $10M ARR.'
  },
  {
    id: 'movetech',
    label: 'Move Tech',
    subtitle: 'UK fitness marketplace',
    blurb: 'Engineer to product lead. A third of the UK leisure centre market.'
  },
  {
    id: 'hpc',
    label: 'Hyper Product Club',
    subtitle: 'Product & engineering consulting',
    blurb: 'Customer discovery and growth for early-stage companies.'
  },
  {
    id: 'writing',
    label: 'Writing',
    subtitle: 'Essays & notes',
    blurb: 'Occasional notes on building software like a craft.'
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    subtitle: 'What others say',
    blurb: 'A rare blend of skills. — Ben Lister'
  },
  {
    id: 'cv',
    label: 'CV',
    subtitle: 'The long form',
    blurb: 'Ten years across product, engineering, and data.'
  },
  {
    id: 'contact',
    label: 'Get in touch',
    subtitle: 'Email, calendar, signal',
    blurb: 'matt@…'
  }
];

export const stationById = (id: StationId): Station => {
  const s = stations.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown station: ${id}`);
  return s;
};
