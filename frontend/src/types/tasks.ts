// Modelo usado internamente no frontend (UI)
export type TodoItem = {
	id: string; // pode ser id do servidor ou um id temporário (clientId) quando offline
	clientId?: string | null;
	title: string;
	done: boolean;
	createdAt: string;
	updatedAt: string;
	deletedAt?: string | null;
};

// Modelo que a API /tasks e /tasks/:id atualmente retornam
// (sem deletedAt, sem clientId)
export type TaskApiModel = {
	id: string;
	title: string;
	done: boolean;
	createdAt: string;
	updatedAt: string;
	clientId?: string | null;
	deletedAt?: string | null;
};

// Modelo que /tasks/sync retorna (é basicamente o mesmo, mas garantido com deletedAt)
export type TasksSyncResponse = {
	meta: {
		serverTime: string;
	};
	tasks: TaskApiModel[];
};

// Estrutura mínima de um "task change" para fila offline de sync
export type PendingTaskForSync = {
	id?: string;
	clientId?: string;
	title: string;
	done: boolean;
	updatedAt: string;
	deletedAt?: string | null;
};
