import axios from "axios";

/**
 * Base URL da API do backend.
 *
 * Em dev:
 * - Se NEXT_PUBLIC_API_BASE_URL estiver setada, usamos ela.
 * - Caso contrário, usamos http://localhost:4000/api (backend rodando na 4000).
 *
 * Em produção, você pode sobrescrever via variável de ambiente.
 */
const baseURL =
	process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const authClient = axios.create({
	baseURL,
	withCredentials: true, // envia cookies (access_token) nas requests
	headers: {
		"Content-Type": "application/json",
	},
});
