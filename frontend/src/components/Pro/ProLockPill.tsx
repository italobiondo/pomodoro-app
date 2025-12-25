"use client";

import React from "react";
import { Lock } from "lucide-react";

type ProLockPillProps = {
	locked: boolean;
};

export const ProLockPill: React.FC<ProLockPillProps> = ({ locked }) => {
	if (!locked) {
		return (
			<span className="text-[10px] px-2 py-0.5 rounded-full border border-soft text-muted whitespace-nowrap">
				Premium
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-soft text-muted whitespace-nowrap">
			<Lock className="h-3 w-3" aria-hidden />
			Pro
		</span>
	);
};
