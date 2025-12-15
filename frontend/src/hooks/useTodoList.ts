"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { v4 as uuid } from "uuid";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, apiGet, apiPost } from "@/lib/apiClient";
import type {
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

	/**
	 * Server mode:
	 * - Pro ativo => sempre server
	 * - Ex-Pro (assinatura expirada) => server somente se houver tasks no backend
	 */
	const [usesServer, setUsesServer] = useState(false);
	const isServerMode = isPro || usesServer;

	/**
	 * Limite de UI:
	 * - Pro ativo: 100
	 * - Free e Ex-Pro: 10
	 *
	 * Observação: o backend é a fonte de verdade; aqui é só UX.
	 */
	const maxTasks = isPro ? MAX_PRO_TASKS : MAX_FREE_TASKS;

	const [items, setItems] = useLocalStorage<TodoItem[]>(STORAGE_KEY, []);
	const [pendingSyncTasks, setPendingSyncTasks] = useLocalStorage<
		PendingTaskForSync[]
	>(PRO_PENDING_SYNC_KEY, []);
	const [error, setError] = useState<string | null>(null);

	// 🔹 Limpa só quando realmente houver logout (não em todo reload)
	useEffect(() => {
		// Mantém seu comportamento original: só limpa quando é Free e houve logoutSignal.
		// Ex-Pro (serverMode) não deve apagar tasks locais automaticamente aqui.
		if (!isPro && logoutSignal > 0) {
			logSync("Logout detectado em Free, limpando tasks locais");
			setItems([]);
			setPendingSyncTasks([]);
			setUsesServer(false);
		}
	}, [logoutSignal, isPro, setItems, setPendingSyncTasks]);

	/**
	 * GET /tasks para carregar snapshot do backend.
	 * Só faz isso se não houver pendências de sync, para não pisar nas mudanças locais.
	 */
	const reloadFromBackend = useCallback(async () => {
		if (!user) {
			logSync("reloadFromBackend: abortado (sem user)");
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

			// Ex-Pro: se existir qualquer task no servidor, assume server mode
			if (!isPro && remoteItems.length > 0) {
				setUsesServer(true);
			}

			setItems(remoteItems.map(normalizeTaskFromApi));
			logSync("reloadFromBackend: snapshot carregado", {
				total: remoteItems.length,
			});
		} catch (err) {
			logSync("reloadFromBackend: erro ao carregar /tasks", err);
			// silencioso por enquanto
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, pendingSyncTasks.length, apiGet, isPro, setItems]);

	/**
	 * POST /tasks/sync com a fila atual.
	 * Recebe opcionalmente uma versão da lista para evitar estado stale.
	 */
	const syncPendingWithServer = useCallback(
		async (tasksOverride?: PendingTaskForSync[]) => {
			logSync("syncPendingWithServer: chamado", {
				isServerMode,
				hasUser: !!user,
				online: isOnline(),
				overrideCount: tasksOverride?.length ?? null,
				stateCount: pendingSyncTasks.length,
			});

			if (!isServerMode || !user) {
				logSync("syncPendingWithServer: abortado (serverMode/user inválidos)", {
					isServerMode,
					hasUser: !!user,
				});
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

				if (err instanceof ApiError) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const body = err.body as any;
					if (body?.code === "TASKS_LIMIT_REACHED") {
						const limit = Number(body?.limit ?? MAX_FREE_TASKS);
						setError(
							`Seu plano atual permite até ${limit} tarefas ativas. Você pode excluir/concluir tarefas para reduzir, ou reativar o Pro para voltar a ${MAX_PRO_TASKS}.`
						);
						return;
					}
				}

				setError(
					"Não foi possível sincronizar suas tarefas. Tentaremos novamente quando a conexão estiver estável."
				);
			}
		},
		[
			isServerMode,
			user,
			pendingSyncTasks,
			setItems,
			setPendingSyncTasks,
			setError,
		]
	);

	/**
	 * Sempre que a fila de pendências mudar, tenta sincronizar (se estiver online).
	 * Aqui passamos explicitamente a lista atual para o sync, evitando closure stale.
	 */
	useEffect(() => {
		logSync("useEffect[pendingSyncTasks]: fila alterada", {
			pendingCount: pendingSyncTasks.length,
		});

		if (pendingSyncTasks.length === 0) return;
		if (!isOnline()) return;

		void syncPendingWithServer(pendingSyncTasks);
	}, [pendingSyncTasks, syncPendingWithServer]);

	// quando usuário autenticado loga e não há pendências, tenta snapshot
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

			// Free puro: somente localStorage
			if (!isServerMode) {
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

			// Server mode (Pro / ex-Pro): cria local + enfileira para sync
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

			setPendingSyncTasks((prev) => [
				...prev,
				{
					clientId,
					title: trimmed,
					done: false,
					updatedAt: now,
					deletedAt: null,
				},
			]);
		},
		[canAddMore, isServerMode, setItems, setPendingSyncTasks, setError]
	);

	const updateItemTitle = useCallback(
		async (id: string, title: string) => {
			const trimmed = title.trim();
			const now = new Date().toISOString();

			setError(null);

			const current = items.find((item) => item.id === id);
			if (!current) return;

			const updated: TodoItem = {
				...current,
				title: trimmed || current.title,
				updatedAt: now,
			};

			setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));

			if (!isServerMode) return;

			setPendingSyncTasks((prev) => [
				...prev,
				{
					id: updated.id,
					clientId: updated.clientId ?? undefined,
					title: updated.title,
					done: updated.done,
					updatedAt: updated.updatedAt,
					deletedAt: updated.deletedAt ?? null,
				},
			]);
		},
		[items, isServerMode, setItems, setPendingSyncTasks, setError]
	);

	const toggleDone = useCallback(
		async (id: string) => {
			setError(null);
			const now = new Date().toISOString();

			if (!isServerMode) {
				setItems((prev) =>
					prev.map((item) =>
						item.id === id || item.clientId === id
							? { ...item, done: !item.done, updatedAt: now }
							: item
					)
				);
				return;
			}

			const current = items.find(
				(item) => item.id === id || item.clientId === id
			);
			if (!current) return;

			const updated: TodoItem = {
				...current,
				done: !current.done,
				updatedAt: now,
			};

			setItems((prev) =>
				prev.map((item) => (item.id === updated.id ? updated : item))
			);

			setPendingSyncTasks((prev) => [
				...prev,
				{
					id: updated.id,
					clientId: updated.clientId ?? undefined,
					title: updated.title,
					done: updated.done,
					updatedAt: updated.updatedAt,
					deletedAt: updated.deletedAt ?? null,
				},
			]);
		},
		[items, isServerMode, setItems, setPendingSyncTasks, setError]
	);

	const removeItem = useCallback(
		async (id: string) => {
			setError(null);
			const now = new Date().toISOString();

			const current = items.find((item) => item.id === id);

			setItems((prev) => prev.filter((item) => item.id !== id));

			if (!isServerMode) return;

			if (current) {
				setPendingSyncTasks((prev) => [
					...prev,
					{
						id: current.id,
						clientId: current.clientId ?? undefined,
						title: current.title,
						done: current.done,
						updatedAt: now,
						deletedAt: now,
					},
				]);
			}
		},
		[items, isServerMode, setItems, setPendingSyncTasks, setError]
	);

	const clearAll = useCallback(async () => {
		setError(null);
		const now = new Date().toISOString();

		const currentItems = items;
		setItems([]);

		if (!isServerMode) return;

		const tombstones: PendingTaskForSync[] = currentItems.map((item) => ({
			id: item.id,
			clientId: item.clientId ?? undefined,
			title: item.title,
			done: item.done,
			updatedAt: now,
			deletedAt: now,
		}));

		setPendingSyncTasks((prev) => [...prev, ...tombstones]);
	}, [items, isServerMode, setItems, setPendingSyncTasks, setError]);

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
		isServerMode,
	};
}
