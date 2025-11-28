import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
	const [value, setValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			// Render no servidor: apenas retorna o valor inicial
			return initialValue;
		}

		try {
			const item = window.localStorage.getItem(key);
			return item !== null ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			console.error(`Erro ao ler localStorage[${key}]`, error);
			return initialValue;
		}
	});

	// Efeito só para salvar quando o value mudar
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Erro ao salvar localStorage[${key}]`, error);
		}
	}, [key, value]);

	return [value, setValue] as const;
}
