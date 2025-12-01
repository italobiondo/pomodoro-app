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
	const { isPro, user } = useAuth();

	const maxTasks = isPro ? MAX_PRO_TASKS : MAX_FREE_TASKS;

	const [items, setItems] = useLocalStorage<TodoItem[]>(STORAGE_KEY, []);

	// Quando usuário Pro loga, busca tasks no backend
	useEffect(() => {
		if (!isPro || !user) return;

		let cancelled = false;

		const loadFromBackend = async () => {
			try {
				const remoteItems = await apiGet<TodoItem[]>("/todos");
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

			// Pro: cria no backend
			const created = await apiPost<TodoItem>("/todos", { title: trimmed });
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

			// Pro: também atualiza no backend
			if (isPro) {
				await apiPatch<TodoItem>(`/todos/${id}`, { title: trimmed });
			}
		},
		[isPro, setItems]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			let newDone = false;

			setItems((prev) =>
				prev.map((item) => {
					if (item.id !== id) return item;
					newDone = !item.done;
					return {
						...item,
						done: newDone,
						updatedAt: new Date().toISOString(),
					};
				})
			);

			if (isPro) {
				await apiPatch<TodoItem>(`/todos/${id}`, { done: newDone });
			}
		},
		[isPro, setItems]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setItems((prev) => prev.filter((item) => item.id !== id));

			if (isPro) {
				await apiDelete(`/todos/${id}`);
			}
		},
		[isPro, setItems]
	);

	const clearAll = useCallback(async () => {
		setItems([]);

		if (isPro) {
			await apiDelete("/todos");
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
