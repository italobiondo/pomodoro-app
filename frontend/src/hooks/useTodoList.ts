import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { v4 as uuid } from "uuid";

export type TodoItem = {
	id: string;
	title: string;
	done: boolean;
	createdAt: string;
	updatedAt: string;
};

const STORAGE_KEY = "pomodoro:tasks:v1";
const MAX_FREE_TASKS = 10;

export function useTodoList() {
	const [items, setItems] = useLocalStorage<TodoItem[]>(STORAGE_KEY, []);

	const remainingSlots = useMemo(
		() => Math.max(0, MAX_FREE_TASKS - items.length),
		[items.length]
	);

	const canAddMore = items.length < MAX_FREE_TASKS;

	const addItem = useCallback(
		(title: string) => {
			const trimmed = title.trim();
			if (!trimmed || !canAddMore) return;

			const now = new Date().toISOString();

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
		},
		[canAddMore, setItems]
	);

	const updateItemTitle = useCallback(
		(id: string, title: string) => {
			const trimmed = title.trim();
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
		},
		[setItems]
	);

	const toggleDone = useCallback(
		(id: string) => {
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
		},
		[setItems]
	);

	const removeItem = useCallback(
		(id: string) => {
			setItems((prev) => prev.filter((item) => item.id !== id));
		},
		[setItems]
	);

	const clearAll = useCallback(() => {
		setItems([]);
	}, [setItems]);

	return {
		items,
		addItem,
		updateItemTitle,
		toggleDone,
		removeItem,
		clearAll,
		maxTasks: MAX_FREE_TASKS,
		remainingSlots,
		canAddMore,
	};
}
