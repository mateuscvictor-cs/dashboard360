---
name: Onboarding Convites Personalizado
overview: Criar um processo de onboarding em steps personalizado para cada tipo de convite (Cliente, Admin, CS) com upload de foto, definição de senha e mensagens de boas-vindas específicas.
todos:
  - id: welcome-step
    content: Criar componente WelcomeStep com mensagens personalizadas por tipo
    status: completed
  - id: account-step
    content: Criar componente AccountStep com campos de nome e senha
    status: completed
  - id: photo-step
    content: Criar componente PhotoStep com upload de avatar
    status: completed
  - id: complete-step
    content: Criar componente CompleteStep com animação de sucesso
    status: completed
  - id: rewrite-page
    content: Reescrever página de convite com Wizard e steps
    status: completed
  - id: update-api
    content: Atualizar API accept para salvar imagem do usuário
    status: completed
isProject: false
---

# Processo de Onboarding para Convites

## Contexto

A página atual de convite (`src/app/(auth)/convite/page.tsx`) possui o formulário de cadastro, mas precisa ser transformada em um processo de onboarding com múltiplos steps e experiência personalizada por tipo de usuário.

O projeto já possui:

- Componente `Wizard` em [src/components/ui/wizard.tsx](src/components/ui/wizard.tsx)
- Lógica de upload de avatar em [src/components/settings/profile-settings.tsx](src/components/settings/profile-settings.tsx)

---

## Estrutura do Onboarding

### Steps por Tipo de Convite

**Cliente (COMPANY_ADMIN):**

1. Boas-vindas - Apresentação da empresa e plataforma
2. Criar conta - Nome e senha
3. Foto de perfil - Upload opcional
4. Conclusão - Resumo e acesso

**Admin (MEMBER_ADMIN):**

1. Boas-vindas - Bem-vindo à equipe administrativa
2. Criar conta - Nome e senha
3. Foto de perfil - Upload opcional
4. Conclusão - Acesso ao painel admin

**CS Owner (MEMBER_CS):**

1. Boas-vindas - Bem-vindo à equipe de CS
2. Criar conta - Nome e senha
3. Foto de perfil - Upload opcional
4. Conclusão - Acesso ao painel CS

---

## Implementação

### 1. Reescrever página de convite

**Arquivo:** [src/app/(auth)/convite/page.tsx](src/app/\\(auth)/convite/page.tsx)

Estrutura com steps:

- State para controlar step atual
- Componente Wizard para mostrar progresso
- AnimatePresence para transições suaves entre steps

### 2. Componentes de cada Step

**Step 1 - Boas-vindas:**

- Ilustração/ícone grande personalizado por tipo
- Mensagem de boas-vindas específica
- Nome da empresa (se cliente)
- Botão "Começar"

**Step 2 - Criar conta:**

- Campo nome completo
- Campo senha com toggle de visibilidade
- Campo confirmar senha
- Indicador de força da senha
- Validações em tempo real

**Step 3 - Foto de perfil:**

- Upload de imagem com preview
- Opção de usar iniciais como avatar
- Crop/ajuste básico
- Botão "Pular" para tornar opcional

**Step 4 - Conclusão:**

- Checkmark animado de sucesso
- Resumo das informações
- Mensagem personalizada por tipo
- Botão "Acessar plataforma"

---

## Fluxo Visual

```mermaid
flowchart TD
A[Acessa link do convite] --> B{Token válido?}
B -->|Não| C[Tela de erro]
B -->|Sim| D[Step 1: Boas-vindas]
D --> E[Step 2: Criar conta]
E --> F[Step 3: Foto de perfil]
F --> G[Step 4: Conclusão]
G --> H[Redireciona para login]

subgraph step1 [Boas-vindas]
D1[Ilustração personalizada]
D2[Mensagem por tipo]
D3[Info da empresa se cliente]
end

subgraph step2 [Criar Conta]
E1[Nome completo]
E2[Senha + confirmação]
E3[Validações]
end

subgraph step3 [Foto]
F1[Upload imagem]
F2[Preview]
F3[Opcional - pular]
end