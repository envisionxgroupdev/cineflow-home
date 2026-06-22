## Sistema de Tickets de Reporte

Transforma reportes em tickets com conversa entre usuário e admin, acompanhamento pelo perfil, e gestão completa no painel admin.

### Regras de negócio
- Usuário precisa estar logado para reportar (botão de reportar leva ao login se deslogado).
- Cada reporte vira um **ticket** com status: `open`, `in_progress`, `resolved`, `closed`.
- Usuário e admin podem trocar mensagens dentro do ticket.
- Usuário acompanha seus tickets em uma nova aba no perfil (/profile).
- Admin responde, muda status, e fecha tickets na aba "Reportes" (renomeada para "Tickets").
- A aba "Mensagens" do painel admin é removida (junto da rota de contato? — **mantenho a tabela contact_messages mas removo só a aba do admin**, conforme pedido).

### Banco de dados (migração)

**Reaproveitar `reports` como tabela de tickets**, adicionando:
- `user_id uuid` (autor, FK auth.users) — obrigatório
- `status` expande para: `open | in_progress | resolved | closed`
- `last_message_at timestamptz`
- `unread_for_admin bool`, `unread_for_user bool`

Nova tabela **`ticket_messages`**:
- `id`, `ticket_id` (FK reports), `sender_id` (FK auth.users), `is_admin bool`, `body text`, `created_at`
- RLS: usuário lê/escreve mensagens dos próprios tickets; admin lê/escreve em todos.
- Trigger: ao inserir mensagem, atualiza `last_message_at` e flags de não-lido do ticket.

RLS de `reports` ajustada:
- SELECT/INSERT: usuário dono (`user_id = auth.uid()`)
- SELECT/UPDATE/DELETE: admin (via `has_role`)
- INSERT exige `user_id = auth.uid()`

GRANTs para `authenticated` e `service_role` em ambas as tabelas.

### Frontend

**`ReportModal.tsx`** (atualizar):
- Se não logado: mostra CTA "Faça login para reportar" com link para /login.
- Se logado: campos atuais (motivo, detalhes) + cria ticket com `user_id`, status `open`, e a primeira mensagem em `ticket_messages`.

**Novo `src/components/TicketChat.tsx`**:
- Lista mensagens do ticket em estilo chat (bolhas usuário/admin).
- Input para nova mensagem.
- Reutilizado no perfil e no admin.

**`src/pages/Profile.tsx`** (adicionar aba "Meus Tickets"):
- Lista tickets do usuário com status, último update, badge de não-lido.
- Click abre TicketChat em um modal/drawer.

**`src/components/admin/ReportsManagement.tsx`** (renomear visualmente para "Tickets"):
- Lista todos os tickets, filtros por status, badge de não-lido para admin.
- Click abre TicketChat com controles extras: mudar status, marcar resolvido, fechar.

**`src/pages/Admin.tsx`**:
- Remover aba "Mensagens" (ContactMessagesManagement) do menu.
- Renomear "Reportes" → "Tickets".

### Arquivos afetados
- nova migração SQL
- `src/components/ReportModal.tsx` (editar)
- `src/components/TicketChat.tsx` (novo)
- `src/pages/Profile.tsx` (editar — nova aba)
- `src/components/admin/ReportsManagement.tsx` (reescrever para tickets)
- `src/pages/Admin.tsx` (remover aba mensagens, renomear)
- `src/types/database.ts` (tipos Ticket/TicketMessage)

### Fora de escopo
- Não removo a tabela `contact_messages` nem a página /contact pública (só tiro do admin, como pedido).
- Não mexo em anúncios/whitelist.

Posso seguir?
