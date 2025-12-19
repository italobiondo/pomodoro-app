"use client";

import React from "react";
import { TodoListCard } from "@/components/TodoList/TodoListCard";

export const RightColumnFree: React.FC = () => {
	return (
		<aside className="pb-4" aria-label="Coluna de tarefas">
			<TodoListCard />
		</aside>
	);
};
