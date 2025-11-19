import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface OverdueSummary {
  member_id: string;
  has_overdue: boolean;
  overdue_count: number;
  total_overdue_amount: number;
  oldest_overdue_days: number;
  restricted_access: boolean;
}

export function useOverdueCheck() {
  const { user } = useAuth();
  const [overdueSummary, setOverdueSummary] = useState<OverdueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'member') {
      loadOverdueSummary();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOverdueSummary = async () => {
    try {
      const token = user?.token;
      const response = await axios.get(`${BACKEND_URL}/api/overdue/member/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdueSummary(response.data);
    } catch (error) {
      console.error('Error loading overdue summary:', error);
      setOverdueSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const isAccessRestricted = () => {
    if (user?.role !== 'member') return false;
    return overdueSummary?.restricted_access || false;
  };

  const hasOverdue = () => {
    if (user?.role !== 'member') return false;
    return overdueSummary?.has_overdue || false;
  };

  const refreshOverdueStatus = () => {
    if (user?.role === 'member') {
      loadOverdueSummary();
    }
  };

  return {
    overdueSummary,
    loading,
    isAccessRestricted,
    hasOverdue,
    refreshOverdueStatus
  };
}
