"use client";

import { FormEvent, useRef, useState } from "react";
import { useTodoList } from "../../hooks/useTodoList";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/useAuth";
import {
	Check,
	ClipboardList,
	Eraser,
	Pencil,
	Plus,
	Trash2,
} from "lucide-react";

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
		error,
		isServerMode,
	} = useTodoList();

	const [newTitle, setNewTitle] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingTitle, setEditingTitle] = useState("");
	const { isPro } = useAuth();
	const isExpiredLike = !isPro && (isServerMode || items.length > maxTasks);

	const newTaskInputRef = useRef<HTMLInputElement | null>(null);

	// Guarda refs do botão "toggle done" por item, para restaurar foco após ações (delete, etc.)
	const toggleBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

	// Para devolver foco após salvar/cancelar edição
	const editReturnFocusRef = useRef<HTMLElement | null>(null);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!newTitle.trim()) return;

		void addItem(newTitle);
		setNewTitle("");
	}

	function handleToggleDone(id: string, done: boolean) {
		void toggleDone(id);

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
		// guarda o elemento que estava com foco (normalmente o botão "Editar")
		const active = document.activeElement;
		editReturnFocusRef.current = active instanceof HTMLElement ? active : null;

		setEditingId(id);
		setEditingTitle(currentTitle);
	}

	function saveEditing(id: string) {
		if (!editingId) return;

		void updateItemTitle(id, editingTitle);

		setEditingId(null);
		setEditingTitle("");

		// devolve foco para o botão que iniciou a edição (ou fallback)
		setTimeout(() => {
			editReturnFocusRef.current?.focus();
			editReturnFocusRef.current = null;
		}, 0);
	}

	function cancelEditing() {
		setEditingId(null);
		setEditingTitle("");

		setTimeout(() => {
			editReturnFocusRef.current?.focus();
			editReturnFocusRef.current = null;
		}, 0);
	}

	return (
		<section className="max-h-[854px] card-main p-4 flex flex-col gap-4">
			<header className="flex items-start justify-between gap-2">
				<div>
					<h2 className="text-sm font-semibold text-secondary flex items-center gap-2">
						<ClipboardList className="h-4 w-4" aria-hidden />
						Sua lista de tarefas
					</h2>
					<p className="text-xs text-muted mt-1">
						{isPro
							? "Organize até 100 tarefas no plano Pro."
							: isExpiredLike
							? "Seu Pro expirou: você pode gerenciar suas tarefas salvas, mas só cria novas quando tiver até 10."
							: "Organize até 10 tarefas no plano Free."}
					</p>
				</div>

				<span
					className={
						"text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap leading-none " +
						(isPro
							? "border-amber-400 bg-amber-400/10 text-amber-400"
							: "border-emerald-500 bg-emerald-500/10 text-emerald-600")
					}
				>
					{isPro ? "PRO" : isExpiredLike ? "FREE • EX-PRO" : "FREE"}
				</span>
			</header>

			{/* Mensagem de erro da API / limite de tasks */}
			{error && (
				<div className="text-[11px] text-red-500 bg-red-500/5 border border-red-500/40 rounded-md px-3 py-2">
					{error}
				</div>
			)}

			{/* Formulário de nova tarefa */}
			<form onSubmit={handleSubmit} className="flex gap-2">
				<input
					ref={newTaskInputRef}
					type="text"
					maxLength={255}
					className="flex-1 rounded-lg bg-soft border border-soft px-3 py-1.5 text-xs text-secondary placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
					placeholder={
						canAddMore
							? "Digite uma tarefa e pressione Enter"
							: "Limite de tarefas atingido"
					}
					aria-label="Nova tarefa"
					value={newTitle}
					onChange={(e) => setNewTitle(e.target.value)}
					disabled={!canAddMore}
				/>
				<button
					type="submit"
					disabled={!canAddMore || !newTitle.trim()}
					className="text-xs px-3 py-2 rounded-lg btn-primary inline-flex items-center gap-1.5 ui-clickable"
				>
					<Plus className="h-4 w-4" aria-hidden />
					Add
				</button>
			</form>

			{/* Mensagem de limite / slots restantes */}
			<div className="text-[11px] text-muted flex justify-between items-center">
				<span>
					{items.length} / {maxTasks} tarefas
				</span>
				<span>
					{remainingSlots > 0
						? `${remainingSlots} vaga(s) restante(s)`
						: isPro
						? "Você atingiu o limite de tarefas do plano Pro."
						: isExpiredLike
						? "Seu Pro expirou: reduza para até 10 para criar novas, ou reative o Pro."
						: "Você atingiu o limite de tarefas do plano Free."}
				</span>
			</div>

			{/* Lista de tarefas */}
			<div className="flex-1 min-h-0 overflow-y-auto custom-scroll">
				{items.length === 0 ? (
					<p className="text-xs text-muted italic">
						Nenhuma tarefa ainda. Crie a primeira para começar seu foco ✨
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{items.map((item) => {
							const isEditing = editingId === item.id;

							return (
								<li
									key={item.id}
									className="group flex items-start gap-2 rounded-lg border border-soft bg-soft px-3 py-2"
								>
									<button
										ref={(el) => {
											toggleBtnRefs.current[item.id] = el;
										}}
										type="button"
										onClick={() => handleToggleDone(item.id, item.done)}
										className={`mt-0.5 h-4 w-4 rounded-full border flex items-center justify-center text-[10px] ui-clickable transition-colors ${
											item.done
												? "bg-emerald-500 border-emerald-500 text-secondary"
												: "border-soft bg-soft text-transparent hover:border-emerald-500/60"
										}`}
										aria-label={
											item.done
												? "Marcar tarefa como não concluída"
												: "Marcar tarefa como concluída"
										}
									>
										<Check className="h-3 w-3" aria-hidden />
									</button>

									<div className="flex-1">
										{isEditing ? (
											<input
												type="text"
												maxLength={255}
												className="w-full ui-input-compact"
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
												className={`text-xs ${
													item.done
														? "line-through text-muted"
														: "text-secondary"
												}`}
											>
												{item.title}
											</p>
										)}

										<p className="text-[10px] text-muted mt-1">
											Criada em{" "}
											{new Date(item.createdAt).toLocaleDateString("pt-BR", {
												day: "2-digit",
												month: "2-digit",
											})}
										</p>
									</div>

									<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
										{!isEditing && (
											<button
												type="button"
												onClick={() => startEditing(item.id, item.title)}
												className="text-[10px] inline-flex items-center gap-1 ui-btn-soft"
											>
												<Pencil className="h-3 w-3" aria-hidden />
												Editar
											</button>
										)}
										<button
											type="button"
											onClick={() => removeItemAndPreserveFocus(item.id)}
											className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 inline-flex items-center gap-1 ui-clickable"
										>
											<Trash2 className="h-3 w-3" aria-hidden />
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
						onClick={clearAllAndPreserveFocus}
						className="text-[11px] text-muted hover:text-red-500 hover:underline inline-flex items-center gap-1"
					>
						<Eraser className="h-4 w-4" aria-hidden />
						Limpar todas as tarefas
					</button>
				</footer>
			)}
		</section>
	);
	function removeItemAndPreserveFocus(id: string) {
		// Decide para onde o foco vai após a remoção:
		// - próximo item da lista (mesmo índice)
		// - senão, item anterior
		// - senão, input de nova tarefa
		const ids = items.map((i) => i.id);
		const idx = ids.indexOf(id);

		const nextId =
			idx >= 0 && idx < ids.length - 1
				? ids[idx + 1]
				: idx > 0
				? ids[idx - 1]
				: null;

		void removeItem(id);

		setTimeout(() => {
			if (nextId && toggleBtnRefs.current[nextId]) {
				toggleBtnRefs.current[nextId]?.focus();
				return;
			}
			newTaskInputRef.current?.focus();
		}, 0);
	}

	function clearAllAndPreserveFocus() {
		void clearAll();

		setTimeout(() => {
			newTaskInputRef.current?.focus();
		}, 0);
	}
}
