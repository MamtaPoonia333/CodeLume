'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '../../../../../lib/api';
import type { Review } from '../../../../../types';
import { IssueList } from '../../../../../components/reviews/IssueList';

export default function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const result = await api<{ review: Review }>(`/reviews/${reviewId}`);
        if (active) {
          setReview(result.review);
          setError('');
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load review');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [reviewId]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!review) return <p>Loading review…</p>;
  if (review.status === 'processing' || review.status === 'pending') {
    return <section className="space-y-4"><p className="text-sm uppercase text-blue-300">{review.status === 'processing' ? 'Running' : 'Queued'}</p><h1 className="text-2xl font-bold">Review in progress</h1><p className="text-slate-300">Ollama is analyzing the uploaded files. This page refreshes automatically.</p></section>;
  }
  if (review.status === 'failed') {
    return <section className="space-y-4"><p className="text-sm uppercase text-red-300">Failed</p><h1 className="text-2xl font-bold">Review could not be completed</h1><p className="rounded border border-red-400/40 bg-red-400/10 p-4 text-red-200">{review.error || 'The AI provider did not return a usable review.'}</p><p className="text-slate-400">Try again with a smaller scope or confirm that Ollama is running.</p></section>;
  }
  return <section className="space-y-6"><header><p className="text-sm uppercase text-emerald-300">Complete · {review.severity || 'Unrated'}</p><h1 className="text-2xl font-bold">Review details</h1><p className="mt-2 text-slate-300">{review.summary}</p></header><section><h2 className="mb-3 text-lg font-semibold">Issues ({review.issues.length})</h2><IssueList issues={review.issues} /></section><section><h2 className="mb-3 text-lg font-semibold">Recommendations</h2><ul className="list-disc space-y-2 pl-5">{review.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></section></section>;
}
