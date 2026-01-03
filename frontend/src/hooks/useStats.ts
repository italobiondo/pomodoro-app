"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

type UseStatsOptions = {
	enabled?: boolean;
};

type UseStatsResult = {
	stats: StatsOverview | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
};

export function useStats(options: UseStatsOptions = {}): UseStatsResult {
	const enabled = options.enabled ?? true;

	const [stats, setStats] = useState<StatsOverview | null>(null);
	const [loading, setLoading] = useState<boolean>(enabled);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!enabled) return;

		setLoading(true);
		setError(null);

		try {
			const res = await apiGet<StatsOverview>("/stats");
			setStats(res);
		} catch (err) {
			console.error("Erro ao carregar stats:", err);
			setStats(null);
			setError("Não foi possível carregar suas estatísticas agora.");
		} finally {
			setLoading(false);
		}
	}, [enabled]);

	useEffect(() => {
		// Quando desabilitado (Free), mantemos estado "idle" e limpamos qualquer dado anterior.
		if (!enabled) {
			setStats(null);
			setError(null);
			setLoading(false);
			return;
		}

		void fetchStats();
	}, [enabled, fetchStats]);

	const refetch = useCallback(async () => {
		if (!enabled) return;
		await fetchStats();
	}, [enabled, fetchStats]);

	return { stats, loading, error, refetch };
}
