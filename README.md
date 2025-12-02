Quero continuar o desenvolvimento do meu projeto Pomodoro (timer + to-do + player + plano Pro).

Para isso, preciso que você leia, entenda e considere SEMPRE todo o contexto abaixo.

====================================================================
📘 HISTÓRICO COMPLETO DO PROJETO (todas as sprints, decisões, códigos):
https://pastebin.com/p7Jnwxhr
====================================================================

Caso tenha qualquer dúvida ou precise validar alguma decisão,
aqui estão as documentações oficiais do projeto:

📄 Levantamento de Requisitos:
https://pastebin.com/4guRTDaH

🏗️ Arquitetura do Sistema (2 partes):
https://pastebin.com/mCzDjDs8
https://pastebin.com/skt1QRtv

====================================================================
📂 ÁRVORE DO PROJETO (referência atual)
```
pomodoro-app
 ┣ backend
 ┃ ┣ prisma
 ┃ ┣ src
 ┃ ┃ ┣ common
 ┃ ┃ ┃ ┣ dtos
 ┃ ┃ ┃ ┣ filters
 ┃ ┃ ┃ ┣ guards
 ┃ ┃ ┃ ┗ interceptors
 ┃ ┃ ┣ config
 ┃ ┃ ┃ ┗ config.module.ts
 ┃ ┃ ┣ infra
 ┃ ┃ ┃ ┣ cache
 ┃ ┃ ┃ ┣ database
 ┃ ┃ ┃ ┃ ┗ prisma
 ┃ ┃ ┃ ┗ payments
 ┃ ┃ ┣ modules
 ┃ ┃ ┃ ┣ admin
 ┃ ┃ ┃ ┣ auth
 ┃ ┃ ┃ ┃ ┣ decorators
 ┃ ┃ ┃ ┃ ┃ ┗ current-user.decorator.ts
 ┃ ┃ ┃ ┃ ┣ guards
 ┃ ┃ ┃ ┃ ┃ ┗ jwt-auth.guard.ts
 ┃ ┃ ┃ ┃ ┣ strategies
 ┃ ┃ ┃ ┃ ┃ ┣ google.strategy.ts
 ┃ ┃ ┃ ┃ ┃ ┗ jwt.strategy.ts
 ┃ ┃ ┃ ┃ ┣ auth.controller.ts
 ┃ ┃ ┃ ┃ ┣ auth.module.ts
 ┃ ┃ ┃ ┃ ┣ auth.service.ts
 ┃ ┃ ┃ ┃ ┗ auth.types.ts
 ┃ ┃ ┃ ┣ health
 ┃ ┃ ┃ ┃ ┣ health.controller.ts
 ┃ ┃ ┃ ┃ ┗ health.module.ts
 ┃ ┃ ┃ ┣ stats
 ┃ ┃ ┃ ┣ subscriptions
 ┃ ┃ ┃ ┣ tasks
 ┃ ┃ ┃ ┣ timer
 ┃ ┃ ┃ ┣ todos
 ┃ ┃ ┃ ┃ ┣ todo.entity.ts
 ┃ ┃ ┃ ┃ ┣ todos.controller.ts
 ┃ ┃ ┃ ┃ ┣ todos.module.ts
 ┃ ┃ ┃ ┃ ┗ todos.service.ts
 ┃ ┃ ┃ ┗ users
 ┃ ┃ ┃ ┃ ┣ user.entity.ts
 ┃ ┃ ┃ ┃ ┣ users.module.ts
 ┃ ┃ ┃ ┃ ┗ users.service.ts
 ┃ ┃ ┣ app.controller.spec.ts
 ┃ ┃ ┣ app.controller.ts
 ┃ ┃ ┣ app.module.ts
 ┃ ┃ ┣ app.service.ts
 ┃ ┃ ┗ main.ts
 ┃ ┣ test
 ┃ ┃ ┣ app.e2e-spec.ts
 ┃ ┃ ┗ jest-e2e.json
 ┃ ┣ .env
 ┃ ┣ .gitignore
 ┃ ┣ .prettierrc
 ┃ ┣ eslint.config.mjs
 ┃ ┣ nest-cli.json
 ┃ ┣ package-lock.json
 ┃ ┣ package.json
 ┃ ┣ README.md
 ┃ ┣ tsconfig.build.json
 ┃ ┗ tsconfig.json
 ┣ docs
 ┣ frontend
 ┃ ┣ public
 ┃ ┃ ┣ sounds
 ┃ ┃ ┃ ┗ basic-notification.mp3
 ┃ ┃ ┣ file.svg
 ┃ ┃ ┣ globe.svg
 ┃ ┃ ┣ next.svg
 ┃ ┃ ┣ vercel.svg
 ┃ ┃ ┗ window.svg
 ┃ ┣ src
 ┃ ┃ ┣ app
 ┃ ┃ ┃ ┣ auth
 ┃ ┃ ┃ ┃ ┗ callback
 ┃ ┃ ┃ ┣ pro
 ┃ ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┃ ┣ globals.css
 ┃ ┃ ┃ ┣ layout.tsx
 ┃ ┃ ┃ ┗ page.tsx
 ┃ ┃ ┣ components
 ┃ ┃ ┃ ┣ Ads
 ┃ ┃ ┃ ┣ Auth
 ┃ ┃ ┃ ┃ ┗ SocialLoginButtons.tsx
 ┃ ┃ ┃ ┣ FreeLayout
 ┃ ┃ ┃ ┃ ┣ FreeAdFooter.tsx
 ┃ ┃ ┃ ┃ ┗ RightColumnFree.tsx
 ┃ ┃ ┃ ┣ Layout
 ┃ ┃ ┃ ┃ ┗ MainHeader.tsx
 ┃ ┃ ┃ ┣ ThemeSwitcher
 ┃ ┃ ┃ ┣ Timer
 ┃ ┃ ┃ ┃ ┣ TimerPanel.tsx
 ┃ ┃ ┃ ┃ ┗ TimerSettingsModal.tsx
 ┃ ┃ ┃ ┣ TodoList
 ┃ ┃ ┃ ┃ ┣ TodoListCard.tsx
 ┃ ┃ ┃ ┃ ┗ types.ts
 ┃ ┃ ┃ ┣ ui
 ┃ ┃ ┃ ┗ YoutubePlayer
 ┃ ┃ ┃ ┃ ┗ YoutubePlayer.tsx
 ┃ ┃ ┣ hooks
 ┃ ┃ ┃ ┣ useAuth.tsx
 ┃ ┃ ┃ ┣ useLocalStorage.ts
 ┃ ┃ ┃ ┣ useTheme.ts
 ┃ ┃ ┃ ┣ useTimer.ts
 ┃ ┃ ┃ ┗ useTodoList.ts
 ┃ ┃ ┣ lib
 ┃ ┃ ┃ ┣ apiClient.ts
 ┃ ┃ ┃ ┗ authClient.ts
 ┃ ┃ ┗ types
 ┃ ┃ ┃ ┣ tasks.ts
 ┃ ┃ ┃ ┣ timer.ts
 ┃ ┃ ┃ ┗ user.ts
 ┃ ┣ .gitignore
 ┃ ┣ eslint.config.mjs
 ┃ ┣ next-env.d.ts
 ┃ ┣ next.config.ts
 ┃ ┣ package-lock.json
 ┃ ┣ package.json
 ┃ ┣ postcss.config.cjs
 ┃ ┣ README.md
 ┃ ┣ tailwind.config.cjs
 ┃ ┣ tsconfig.json
 ┃ ┗ tsconfig.tsbuildinfo
 ┣ infra
 ┃ ┣ backend
 ┃ ┃ ┗ Dockerfile
 ┃ ┣ db
 ┃ ┃ ┗ init.sql
 ┃ ┣ frontend
 ┃ ┃ ┗ Dockerfile
 ┃ ┣ .env
 ┃ ┣ .env.example
 ┃ ┗ docker-compose.yml
 ┣ .editorconfig
 ┣ .gitignore
 ┣ package.json
 ┗ README.md
```

