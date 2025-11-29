"use client";

import React from "react";
import { TodoListCard } from "@/components/TodoList/TodoListCard";

export const RightColumnFree: React.FC = () => {
	return (
		<aside className="space-y-4 pb-8">
			{/* To-do List (Sprint 3) */}
			<TodoListCard />

			{/* Player de YouTube (stub) */}
			<section className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
				<header className="flex items-center justify-between mb-2">
					<div>
						<h2 className="text-sm font-semibold text-slate-100">
							Player de YouTube
						</h2>
						<p className="text-xs text-slate-400">
							Conecte lo-fi, white noise ou sua playlist favorita.
						</p>
					</div>
					<span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
						Em breve
					</span>
				</header>

				<div className="space-y-3 text-xs text-slate-400">
					<div className="aspect-video w-full rounded-lg bg-slate-900 border border-dashed border-slate-700 flex items-center justify-center text-[11px] text-slate-500">
						Prévia do player
					</div>

					<div className="flex gap-2">
						<input
							disabled
							type="url"
							placeholder="Cole aqui o link do vídeo ou playlist..."
							className="flex-1 rounded-lg bg-slate-900/60 border border-dashed border-slate-700 px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed"
						/>
						<button
							type="button"
							disabled
							className="px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] text-slate-400 border border-slate-700 cursor-not-allowed"
						>
							Usar
						</button>
					</div>

					<p className="text-[11px] text-slate-500">
						No lançamento desta funcionalidade, o player será totalmente
						integrado ao timer, sem anúncios extras além do próprio YouTube.
					</p>
				</div>
			</section>

			{/* Anúncio leve (Free) */}
			<section className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-xs text-slate-400">
				<p className="font-semibold text-slate-200 text-sm mb-1">
					Anúncio leve aqui (Free)
				</p>
				<p className="mb-1">
					Espaço reservado para um anúncio discreto, sem distrações.
				</p>
				<ul className="list-disc list-inside space-y-1 text-[11px]">
					<li>Sem pop-ups.</li>
					<li>Sem banners piscando.</li>
					<li>Sempre respeitando o foco do usuário.</li>
				</ul>
			</section>
		</aside>
	);
};
