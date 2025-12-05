Quero continuar o desenvolvimento do meu projeto Pomodoro (timer + to-do + player + plano Pro).

Para isso, preciso que você leia, entenda e considere SEMPRE todo o contexto abaixo.

====================================================================
📘 HISTÓRICO COMPLETO DO PROJETO (todas as sprints, decisões, códigos):
https://pastebin.com/8qvj3bBE
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
.
.editorconfig
.gitignore
backend
backend/.env
backend/.gitignore
backend/.prettierrc
backend/eslint.config.mjs
backend/nest-cli.json
backend/package-lock.json
backend/package.json
backend/prisma
backend/prisma/migrations
backend/prisma/migrations/20251202124830_init_schema
backend/prisma/migrations/20251202124830_init_schema/migration.sql
backend/prisma/migrations/20251203161327_add_task_deleted_at_and_manual_updated_at
backend/prisma/migrations/20251203161327_add_task_deleted_at_and_manual_updated_at/migration.sql
backend/prisma/migrations/20251204123942_add_focus_session
backend/prisma/migrations/20251204123942_add_focus_session/migration.sql
backend/prisma/migrations/migration_lock.toml
backend/prisma/schema.prisma
backend/prisma.config.ts
backend/README.md
backend/src
backend/src/app.controller.spec.ts
backend/src/app.controller.ts
backend/src/app.module.ts
backend/src/app.service.ts
backend/src/config
backend/src/config/config.module.ts
backend/src/generated
backend/src/generated/prisma
backend/src/generated/prisma/client
backend/src/generated/prisma/client/browser.ts
backend/src/generated/prisma/client/client.ts
backend/src/generated/prisma/client/commonInputTypes.ts
backend/src/generated/prisma/client/enums.ts
backend/src/generated/prisma/client/internal
backend/src/generated/prisma/client/internal/class.ts
backend/src/generated/prisma/client/internal/prismaNamespace.ts
backend/src/generated/prisma/client/internal/prismaNamespaceBrowser.ts
backend/src/generated/prisma/client/models
backend/src/generated/prisma/client/models/FocusSession.ts
backend/src/generated/prisma/client/models/Payment.ts
backend/src/generated/prisma/client/models/StatsSummary.ts
backend/src/generated/prisma/client/models/Subscription.ts
backend/src/generated/prisma/client/models/Task.ts
backend/src/generated/prisma/client/models/ThemePreference.ts
backend/src/generated/prisma/client/models/User.ts
backend/src/generated/prisma/client/models.ts
backend/src/infra
backend/src/infra/database
backend/src/infra/database/prisma
backend/src/infra/database/prisma/prisma.module.ts
backend/src/infra/database/prisma/prisma.service.ts
backend/src/main.ts
backend/src/modules
backend/src/modules/auth
backend/src/modules/auth/auth.controller.ts
backend/src/modules/auth/auth.module.ts
backend/src/modules/auth/auth.service.ts
backend/src/modules/auth/auth.types.ts
backend/src/modules/auth/decorators
backend/src/modules/auth/decorators/current-user.decorator.ts
backend/src/modules/auth/guards
backend/src/modules/auth/guards/jwt-auth.guard.ts
backend/src/modules/auth/strategies
backend/src/modules/auth/strategies/google.strategy.ts
backend/src/modules/auth/strategies/jwt.strategy.ts
backend/src/modules/health
backend/src/modules/health/health.controller.ts
backend/src/modules/health/health.module.ts
backend/src/modules/stats
backend/src/modules/stats/dto
backend/src/modules/stats/dto/stats-response.dto.ts
backend/src/modules/stats/stats.controller.ts
backend/src/modules/stats/stats.module.ts
backend/src/modules/stats/stats.service.ts
backend/src/modules/tasks
backend/src/modules/tasks/dto
backend/src/modules/tasks/dto/create-task.dto.ts
backend/src/modules/tasks/dto/sync-tasks.dto.ts
backend/src/modules/tasks/dto/update-task.dto.ts
backend/src/modules/tasks/tasks.controller.ts
backend/src/modules/tasks/tasks.module.ts
backend/src/modules/tasks/tasks.service.ts
backend/src/modules/todos
backend/src/modules/todos/todo.entity.ts
backend/src/modules/todos/todos.controller.ts
backend/src/modules/todos/todos.module.ts
backend/src/modules/todos/todos.service.ts
backend/src/modules/users
backend/src/modules/users/user.entity.ts
backend/src/modules/users/users.module.ts
backend/src/modules/users/users.service.ts
backend/test
backend/test/app.e2e-spec.ts
backend/test/jest-e2e.json
backend/tsconfig.build.json
backend/tsconfig.json
frontend
frontend/.gitignore
frontend/eslint.config.mjs
frontend/next.config.ts
frontend/package-lock.json
frontend/package.json
frontend/postcss.config.cjs
frontend/public
frontend/public/file.svg
frontend/public/globe.svg
frontend/public/next.svg
frontend/public/sounds
frontend/public/sounds/basic-notification.mp3
frontend/public/vercel.svg
frontend/public/window.svg
frontend/README.md
frontend/src
frontend/src/app
frontend/src/app/globals.css
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/app/pro
frontend/src/app/pro/page.tsx
frontend/src/components
frontend/src/components/Auth
frontend/src/components/Auth/SocialLoginButtons.tsx
frontend/src/components/dashboard
frontend/src/components/dashboard/StatsOverviewCard.tsx
frontend/src/components/FreeLayout
frontend/src/components/FreeLayout/FreeAdFooter.tsx
frontend/src/components/FreeLayout/RightColumnFree.tsx
frontend/src/components/Layout
frontend/src/components/Layout/MainHeader.tsx
frontend/src/components/Stats
frontend/src/components/Stats/StatsOverview.tsx
frontend/src/components/Stats/StatsOverviewCard.tsx
frontend/src/components/Stats/StatsOverviewModal.tsx
frontend/src/components/Timer
frontend/src/components/Timer/TimerPanel.tsx
frontend/src/components/Timer/TimerSettingsModal.tsx
frontend/src/components/TodoList
frontend/src/components/TodoList/TodoListCard.tsx
frontend/src/components/TodoList/types.ts
frontend/src/components/YoutubePlayer
frontend/src/components/YoutubePlayer/YoutubePlayer.tsx
frontend/src/hooks
frontend/src/hooks/useAuth.tsx
frontend/src/hooks/useLocalStorage.ts
frontend/src/hooks/useStats.ts
frontend/src/hooks/useStatsOverview.ts
frontend/src/hooks/useTheme.ts
frontend/src/hooks/useTimer.ts
frontend/src/hooks/useTodoList.ts
frontend/src/lib
frontend/src/lib/apiClient.ts
frontend/src/lib/authClient.ts
frontend/src/types
frontend/src/types/stats.ts
frontend/src/types/tasks.ts
frontend/src/types/timer.ts
frontend/src/types/user.ts
frontend/tailwind.config.cjs
frontend/tsconfig.json
infra
infra/.env.example
infra/backend
infra/backend/Dockerfile
infra/db
infra/db/init.sql
infra/docker-compose.yml
infra/frontend
infra/frontend/Dockerfile
package.json
README.md
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
🎯 OBJETIVO INICIAL NESTE NOVO CHAT
Quero continuar:

1. Pendências deixadas para as próximas sprints

Antes de continuarmos, faça o seguinte:

1) Confirme que leu e entendeu TODO o contexto acima.  
2) Liste os próximos passos ideais para avançar.  

Depois disso começamos a implementação.

### Arvore de pastas

find . \( -name 'node_modules' -o -name '.git' -o -name 'dist' \) -prune -o -print | sed 's/^\.\///'

### Migrate

```
cd D:\Projetos Pessoais\pomodoro-app\backend

# 1) Sobrescrever DATABASE_URL apenas para este terminal
$env:DATABASE_URL = "postgresql://pomodoro:pomodoro@localhost:5432/pomodoro_db?schema=public"

# 2) Rodar a migrate dev
npx prisma migrate dev --name add_focus_session

# 3) (Opcional, mas recomendado) regenerar o client
npx prisma generate
```
