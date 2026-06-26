import { error } from '@sveltejs/kit';
import { stations, type StationId } from '$lib/data/projects';

export const prerender = true;

export const entries = () =>
  stations.map((s) => ({ slug: s.id }));

export function load({ params }: { params: { slug: string } }) {
  const s = stations.find((x) => x.id === (params.slug as StationId));
  if (!s) throw error(404, 'Unknown project');
  return { station: s };
}
