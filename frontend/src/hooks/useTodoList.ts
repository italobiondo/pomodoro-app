"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { v4 as uuid } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import {
	TodoItem,
	TaskApiModel,
	PendingTaskForSync,
	TasksSyncResponse,
} from "@/types/tasks";

const STORAGE_KEY = "pomodoro:tasks:v1";
const PRO_PENDING_SYNC_KEY = "pomodoro:tasks:pro:pending-sync:v1";

const MAX_FREE_TASKS = 10;
const MAX_PRO_TASKS = 100;

// Helper para saber se estamos no browser
const isBrowser = typeof window !== "undefined";

// Helper para saber se está online
const isOnline = () => {
	if (!isBrowser) return true;
	return window.navigator.onLine;
};

// Normaliza o modelo vindo da API para o modelo do frontend (TodoItem)
function normalizeTaskFromApi(task: TaskApiModel): TodoItem {
	return {
		id: task.id,
		clientId: task.clientId ?? task.id,
		title: task.title,
		done: task.done,
		createdAt: task.createdAt,
		updatedAt: task.updatedAt,
		deletedAt: task.deletedAt ?? null,
	};
}

export function useTodoList() {
	const { isPro, user, logoutSignal } = useAuth();

	const maxTasks = isPro ? MAX_PRO_TASKS : MAX_FREE_TASKS;

	const [items, setItems] = useLocalStorage<TodoItem[]>(STORAGE_KEY, []);
	const [pendingSyncTasks, setPendingSyncTasks] = useLocalStorage<
		PendingTaskForSync[]
	>(PRO_PENDING_SYNC_KEY, []);
	const [error, setError] = useState<string | null>(null);

	// Limpa tasks quando o usuário desloga ou quando não é Pro (mantém comportamento atual)
	useEffect(() => {
		if (!isPro) {
			// Deslogado ou Free → zera apenas a UI/localStorage
			setItems([]);
			setPendingSyncTasks([]);
		}
	}, [logoutSignal, isPro, setItems, setPendingSyncTasks]);

	/**
	 * Enfileira um "task change" para ser enviado depois via /tasks/sync.
	 * Usado apenas quando o usuário Pro está OFFLINE.
	 */
	const queuePendingSyncTask = useCallback(
		(task: PendingTaskForSync) => {
			setPendingSyncTasks((prev) => [...prev, task]);
		},
		[setPendingSyncTasks]
	);

	const reloadFromBackend = useCallback(async () => {
		if (!isPro || !user) return;

		try {
			const remoteItems = await apiGet<TaskApiModel[]>("/tasks");
			setItems(remoteItems.map(normalizeTaskFromApi));
		} catch {
			// por enquanto, silencioso — se der erro, fica só com localStorage
		}
	}, [isPro, user, setItems]);

	/**
	 * Sincroniza tasks pendentes (fila offline) com o backend usando /tasks/sync.
	 * Estratégia:
	 *  - Só roda para usuários Pro logados.
	 *  - Só roda se estiver online.
	 *  - Se der certo, substitui o estado local pelo snapshot consolidado do servidor.
	 */
	const syncPendingWithServer = useCallback(async () => {
		if (!isPro || !user) return;
		if (!isOnline()) return;
		if (pendingSyncTasks.length === 0) return;

		try {
			const body = {
				clientId: `web-${user.id}`,
				lastSyncAt: null as string | null,
				tasks: pendingSyncTasks.map((t) => ({
					id: t.id,
					clientId: t.clientId,
					title: t.title,
					done: t.done,
					updatedAt: t.updatedAt,
					deletedAt: t.deletedAt ?? null,
				})),
			};

			const response = await apiPost<TasksSyncResponse>("/tasks/sync", body);

			const nextItems: TodoItem[] = response.tasks
				.filter((t) => !t.deletedAt)
				.map(normalizeTaskFromApi);

			setItems(nextItems);
			setPendingSyncTasks([]);
			setError(null);
		} catch {
			// Mantém a fila para tentar novamente depois
			setError(
				"Não foi possível sincronizar suas tarefas. Tentaremos novamente quando a conexão estiver estável."
			);
		}
	}, [isPro, user, pendingSyncTasks, setItems, setPendingSyncTasks]);

	// Quando usuário Pro loga ou tasks mudam, tenta sincronizar pendências
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void syncPendingWithServer();
	}, [syncPendingWithServer]);

	// Listener para quando a conexão volta (evento 'online')
	useEffect(() => {
		if (!isBrowser) return;

		const handleOnline = () => {
			void syncPendingWithServer();
		};

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, [syncPendingWithServer]);

	// Quando usuário Pro loga, busca tasks no backend (GET /tasks)
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
						clientId: null,
						title: trimmed,
						done: false,
						createdAt: now,
						updatedAt: now,
						deletedAt: null,
					},
				]);
				return;
			}

			// Pro: se offline → apenas enfileira para sync futuro
			if (!isOnline()) {
				const clientId = uuid();

				const newItem: TodoItem = {
					id: clientId,
					clientId,
					title: trimmed,
					done: false,
					createdAt: now,
					updatedAt: now,
					deletedAt: null,
				};

				setItems((prev) => [...prev, newItem]);

				queuePendingSyncTask({
					clientId,
					title: trimmed,
					done: false,
					updatedAt: now,
					deletedAt: null,
				});

				return;
			}

			// Pro + online: cria no backend (POST /tasks) e atualiza local
			try {
				const created = await apiPost<TaskApiModel>("/tasks", {
					title: trimmed,
				});
				const normalized = normalizeTaskFromApi(created);
				setItems((prev) => [...prev, normalized]);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			} catch (err: unknown) {
				setError("Não foi possível criar a tarefa. Tente novamente.");

				// tenta ressincronizar com o backend para refletir o estado real
				try {
					await reloadFromBackend();
				} catch {
					// silencioso por enquanto
				}
			}
		},
		[canAddMore, isPro, setItems, queuePendingSyncTask, reloadFromBackend]
	);

	const updateItemTitle = useCallback(
		async (id: string, title: string) => {
			const trimmed = title.trim();

			setError(null);

			const now = new Date().toISOString();

			// Atualiza localmente sempre
			let target: TodoItem | undefined;
			setItems((prev) =>
				prev.map((item) => {
					if (item.id === id) {
						target = {
							...item,
							title: trimmed || item.title,
							updatedAt: now,
						};
						return target;
					}
					return item;
				})
			);

			// Free: nada a fazer no backend
			if (!isPro) {
				return;
			}

			// Pro + offline → enfileira alteração
			if (!isOnline()) {
				if (target) {
					queuePendingSyncTask({
						id: target.id,
						clientId: target.clientId ?? undefined,
						title: target.title,
						done: target.done,
						updatedAt: target.updatedAt,
						deletedAt: target.deletedAt ?? null,
					});
				}
				return;
			}

			// Pro + online → atualiza no backend (PATCH /tasks/:id)
			try {
				const updated = await apiPatch<TaskApiModel>(`/tasks/${id}`, {
					title: trimmed,
				});
				const normalized = normalizeTaskFromApi(updated);
				setItems((prev) =>
					prev.map((item) => (item.id === id ? normalized : item))
				);
			} catch {
				setError("Não foi possível atualizar a tarefa. Tente novamente.");
			}
		},
		[isPro, setItems, queuePendingSyncTask]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			setError(null);

			const now = new Date().toISOString();

			// Free: apenas localStorage
			if (!isPro) {
				setItems((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									done: !item.done,
									updatedAt: now,
							  }
							: item
					)
				);
				return;
			}

			const current = items.find((item) => item.id === id);
			if (!current) return;

			const desiredDone = !current.done;

			// Pro + offline → atualiza local + enfileira
			if (!isOnline()) {
				const updated: TodoItem = {
					...current,
					done: desiredDone,
					updatedAt: now,
				};

				setItems((prev) =>
					prev.map((item) => (item.id === id ? updated : item))
				);

				queuePendingSyncTask({
					id: updated.id,
					clientId: updated.clientId ?? undefined,
					title: updated.title,
					done: updated.done,
					updatedAt: updated.updatedAt,
					deletedAt: updated.deletedAt ?? null,
				});

				return;
			}

			// Pro + online → backend é fonte da verdade
			try {
				const updated = await apiPatch<TaskApiModel>(`/tasks/${id}`, {
					done: desiredDone,
				});

				const normalized = normalizeTaskFromApi(updated);

				setItems((prev) =>
					prev.map((item) => (item.id === id ? normalized : item))
				);
			} catch {
				setError("Não foi possível atualizar o status da tarefa.");
			}
		},
		[isPro, items, setItems, queuePendingSyncTask]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setError(null);

			const now = new Date().toISOString();

			const current = items.find((item) => item.id === id);

			// Atualiza UI imediatamente
			setItems((prev) => prev.filter((item) => item.id !== id));

			// Free: só local
			if (!isPro) {
				return;
			}

			// Pro + offline → enfileira "delete"
			if (!isOnline()) {
				if (current) {
					queuePendingSyncTask({
						id: current.id,
						clientId: current.clientId ?? undefined,
						title: current.title,
						done: current.done,
						updatedAt: now,
						deletedAt: now,
					});
				}
				return;
			}

			// Pro + online → DELETE /tasks/:id
			try {
				await apiDelete(`/tasks/${id}`);
			} catch {
				setError("Não foi possível excluir a tarefa. Tente novamente.");
			}
		},
		[isPro, items, setItems, queuePendingSyncTask]
	);

	const clearAll = useCallback(async () => {
		setError(null);

		const now = new Date().toISOString();

		const currentItems = items;

		// Atualiza UI imediatamente
		setItems([]);

		// Free: só local
		if (!isPro) {
			return;
		}

		// Pro + offline → cria tombstone para cada task
		if (!isOnline()) {
			const tombstones: PendingTaskForSync[] = currentItems.map((item) => ({
				id: item.id,
				clientId: item.clientId ?? undefined,
				title: item.title,
				done: item.done,
				updatedAt: now,
				deletedAt: now,
			}));

			setPendingSyncTasks((prev) => [...prev, ...tombstones]);
			return;
		}

		// Pro + online → DELETE /tasks
		try {
			await apiDelete("/tasks");
		} catch {
			setError("Não foi possível limpar as tarefas.");
		}
	}, [isPro, items, setItems, setPendingSyncTasks]);

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
