"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

type UseStatsOverviewResult = {
	data: StatsOverview | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
};

export function useStatsOverview(): UseStatsOverviewResult {
	const [data, setData] = useState<StatsOverview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await apiGet<StatsOverview>("/stats/overview");
			setData(response);
		} catch (err) {
			console.error("Erro ao carregar stats overview:", err);
			setData(null);
			setError("Não foi possível carregar suas estatísticas.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;

		(async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await apiGet<StatsOverview>("/stats/overview");
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
	}, [fetchStats]);

	// Nota: mantemos a lógica existente de efeito/cancelamento,
	// e expomos um refetch simples para UI.
	const refetch = useCallback(async () => {
		await fetchStats();
	}, [fetchStats]);

	return { data, loading, error, refetch };
}
