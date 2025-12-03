"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
	const [error, setError] = useState<string | null>(null);

	// Limpa tasks quando o usuário desloga ou quando não é Pro (mantém comportamento atual)
	useEffect(() => {
		if (!isPro) {
			// Deslogado ou Free → zera apenas a UI/localStorage
			setItems([]);
		}
	}, [logoutSignal, isPro, setItems]);

	const reloadFromBackend = useCallback(async () => {
		if (!isPro || !user) return;

		try {
			const remoteItems = await apiGet<TodoItem[]>("/tasks");
			setItems(remoteItems);
		} catch {
			// por enquanto, silencioso — se der erro, fica só com localStorage
		}
	}, [isPro, user, setItems]);

	// Quando usuário Pro loga, busca tasks no backend (agora em /tasks)
	useEffect(() => {
		void reloadFromBackend();
	}, [reloadFromBackend]);

	const remainingSlots = useMemo(
		() => Math.max(0, maxTasks - items.length),
		[items.length, maxTasks]
	);

	const canAddMore = items.length < maxTasks;

	const addItem = useCallback(
		async (title: string) => {
			const trimmed = title.trim();
			if (!trimmed || !canAddMore) return;

			setError(null);

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
			try {
				const created = await apiPost<TodoItem>("/tasks", { title: trimmed });
				setItems((prev) => [...prev, created]);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (err: any) {
				const status =
					err?.status ?? err?.response?.status ?? err?.cause?.status;

				if (status === 409) {
					setError(
						"Você atingiu o limite de 100 tarefas do plano Pro. Exclua alguma para adicionar novas."
					);
				} else {
					setError("Não foi possível criar a tarefa. Tente novamente.");
				}

				// tenta ressincronizar com o backend para refletir o estado real
				try {
					await reloadFromBackend();
				} catch {
					// silencioso por enquanto
				}
			}
		},
		[canAddMore, isPro, setItems, reloadFromBackend]
	);

	const updateItemTitle = useCallback(
		async (id: string, title: string) => {
			const trimmed = title.trim();

			setError(null);

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
				try {
					await apiPatch<TodoItem>(`/tasks/${id}`, { title: trimmed });
				} catch {
					// Futuro: podemos reverter o estado e/ou exibir erro
					setError("Não foi possível atualizar a tarefa. Tente novamente.");
				}
			}
		},
		[isPro, setItems]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			setError(null);

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
				setError("Não foi possível atualizar o status da tarefa.");
			}
		},
		[isPro, items, setItems]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setError(null);

			setItems((prev) => prev.filter((item) => item.id !== id));

			if (isPro) {
				try {
					await apiDelete(`/tasks/${id}`);
				} catch {
					setError("Não foi possível excluir a tarefa. Tente novamente.");
				}
			}
		},
		[isPro, setItems]
	);

	const clearAll = useCallback(async () => {
		setError(null);

		setItems([]);

		if (isPro) {
			try {
				await apiDelete("/tasks");
			} catch {
				setError("Não foi possível limpar as tarefas.");
			}
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
		error,
	};
}
