// frontend/src/hooks/useProposals.ts

import { useState, useEffect, useCallback } from 'react';
import { withRetry } from '../utils/retryUtils';
import { useVaultContract } from './useVaultContract';
import type { Proposal } from '../app/dashboard/Proposals';

type ProposalStatus = Proposal['status'];

interface UseProposalsReturn {
  proposals: Proposal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filterByStatus: (status: ProposalStatus | 'all') => Proposal[];
}

export const useProposals = (): UseProposalsReturn => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getProposals } = useVaultContract();

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await withRetry(async () => {
        const data = await getProposals();
        setProposals(data);
      }, { maxAttempts: 3, initialDelayMs: 1000 });
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load proposals. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [getProposals]);

  const filterByStatus = (status: ProposalStatus | 'all'): Proposal[] => {
    if (status === 'all') return proposals;
    return proposals.filter(p => p.status === status);
  };

  useEffect(() => {
    void fetchProposals();
  }, [fetchProposals]);

  return { proposals, loading, error, refetch: fetchProposals, filterByStatus };
};
