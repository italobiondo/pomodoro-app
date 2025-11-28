// frontend/src/app/page.tsx
export default function HomePage() {
	return (
		<div className="w-full max-w-5xl grid gap-6 md:grid-cols-[2fr_1.2fr]">
			<section className="space-y-4">
				<h1 className="text-2xl font-bold">Timer Pomodoro</h1>
				{/* Aqui entra o componente <TimerPanel /> na Sprint 2 */}
				<div className="border rounded-xl p-6 text-sm opacity-70">
					Timer ainda não implementado. Será feito na Sprint 2.
				</div>

				{/* Player YouTube (Sprint 4) */}
				<div className="border rounded-xl p-4 text-sm opacity-70">
					Player de YouTube será implementado na Sprint 4.
				</div>
			</section>

			<section className="space-y-4">
				<h2 className="text-xl font-semibold">To-do</h2>
				{/* Aqui entra o componente <TodoList /> na Sprint 3 */}
				<div className="border rounded-xl p-4 text-sm opacity-70">
					To-do ainda não implementado. Será feito na Sprint 3.
				</div>
			</section>
		</div>
	);
}
