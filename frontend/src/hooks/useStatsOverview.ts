"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import type { StatsOverview } from "@/types/stats";

type UseStatsOverviewResult = {
	data: StatsOverview | null;
	loading: boolean;
	error: string | null;
};

export function useStatsOverview(): UseStatsOverviewResult {
	const [data, setData] = useState<StatsOverview | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function fetchStats() {
			try {
				setLoading(true);
				setError(null);

				const response = await apiGet<StatsOverview>("/stats/overview");

				if (!cancelled) {
					setData(response);
				}
			} catch (err) {
				if (!cancelled) {
					console.error("Erro ao carregar stats overview:", err);
					setError("Não foi possível carregar suas estatísticas.");
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void fetchStats();

		return () => {
			cancelled = true;
		};
	}, []);

	return { data, loading, error };
}
