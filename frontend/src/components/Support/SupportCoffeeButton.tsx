"use client";

import React from "react";

export const SupportCoffeeButton: React.FC = () => {
	return (
		<a
			href="https://ko-fi.com/italobiondo"
			target="_blank"
			rel="noopener noreferrer"
			className="fixed right-4 bottom-4 z-45 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg bg-emerald-700 text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-background ui-clickable"
		>
			<span className="text-base" aria-hidden>
				☕
			</span>
			<span>Apoiar com um café</span>
		</a>
	);
};
