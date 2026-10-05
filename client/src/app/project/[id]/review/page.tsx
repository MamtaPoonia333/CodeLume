'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import type { Provider, Review } from '../../../../types';
import { ReviewForm } from '../../../../components/reviews/ReviewForm';
export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>(); const [reviews, setReviews] = useState<Review[]>([]); const [providers, setProviders] = useState<Provider[]>([]); const [error, setError] = useState('');
  const load = useCallback(async () => { try { const [reviewResult, providerResult] = await Promise.all([api<{ reviews: Review[] }>(`/reviews?projectId=${id}`), api<{ providers: Provider[] }>('/ai-providers')]); setReviews(reviewResult.reviews); setProviders(providerResult.providers); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load reviews'); } }, [id]);
  useEffect(() => { void load(); }, [load]);
  async function run(template: string, providerId: string) { try { await api('/reviews', { method: 'POST', body: JSON.stringify({ projectId: id, scope: 'PROJECT', template, providerId }) }); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Review failed'); } }
  return <section className="space-y-6"><header><h1 className="text-2xl font-bold">Review history</h1><p className="text-slate-400">Run a structured review across the uploaded project.</p></header><ReviewForm providers={providers} onSubmit={(template, providerId) => void run(template, providerId)} />{error && <p className="text-red-400">{error}</p>}<div className="space-y-3">{reviews.map((review) => <Link key={review._id} href={`/project/${id}/review/${review._id}`} className="block rounded border border-slate-700 bg-slate-900 p-4 hover:border-blue-400"><div className="flex justify-between"><strong>{review.status}</strong><span className="text-sm text-slate-400">{review.severity || '—'}</span></div><p className="mt-2 text-sm text-slate-300">{review.summary || review.error || 'Review pending…'}</p></Link>)}{!reviews.length && <p className="text-slate-400">No reviews yet.</p>}</div></section>;
}
