---
name: Migração Better Auth para Auth.js
overview: "Migrar o sistema de autenticação do Better Auth para Auth.js (NextAuth v5), mantendo todas as funcionalidades existentes: login email/senha, verificação de email, reset de senha, roles (ADMIN, CS_OWNER, CLIENT), campos customizados e proteção de rotas por middleware."
todos:
  - id: deps
    content: "Atualizar dependências: remover better-auth, adicionar next-auth@beta, @auth/prisma-adapter, bcryptjs"
    status: completed
  - id: schema
    content: Ajustar schema Prisma para Auth.js Adapter (VerificationToken, Account fields)
    status: completed
  - id: auth-config
    content: Criar auth.config.ts e auth.ts com Credentials Provider e callbacks para roles
    status: completed
  - id: route
    content: Criar nova rota [...nextauth]/route.ts e remover [...all]
    status: completed
  - id: middleware
    content: Reescrever middleware usando auth() do Auth.js
    status: completed
  - id: client
    content: Atualizar auth-client.ts para usar signIn/signOut/useSession do next-auth/react
    status: completed
  - id: server
    content: Atualizar auth-server.ts para usar auth() do Auth.js
    status: completed
  - id: login
    content: Atualizar página de login para usar signIn do next-auth
    status: completed
  - id: context
    content: Adaptar UserContext para usar useSession do next-auth
    status: completed
  - id: password
    content: Implementar rotas customizadas para reset de senha e verificação de email
    status: completed
  - id: cleanup
    content: Remover arquivos do Better Auth e testar fluxos
    status: in_progress
isProject: false
---

# Migração do Better Auth para Auth.js

## Contexto

O Better Auth está apresentando problemas de compatibilidade com o Edge Runtime da Vercel no middleware. O Auth.js (NextAuth v5) é mais maduro e tem integração nativa com Next.js/Vercel.

## Arquitetura Atual vs Nova

```mermaid
flowchart TB
    subgraph atual [Atual - Better Auth]
        BA_Client[auth-client.ts] --> BA_API["[...all]/route.ts"]
        BA_API --> BA_Config[auth.ts]
        BA_Config --> Prisma[(PostgreSQL)]
        MW_Old[middleware.ts] --> BA_API
    end
    
    subgraph nova [Nova - Auth.js]
        AJ_Client[auth-client.ts] --> AJ_Route["[...nextauth]/route.ts"]
        AJ_Route --> AJ_Config[auth.config.ts]
        AJ_Config --> AJ_Adapter[Prisma Adapter]
        AJ_Adapter --> Prisma2[(PostgreSQL)]
        MW_New[middleware.ts] --> AJ_Config
    end
```

## Funcionalidades a Migrar

- Login com email/senha (Credentials Provider)
- Verificação de email (custom)
- Reset de senha (custom)
- Sessões JWT (mais simples para Edge Runtime)
- Roles: ADMIN, CS_OWNER, CLIENT
- Campos customizados: role, csOwnerId, companyId
- Proteção de rotas no middleware

## Mudanças no Schema Prisma

O Auth.js usa nomes de tabelas/campos ligeiramente diferentes. Precisamos adaptar:

- `User` - manter, adicionar campos do Auth.js
- `Session` - manter estrutura atual (compatível)
- `Account` - ajustar campos para padrão Auth.js
- `VerificationToken` - renomear de `Verification`

## Arquivos a Modificar

**Novos arquivos:**

- `src/auth.ts` - Configuração principal do Auth.js
- `src/auth.config.ts` - Configuração para Edge Runtime
- `src/app/api/auth/[...nextauth]/route.ts` - Nova rota

**Arquivos a modificar:**

- `src/lib/auth-client.ts` - Usar hooks do Auth.js
- `src/lib/auth-server.ts` - Usar `auth()` do Auth.js
- `src/middleware.ts` - Usar `auth` do config
- `src/app/page.tsx` - Usar `signIn` do Auth.js
- `src/contexts/user-context.tsx` - Adaptar para Auth.js
- `prisma/schema.prisma` - Ajustar para Auth.js Adapter
- Páginas de esqueci-senha, redefinir-senha, verificar-email

**Arquivos a remover:**

- `src/lib/auth.ts` (Better Auth config)
- `src/app/api/auth/[...all]/route.ts`

## Estratégia de Sessão

Auth.js suporta duas estratégias:

- **JWT** (recomendado para Edge) - Token no cookie, sem consulta ao banco
- **Database** - Sessão armazenada no banco

Usaremos **JWT** para compatibilidade com Edge Runtime da Vercel.

## Dependências

**Remover:**

- `better-auth`
- `@better-fetch/fetch`

**Adicionar:**

- `next-auth@beta` (v5)
- `@auth/prisma-adapter`
- `bcryptjs` (para hash de senha)
- `@types/bcryptjs`