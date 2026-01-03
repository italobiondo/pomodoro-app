"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

type UseStatsOverviewOptions = {
	enabled?: boolean;
};

type UseStatsOverviewResult = {
	data: StatsOverview | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
};

export function useStatsOverview(
	options: UseStatsOverviewOptions = {}
): UseStatsOverviewResult {
	const enabled = options.enabled ?? true;

	const [data, setData] = useState<StatsOverview | null>(null);
	const [loading, setLoading] = useState<boolean>(enabled);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		if (!enabled) return;

		setLoading(true);
		setError(null);

		try {
			const response = await apiGet<StatsOverview>("/stats");
			setData(response);
		} catch (err) {
			console.error("Erro ao carregar stats overview:", err);
			setData(null);
			setError("Não foi possível carregar suas estatísticas.");
		} finally {
			setLoading(false);
		}
	}, [enabled]);

	useEffect(() => {
		let cancelled = false;

		// Quando desabilitado (Free), estado "idle" e limpa dados
		if (!enabled) {
			setData(null);
			setError(null);
			setLoading(false);
			return () => {
				cancelled = true;
			};
		}

		(async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await apiGet<StatsOverview>("/stats");
				if (!cancelled) setData(response);
			} catch (err) {
				if (!cancelled) {
					console.error("Erro ao carregar stats overview:", err);
					setData(null);
					setError("Não foi possível carregar suas estatísticas.");
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [enabled]);

	const refetch = useCallback(async () => {
		if (!enabled) return;
		await fetchStats();
	}, [enabled, fetchStats]);

	return { data, loading, error, refetch };
}
