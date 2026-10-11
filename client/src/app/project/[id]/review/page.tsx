'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import type { Provider, Review } from '../../../../types';
import { ReviewForm } from '../../../../components/reviews/ReviewForm';

const statusLabel: Record<Review['status'], string> = {
  pending: 'Queued',
  processing: 'Running',
  complete: 'Complete',
  failed: 'Failed'
};

const statusClass: Record<Review['status'], string> = {
  pending: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  processing: 'border-blue-400/40 bg-blue-400/10 text-blue-200',
  complete: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  failed: 'border-red-400/40 bg-red-400/10 text-red-200'
};

export default function ReviewsPage() {
  const { id } = useParams<{ id: string }>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [reviewResult, providerResult] = await Promise.all([
        api<{ reviews: Review[] }>(`/reviews?projectId=${id}`),
        api<{ providers: Provider[] }>('/ai-providers')
      ]);
      setReviews(reviewResult.reviews);
      setProviders(providerResult.providers);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reviews');
    }
  }, [id]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function run(template: string, providerId: string) {
    try {
      setError('');
      await api('/reviews', { method: 'POST', body: JSON.stringify({ projectId: id, scope: 'PROJECT', template, providerId }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start review');
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Review history</h1>
        <p className="text-slate-400">Run a structured review across the uploaded project. Local Ollama reviews may take a few minutes.</p>
      </header>
      <ReviewForm providers={providers} onSubmit={(template, providerId) => void run(template, providerId)} />
      {error && <p className="rounded border border-red-400/40 bg-red-400/10 p-3 text-red-200">{error}</p>}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Link key={review._id} href={`/project/${id}/review/${review._id}`} className="block rounded border border-slate-700 bg-slate-900 p-4 hover:border-blue-400">
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded border px-2 py-1 text-xs font-semibold uppercase ${statusClass[review.status]}`}>{statusLabel[review.status]}</span>
              <span className="text-sm text-slate-400">{review.severity || 'Unrated'}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              {review.status === 'processing' ? 'Ollama is analyzing the uploaded files…' : review.status === 'pending' ? 'Waiting to start…' : review.summary || review.error || 'No summary available.'}
            </p>
            {review.status === 'failed' && review.error && <p className="mt-2 text-sm text-red-300">{review.error}</p>}
          </Link>
        ))}
        {!reviews.length && <p className="text-slate-400">No reviews yet.</p>}
      </div>
    </section>
  );
}
