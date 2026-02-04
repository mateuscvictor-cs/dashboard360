# Tutorial: CS Owner – Adicionar informações às empresas

Este tutorial mostra como um **CS Owner** adiciona e mantém informações das empresas que atende no Dashboard 360: entregas, hotseats, workshops (com link Fathom), contatos, logo, recursos (links/documentos, ex.: contrato) e onboarding. Tudo na área **CS** (`/cs`).

## Pré-requisitos

- Usuário logado como **CS Owner**.
- Pelo menos uma **empresa atribuída** ao CS Owner (para poder editar; caso contrário, só visualização).
- Aplicação rodando (ex.: `http://localhost:3000` após login).

---

## Passo 1 – Login e painel CS

**Ação:** Fazer login com perfil CS Owner e acessar o painel.

**Print:** Tela inicial após o login, com a sidebar da área CS visível (itens como Minhas Empresas, Entregas, Agenda, etc.).

**Rota:** `/cs`

**Legenda sugerida:** "Painel do CS Owner após o login."

---

## Passo 2 – Acesso à lista de empresas

**Ação:** No menu lateral, clicar em **Minhas Empresas**.

**Print:** Página da lista de empresas com as abas **Minhas** e **Todas** e o campo de busca. Badge com a quantidade de empresas.

**Rota:** `/cs/empresas`

**Legenda sugerida:** "Lista de empresas – abas Minhas e Todas."

---

## Passo 3 – Abrir uma empresa (da qual o CS é responsável)

**Ação:** Clicar em um card de empresa (de preferência uma em que o CS seja responsável, para ver "Pode editar").

**Print:** Página de detalhe da empresa com os quatro cards no topo: **Health Score**, **Workshops**, **Hotseats**, **Última Interação**. Badge "Pode editar" ou "Somente visualização" visível.

**Rota:** `/cs/empresas/[id]`

**Legenda sugerida:** "Detalhe da empresa – métricas e permissão de edição."

---

## Passo 4 – Adicionar entregável

**Ação:** No card **Entregáveis**, clicar em **Adicionar**. Preencher o modal "Novo Entregável" (título, status, impacto, data de entrega, responsável) e salvar.

**Print:** Modal "Novo Entregável" aberto, com os campos preenchidos (título obrigatório, status, impacto, data, responsável).

**Rota:** `/cs/empresas/[id]` (modal na mesma página)

**Legenda sugerida:** "Modal Novo Entregável – preenchimento dos campos."

---

## Passo 5 – Adicionar workshop

**Ação:** Clicar no botão **Novo Workshop**. Preencher o modal: título/tema, descrição, data/hora/duração, participantes, local (online/presencial), link da reunião (se online), **link do Fathom (gravação)** e observações.

**Print:** Modal "Novo Workshop" aberto, com destaque para o campo **Link do Fathom (gravação)** (ex.: `https://fathom.video/...`).

**Rota:** `/cs/empresas/[id]` (modal na mesma página)

**Legenda sugerida:** "Modal Novo Workshop – incluindo link Fathom da gravação."

---

## Passo 6 – Adicionar hotseat

**Ação:** Clicar no botão **Novo Hotseat**. O modal é o mesmo do workshop (título, descrição, data, participantes, local, link da reunião, **link do Fathom**, observações).

**Print:** Modal "Novo Hotseat" aberto, mostrando os mesmos campos do workshop, inclusive link Fathom.

**Rota:** `/cs/empresas/[id]` (modal na mesma página)

**Legenda sugerida:** "Modal Novo Hotseat – link Fathom por evento."

---

## Passo 7 – Adicionar contato

**Ação:** No card **Contatos**, clicar em **Adicionar**. Preencher nome, cargo, email, telefone e marcar "É decisor" se aplicável.

**Print:** Modal "Novo Contato" aberto com os campos: Nome, Cargo, Email, Telefone e checkbox "É decisor".

**Rota:** `/cs/empresas/[id]` (modal na mesma página)

**Legenda sugerida:** "Modal Novo Contato."

---

## Passo 8 – Logo e recursos (contrato / links)

**Ação:** Rolar a página até a seção **Informações Gerais**. Abaixo aparecem **Logo da Empresa** (upload) e o card **Recursos**. Em Recursos, adicionar um recurso tipo **Link** ou **Documento** – por exemplo, título "Contrato" e URL do arquivo ou link.

**Print:** Seção com "Logo da Empresa" (LogoUpload) e o card "Recursos" (ResourceManager) com botão para adicionar recurso; opcionalmente, modal de novo recurso com tipo Documento/Link e campo URL.

**Rota:** `/cs/empresas/[id]` (mesma página, parte inferior)

**Legenda sugerida:** "Logo e Recursos – adicionar contrato ou link como recurso."

---

## Passo 9 – Onboarding

**Ação:** Clicar no botão **Onboarding** na página da empresa.

**Print:** Página de onboarding da empresa com a lista de etapas (ex.: Criação de Grupo, Formulário de Diagnóstico, Reunião de Onboarding, personalizados) e status de cada uma.

**Rota:** `/cs/empresas/[id]/onboarding`

**Legenda sugerida:** "Etapas de onboarding da empresa."

---

## Passo 10 (opcional) – Concluir uma entrega

**Ação:** No card **Entregáveis**, em uma entrega que não esteja concluída, clicar em **Concluir**. Preencher o dialog de conclusão (incluindo link Fathom da reunião, se houver).

**Print:** Dialog de conclusão da entrega aberto, com campos para preencher (ex.: link Fathom da gravação).

**Rota:** `/cs/empresas/[id]` ou `/cs/entregas/[id]`

**Legenda sugerida:** "Dialog de conclusão de entrega – link Fathom opcional."

---

## Passo 11 (opcional) – Detalhe de uma entrega

**Ação:** No menu CS, clicar em **Entregas**. Na lista, abrir uma entrega. Na página da entrega é possível gerenciar reuniões (com link Fathom), documentos e conclusão.

**Print:** Página de detalhe da entrega: abas ou seções para reuniões, documentos, dependências, comentários; exemplo de reunião com link Fathom.

**Rota:** `/cs/entregas` → `/cs/entregas/[id]`

**Legenda sugerida:** "Detalhe da entrega – reuniões e Fathom."

---

## Observações

- **Link Fathom:** Está disponível **por workshop/hotseat** no modal de novo workshop/hotseat. Para um link Fathom geral da empresa, use o **ResourceManager** (recurso tipo Link) na página da empresa.
- **Contrato:** Use o **ResourceManager** na página da empresa: adicione um recurso do tipo **Documento** ou **Link** com título "Contrato" e a URL do arquivo ou link.
- **Edição:** O CS Owner só edita empresas das quais é responsável (`canEdit: true`). Na listagem, use a aba **Minhas** para ver apenas as suas empresas.
