import { TimerPanel } from "@/components/Timer/TimerPanel";
import { RightColumnFree } from "@/components/FreeLayout/RightColumnFree";
import { YoutubePlayer } from "@/components/YoutubePlayer/YoutubePlayer";
import { FreeAdFooter } from "@/components/FreeLayout/FreeAdFooter";
import { MainHeader } from "@/components/Layout/MainHeader";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
			{/* Header */}
			<MainHeader />

			{/* Conteúdo principal */}
			<div className="w-full max-w-4xl mx-auto grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-stretch pt-4">

				<div className="flex flex-col items-center gap-4 px-4">
					<div className="w-full max-w-md">
						<TimerPanel />
					</div>

					<div className="w-full max-w-md">
						<YoutubePlayer />
					</div>
				</div>

				<RightColumnFree />
			</div>

			{/* Rodapé de anúncio — só aparece quando rolar a página */}
			<FreeAdFooter />
		</main>
	);
}