====================================================================

### 🎭 PAPEL QUE VOCÊ DEVE ASSUMIR
Atue como um profissional combinando estes papéis:

1. **Desenvolvedor Full-Stack Sênior (Next.js, NestJS, PostgreSQL, Redis)**
2. **Arquiteto de Software especialista em sistemas distribuídos**
3. **Especialista em Segurança da Informação (OWASP, mitigação de ataques)**
4. **UX/UI Engineer profissional**
5. **Revisor técnico com foco em integridade e consistência**

Você deve sempre cruzar informações entre:
• O histórico  
• A arquitetura  
• Os requisitos  
• O modelo de negócios Free/Pro  

====================================================================
📏 REGRAS DE RESPOSTA (SEMPRE seguir)
- Sempre indique o caminho COMPLETO do arquivo (ex: backend/src/...).
- Sempre explique claramente onde o código deve ser inserido.
- Sempre indique se um trecho substitui ou adiciona conteúdo.
- Nunca assuma estrutura implícita: detalhe completamente.
- Sempre alinhe a solução com requisitos, arquitetura e histórico.
- Sempre aponte riscos, bugs potenciais e melhorias de segurança.

====================================================================
🎯 OBJETIVO INICIAL NESTE NOVO CHAT (Sprint 6)
Quero continuar a Sprint 6, especificamente:

1. Finalizar integração do backend NestJS com PostgreSQL.
2. Criar models, migrations e services (ORM).
3. Implementar API real de Tasks (incluindo limites Free vs Pro).
4. Preparar sincronização de tasks para contas Pro.
5. Garantir que o backend esteja funcionando via docker-compose.

Antes de continuarmos, faça o seguinte:

1) Confirme que leu e entendeu TODO o contexto acima.  
2) Liste os próximos passos ideais para avançar a Sprint 6.  

Depois disso começamos a implementação.
