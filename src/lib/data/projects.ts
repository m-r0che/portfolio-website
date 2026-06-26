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
    subtitle: 'AI-native operations platform',
    blurb: 'Composable agent stack for ops teams. Founding product lead.'
  },
  {
    id: 'salesape',
    label: 'SalesAPE',
    subtitle: 'AI SDRs at scale',
    blurb: 'Product across the inbound automation workflow.'
  },
  {
    id: 'movetech',
    label: 'Move Tech',
    subtitle: 'Conveyancing infrastructure',
    blurb: 'Built data plumbing for the UK property purchase flow.'
  },
  {
    id: 'hpc',
    label: 'Hyper Product Club',
    subtitle: 'Fractional product trio',
    blurb: 'Consulting with Tom and Nick on AI-shaped product bets.'
  },
  {
    id: 'writing',
    label: 'Writing',
    subtitle: 'Essays & notes',
    blurb: 'Mostly about agent UX, product taste, and the new building stack.'
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
    blurb: 'Fifteen-ish years across product, engineering, and ops.'
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
