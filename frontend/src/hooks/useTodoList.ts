"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { v4 as uuid } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { apiGet, apiPost } from "@/lib/apiClient";
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

const isBrowser = typeof window !== "undefined";

const isOnline = () => {
	if (!isBrowser) return true;
	return window.navigator.onLine;
};

// Logger simples para debug do fluxo de sync
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logSync = (..._args: unknown[]) => {};

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

	// 🔹 Limpa só quando realmente houver logout (não em todo reload)
	useEffect(() => {
		if (!isPro && logoutSignal > 0) {
			logSync("Logout detectado em Free, limpando tasks locais");
			setItems([]);
			setPendingSyncTasks([]);
		}
	}, [logoutSignal, isPro, setItems, setPendingSyncTasks]);

	/**
	 * GET /tasks para carregar snapshot do backend.
	 * Só faz isso se não houver pendências de sync, para não pisar nas mudanças locais.
	 */
	const reloadFromBackend = useCallback(async () => {
		if (!isPro || !user) {
			logSync("reloadFromBackend: abortado (isPro/user)", {
				isPro,
				hasUser: !!user,
			});
			return;
		}
		if (pendingSyncTasks.length > 0) {
			logSync("reloadFromBackend: abortado, há pendências na fila", {
				pendingCount: pendingSyncTasks.length,
			});
			return;
		}

		try {
			logSync("reloadFromBackend: buscando /tasks do backend");
			const remoteItems = await apiGet<TaskApiModel[]>("/tasks");
			setItems(remoteItems.map(normalizeTaskFromApi));
			logSync("reloadFromBackend: snapshot carregado", {
				total: remoteItems.length,
			});
		} catch (err) {
			logSync("reloadFromBackend: erro ao carregar /tasks", err);
			// silencioso por enquanto
		}
	}, [isPro, user, pendingSyncTasks.length, setItems]);

	/**
	 * POST /tasks/sync com a fila atual.
	 * Recebe opcionalmente uma versão da lista para evitar estado stale.
	 */
	const syncPendingWithServer = useCallback(
		async (tasksOverride?: PendingTaskForSync[]) => {
			logSync("syncPendingWithServer: chamado", {
				isPro,
				hasUser: !!user,
				online: isOnline(),
				overrideCount: tasksOverride?.length ?? null,
				stateCount: pendingSyncTasks.length,
			});

			if (!isPro || !user) {
				logSync("syncPendingWithServer: abortado (isPro/user inválidos)");
				return;
			}
			if (!isOnline()) {
				logSync("syncPendingWithServer: abortado (offline)");
				return;
			}

			const tasks = tasksOverride ?? pendingSyncTasks;
			if (tasks.length === 0) {
				logSync("syncPendingWithServer: abortado (fila vazia)");
				return;
			}

			try {
				const body = {
					clientId: `web-${user.id}`,
					lastSyncAt: null as string | null,
					tasks: tasks.map((t) => ({
						id: t.id,
						clientId: t.clientId,
						title: t.title,
						done: t.done,
						updatedAt: t.updatedAt,
						deletedAt: t.deletedAt ?? null,
					})),
				};

				logSync("syncPendingWithServer: POST /tasks/sync", {
					bodyTasks: body.tasks.length,
				});

				const response = await apiPost<TasksSyncResponse>("/tasks/sync", body);

				const nextItems: TodoItem[] = response.tasks
					.filter((t) => !t.deletedAt)
					.map(normalizeTaskFromApi);

				setItems(nextItems);
				setPendingSyncTasks([]);
				setError(null);

				logSync("syncPendingWithServer: sucesso", {
					receivedTasks: response.tasks.length,
					nextItems: nextItems.length,
				});
			} catch (err) {
				logSync("syncPendingWithServer: erro na sync", err);
				setError(
					"Não foi possível sincronizar suas tarefas. Tentaremos novamente quando a conexão estiver estável."
				);
			}
		},
		[isPro, user, pendingSyncTasks, setItems, setPendingSyncTasks]
	);

	/**
	 * Sempre que a fila de pendências mudar, tenta sincronizar (se estiver online).
	 * Aqui passamos explicitamente a lista atual para o sync, evitando closure stale.
	 */
	useEffect(() => {
		logSync("useEffect[pendingSyncTasks]: fila alterada", {
			pendingCount: pendingSyncTasks.length,
			pendingSyncTasks,
		});

		if (pendingSyncTasks.length === 0) {
			logSync("useEffect[pendingSyncTasks]: nada a sincronizar (fila vazia)");
			return;
		}
		if (!isOnline()) {
			logSync("useEffect[pendingSyncTasks]: offline, adiando sync");
			return;
		}

		logSync(
			"useEffect[pendingSyncTasks]: disparando syncPendingWithServer com fila atual"
		);

		// eslint-disable-next-line react-hooks/set-state-in-effect
		void syncPendingWithServer(pendingSyncTasks);
	}, [pendingSyncTasks, syncPendingWithServer]);

	// Quando usuário Pro loga, se não houver pendências, carrega snapshot do backend
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

			// Pro: cria local + enfileira para sync
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

			setPendingSyncTasks((prev) => {
				const next = [
					...prev,
					{
						clientId,
						title: trimmed,
						done: false,
						updatedAt: now,
						deletedAt: null,
					},
				];
				logSync("addItem[Pro]: enfileirando nova task", {
					newItem,
					queueBefore: prev.length,
					queueAfter: next.length,
				});
				return next;
			});
		},
		[canAddMore, isPro, setItems, setPendingSyncTasks]
	);

	const updateItemTitle = useCallback(
		async (id: string, title: string) => {
			const trimmed = title.trim();
			const now = new Date().toISOString();

			setError(null);

			// Encontrar o item atual antes de atualizar o estado
			const current = items.find((item) => item.id === id);
			if (!current) {
				logSync("updateItemTitle: item não encontrado", { id });
				return;
			}

			const updated: TodoItem = {
				...current,
				title: trimmed || current.title,
				updatedAt: now,
			};

			setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));

			if (!isPro) return;

			setPendingSyncTasks((prev) => {
				const next = [
					...prev,
					{
						id: updated.id,
						clientId: updated.clientId ?? undefined,
						title: updated.title,
						done: updated.done,
						updatedAt: updated.updatedAt,
						deletedAt: updated.deletedAt ?? null,
					},
				];
				logSync("updateItemTitle[Pro]: enfileirando alteração de título", {
					updated,
					queueBefore: prev.length,
					queueAfter: next.length,
				});
				return next;
			});
		},
		[isPro, items, setItems, setPendingSyncTasks]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			setError(null);

			const now = new Date().toISOString();

			// Free: apenas localStorage
			if (!isPro) {
				setItems((prev) =>
					prev.map((item) =>
						item.id === id || item.clientId === id
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

			// Pro: usa o snapshot atual de items para achar o alvo
			const current = items.find(
				(item) => item.id === id || item.clientId === id
			);

			if (!current) {
				logSync("toggleDone[Pro]: item não encontrado (id/clientId)", {
					id,
					items,
				});
				return;
			}

			const updated: TodoItem = {
				...current,
				done: !current.done,
				updatedAt: now,
			};

			// Atualiza UI
			setItems((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item))
			);

			// Enfileira para sync
			setPendingSyncTasks((prev) => {
				const next = [
					...prev,
					{
						id: updated.id,
						clientId: updated.clientId ?? undefined,
						title: updated.title,
						done: updated.done,
						updatedAt: updated.updatedAt,
						deletedAt: updated.deletedAt ?? null,
					},
				];

				logSync("toggleDone[Pro]: enfileirando toggle done", {
					updated,
					queueBefore: prev.length,
					queueAfter: next.length,
				});

				return next;
			});
		},
		[isPro, items, setItems, setPendingSyncTasks]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setError(null);

			const now = new Date().toISOString();

			const current = items.find((item) => item.id === id);

			// Atualiza UI imediatamente
			setItems((prev) => prev.filter((item) => item.id !== id));

			// Free: só local
			if (!isPro) return;

			if (current) {
				setPendingSyncTasks((prev) => {
					const next = [
						...prev,
						{
							id: current.id,
							clientId: current.clientId ?? undefined,
							title: current.title,
							done: current.done,
							updatedAt: now,
							deletedAt: now,
						},
					];
					logSync("removeItem[Pro]: enfileirando tombstone", {
						current,
						queueBefore: prev.length,
						queueAfter: next.length,
					});
					return next;
				});
			} else {
				logSync("removeItem[Pro]: item não encontrado", { id });
			}
		},
		[isPro, items, setItems, setPendingSyncTasks]
	);

	const clearAll = useCallback(async () => {
		setError(null);

		const now = new Date().toISOString();

		const currentItems = items;

		// Atualiza UI imediatamente
		setItems([]);

		if (!isPro) return;

		const tombstones: PendingTaskForSync[] = currentItems.map((item) => ({
			id: item.id,
			clientId: item.clientId ?? undefined,
			title: item.title,
			done: item.done,
			updatedAt: now,
			deletedAt: now,
		}));

		setPendingSyncTasks((prev) => {
			const next = [...prev, ...tombstones];
			logSync("clearAll[Pro]: enfileirando tombstones", {
				count: tombstones.length,
				queueBefore: prev.length,
				queueAfter: next.length,
			});
			return next;
		});
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
