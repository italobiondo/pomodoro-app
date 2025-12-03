"use client";

import { FormEvent, useState } from "react";
import { useTodoList } from "../../hooks/useTodoList";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";

export function TodoListCard() {
	const {
		items,
		addItem,
		updateItemTitle,
		toggleDone,
		removeItem,
		clearAll,
		maxTasks,
		remainingSlots,
		canAddMore,
	} = useTodoList();

	const [newTitle, setNewTitle] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const { isPro } = useAuth();

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!newTitle.trim()) return;

		addItem(newTitle);
		setNewTitle("");
	}

	function handleToggleDone(id: string, done: boolean) {
		toggleDone(id);

		// dispara confete apenas quando marca como concluída
		if (!done) {
			confetti({
				spread: 60,
				particleCount: 80,
				origin: { y: 0.8 },
				scalar: 0.8,
			});
		}
	}

	function startEditing(id: string, currentTitle: string) {
		setEditingId(id);
		setEditingTitle(currentTitle);
	}

	function saveEditing(id: string) {
		if (!editingId) return;
		updateItemTitle(id, editingTitle);
		setEditingId(null);
		setEditingTitle("");
	}

	function cancelEditing() {
		setEditingId(null);
		setEditingTitle("");
	}

	return (
		<section className="max-h-[854px] rounded-2xl bg-slate-900/70 border border-slate-700 p-4 flex flex-col gap-4">
			<header className="flex items-start justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold text-slate-100">
						Sua lista de tarefas
					</h2>
					<p className="text-xs text-slate-400 mt-1">
						{isPro
							? "Organize até 100 tarefas no plano Pro."
							: "Organize até 10 tarefas no plano Free."}
					</p>
				</div>

				<span
					className={
						"text-[10px] px-2 py-0.5 rounded-full border font-semibold " +
						(isPro
							? "border-amber-400 bg-amber-400/10 text-amber-200"
							: "border-emerald-500 bg-emerald-500/10 text-emerald-300")
					}
				>
					{isPro ? "PRO" : "FREE"}
				</span>
			</header>

			{/* Formulário de nova tarefa */}
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					type="text"
					className="flex-1 rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/60"
					placeholder={
						canAddMore
							? "Digite uma tarefa e pressione Enter"
							: "Limite de tarefas atingido"
					}
					value={newTitle}
					onChange={(e) => setNewTitle(e.target.value)}
					disabled={!canAddMore}
				/>
				<button
					type="submit"
					disabled={!canAddMore || !newTitle.trim()}
					className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-400 transition-colors"
				>
					Add
				</button>
			</form>

			{/* Mensagem de limite / slots restantes */}
			<div className="text-[11px] text-slate-400 flex justify-between items-center">
				<span>
					{items.length} / {maxTasks} tarefas
				</span>
				<span>
					{remainingSlots > 0
						? `${remainingSlots} vaga(s) restante(s)`
						: isPro
						? "Você atingiu o limite de tarefas do plano Pro."
						: "Você atingiu o limite de tarefas do plano Free."}
				</span>
			</div>

			{/* Lista de tarefas */}
			<div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
				{items.length === 0 ? (
					<p className="text-xs text-slate-500 italic">
						Nenhuma tarefa ainda. Crie a primeira para começar seu foco ✨
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{items.map((item) => {
							const isEditing = editingId === item.id;

							return (
								<li
									key={item.id}
									className="group flex items-start gap-2 rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2"
								>
									<button
										type="button"
										onClick={() => handleToggleDone(item.id, item.done)}
										className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ${
											item.done
												? "bg-emerald-500 border-emerald-500 text-slate-900"
												: "border-slate-500 text-transparent"
										}`}
										aria-label={
											item.done
												? "Marcar tarefa como não concluída"
												: "Marcar tarefa como concluída"
										}
									>
										✓
									</button>

									<div className="flex-1">
										{isEditing ? (
											<input
												type="text"
												className="w-full bg-slate-900/80 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/60"
												value={editingTitle}
												onChange={(e) => setEditingTitle(e.target.value)}
												onBlur={() => saveEditing(item.id)}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														saveEditing(item.id);
													}
													if (e.key === "Escape") {
														e.preventDefault();
														cancelEditing();
													}
												}}
												autoFocus
											/>
										) : (
											<p
												className={`text-xs text-slate-100 ${
													item.done ? "line-through text-slate-500" : ""
												}`}
											>
												{item.title}
											</p>
										)}

										<p className="text-[10px] text-slate-500 mt-1">
											Criada em{" "}
											{new Date(item.createdAt).toLocaleDateString("pt-BR", {
												day: "2-digit",
												month: "2-digit",
											})}
										</p>
									</div>

									<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										{!isEditing && (
											<button
												type="button"
												onClick={() => startEditing(item.id, item.title)}
												className="text-[10px] px-2 py-1 rounded bg-slate-700 text-slate-100 hover:bg-slate-600"
											>
												Editar
											</button>
										)}
										<button
											type="button"
											onClick={() => removeItem(item.id)}
											className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-300 hover:bg-red-500/20"
										>
											Excluir
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			{/* Ações secundárias */}
			{items.length > 0 && (
				<footer className="flex justify-end">
					<button
						type="button"
						onClick={clearAll}
						className="text-[11px] text-slate-400 hover:text-red-300 hover:underline"
					>
						Limpar todas as tarefas
					</button>
				</footer>
			)}
		</section>
	);
}
