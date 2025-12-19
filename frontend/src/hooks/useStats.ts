"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

type UseStatsResult = {
	stats: StatsOverview | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
};

export function useStats(): UseStatsResult {
	const [stats, setStats] = useState<StatsOverview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const res = await apiGet<StatsOverview>("/stats/overview");
			setStats(res);
		} catch (err) {
			console.error("Erro ao carregar stats:", err);
			setStats(null);
			setError("Não foi possível carregar suas estatísticas agora.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchStats();
	}, [fetchStats]);

	return { stats, loading, error, refetch: fetchStats };
}
