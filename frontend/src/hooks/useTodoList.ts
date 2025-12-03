"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { v4 as uuid } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";

export type TodoItem = {
	id: string;
	title: string;
	done: boolean;
	createdAt: string;
	updatedAt: string;
};

const STORAGE_KEY = "pomodoro:tasks:v1";
const MAX_FREE_TASKS = 10;
const MAX_PRO_TASKS = 100;

export function useTodoList() {
	const { isPro, user, logoutSignal } = useAuth();

	const maxTasks = isPro ? MAX_PRO_TASKS : MAX_FREE_TASKS;

	const [items, setItems] = useLocalStorage<TodoItem[]>(STORAGE_KEY, []);

	// Limpa tasks quando o usuário desloga ou quando não é Pro (mantém comportamento atual)
	useEffect(() => {
		if (!isPro) {
			// Deslogado ou Free → zera apenas a UI/localStorage
			setItems([]);
		}
	}, [logoutSignal, isPro, setItems]);

	// Quando usuário Pro loga, busca tasks no backend (agora em /tasks)
	useEffect(() => {
		if (!isPro || !user) return;

		let cancelled = false;

		const loadFromBackend = async () => {
			try {
				// 🔁 AGORA BUSCANDO EM /tasks
				const remoteItems = await apiGet<TodoItem[]>("/tasks");
				if (!cancelled) {
					setItems(remoteItems);
				}
			} catch {
				// por enquanto, silencioso — se der erro, fica só com localStorage
			}
		};

		void loadFromBackend();

		return () => {
			cancelled = true;
		};
	}, [isPro, user, setItems]);

	const remainingSlots = useMemo(
		() => Math.max(0, maxTasks - items.length),
		[items.length, maxTasks]
	);

	const canAddMore = items.length < maxTasks;

	const addItem = useCallback(
		async (title: string) => {
			const trimmed = title.trim();
			if (!trimmed || !canAddMore) return;

			const now = new Date().toISOString();

			// Free: somente localStorage
			if (!isPro) {
				setItems((prev) => [
					...prev,
					{
						id: uuid(),
						title: trimmed,
						done: false,
						createdAt: now,
						updatedAt: now,
					},
				]);
				return;
			}

			// Pro: cria no backend (AGORA EM /tasks)
			const created = await apiPost<TodoItem>("/tasks", { title: trimmed });
			setItems((prev) => [...prev, created]);
		},
		[canAddMore, isPro, setItems]
	);

	const updateItemTitle = useCallback(
		async (id: string, title: string) => {
			const trimmed = title.trim();

			// Atualiza localmente sempre
			setItems((prev) =>
				prev.map((item) =>
					item.id === id
						? {
								...item,
								title: trimmed || item.title,
								updatedAt: new Date().toISOString(),
						  }
						: item
				)
			);

			// Pro: também atualiza no backend (AGORA EM /tasks/:id)
			if (isPro) {
				await apiPatch<TodoItem>(`/tasks/${id}`, { title: trimmed });
			}
		},
		[isPro, setItems]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			// Free: apenas localStorage
			if (!isPro) {
				setItems((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									done: !item.done,
									updatedAt: new Date().toISOString(),
							  }
							: item
					)
				);
				return;
			}

			// Pro: backend é a fonte da verdade
			const current = items.find((item) => item.id === id);
			if (!current) return;

			const desiredDone = !current.done;

			try {
				const updated = await apiPatch<TodoItem>(`/tasks/${id}`, {
					done: desiredDone,
				});

				setItems((prev) =>
					prev.map((item) => (item.id === id ? updated : item))
				);
			} catch {
				// Futuro: podemos mostrar um toast de erro e/ou reverter o estado local
				// Por enquanto, só deixamos silencioso pra não quebrar UX.
			}
		},
		[isPro, items, setItems]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setItems((prev) => prev.filter((item) => item.id !== id));

			if (isPro) {
				await apiDelete(`/tasks/${id}`);
			}
		},
		[isPro, setItems]
	);

	const clearAll = useCallback(async () => {
		setItems([]);

		if (isPro) {
			await apiDelete("/tasks");
		}
	}, [isPro, setItems]);

	return {
		items,
		addItem,
		updateItemTitle,
		toggleDone,
		removeItem,
		clearAll,
		maxTasks,
		remainingSlots,
		canAddMore,
	};
}
