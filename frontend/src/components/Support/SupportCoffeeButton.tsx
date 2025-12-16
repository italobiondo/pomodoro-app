"use client";

import React from "react";

export const SupportCoffeeButton: React.FC = () => {
	return (
		<a
			href="https://ko-fi.com/italobiondo"
			target="_blank"
			rel="noopener noreferrer"
			className="fixed right-4 bottom-4 z-45 inline-flex items-center gap-2 px-4 py-2 rounded-lg btn-primary"
		>
			<span className="text-base" aria-hidden>
				☕︎
			</span>
			<span>Apoiar com um café</span>
		</a>
	);
};

