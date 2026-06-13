## Escopo

1. **Excluir usuário** no painel admin (deleta `auth.users` + cascata).
2. **Melhorar banimento**: usuário banido é deslogado imediatamente e bloqueado em todas as páginas (não só login).
3. **1 conta por IP**: registrar IP no cadastro e bloquear se já existir conta com aquele IP.
4. **Anti-spam no registro**: honeypot + delay mínimo + validação zod + reCAPTCHA já existente reforçado.
5. **Bloqueio total para banidos**: gate global que checa `is_banned` em qualquer rota.
6. **Redesign do painel admin**: layout mais limpo, cards de stats, tabela de usuários melhor, badges consistentes, espaçamento e tipografia revistos.

## Implementação

### Backend (migration + edge functions)
- Nova tabela `signup_ips` (user_id, ip, created_at) com RLS (só admin lê, service_role escreve).
- Adicionar coluna/uso da role `banned` já existente em `user_roles` (já implementado).
- Edge function **`signup-guard`** (público): recebe `{email, password, displayName, recaptchaToken}`, captura IP do header, valida:
  - reCAPTCHA score
  - honeypot vazio
  - tempo mínimo de preenchimento
  - IP não usado antes
  - Cria usuário via service role e insere em `signup_ips`.
- Edge function **`admin-delete-user`** (admin only): deleta usuário via service role (cascata limpa profiles/roles/watchlist).

### Frontend
- `src/pages/Login.tsx`: trocar `signUp` direto por chamada à edge `signup-guard`; adicionar honeypot e timestamp.
- `src/hooks/useAuth.ts`: já desloga banidos no checkRoles — adicionar polling/realtime para banimento ao vivo.
- Novo componente `BannedGate.tsx` em `App.tsx` para bloquear toda a app se `isBanned`.
- `src/components/admin/UserManagement.tsx` e `UserDetailModal.tsx`: botão "Excluir usuário" com confirmação, melhorias visuais.
- `src/pages/Admin.tsx` + subcomponentes: redesign — sidebar mais limpa, header com breadcrumb, cards padronizados, melhor hierarquia tipográfica, espaçamentos consistentes.

### Detalhes técnicos
- IP captado em edge function via `x-forwarded-for`.
- `admin-delete-user` valida JWT do chamador e checa `has_role(uid, 'admin')` antes de executar.
- Banidos: hook escuta `postgres_changes` em `user_roles` do próprio user; se aparecer `banned`, `signOut()` + tela de bloqueio.

## Perguntas rápidas

1. Quer que **admins existentes** também passem pela checagem de 1-IP? (Recomendo: não — só novos cadastros, e admin pode forçar criação manual.)
2. Posso ignorar a regra de 1-IP em ambiente local/preview pra não travar testes?

Posso seguir com tudo isso?
