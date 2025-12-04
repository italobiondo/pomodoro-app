import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";

export function useStats() {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [data, setData] = useState<null | any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		apiGet("/stats/overview")
			.then(setData)
			.finally(() => setLoading(false));
	}, []);

	return { stats: data, loading };
}
