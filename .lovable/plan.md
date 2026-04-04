

## Plano: Persistir Configurações no Banco de Dados + Corrigir erro de build

### Problema atual
1. As configurações (nome da loja, taxa de entrega, impressão) estão salvas apenas no `localStorage`, podendo ser perdidas ao trocar de navegador/dispositivo.
2. Erro de build: `useCustomers.ts` referencia a coluna `addresses` que não existe nos tipos gerados (a tabela no DB já tem essa coluna jsonb, mas os tipos estão desatualizados).

### O que será feito

**1. Criar tabela `settings` no banco de dados**
- Migration SQL criando `public.settings` com colunas: `id`, `key` (TEXT UNIQUE), `value` (TEXT), `updated_at`
- RLS com acesso público (mesmo padrão do projeto)
- Cada configuração será uma linha (key-value): `store_name`, `default_delivery_fee`, `print_paper_width`, `print_margin_top`, `print_margin`, `print_font_size`

**2. Atualizar `useSettings.ts`**
- Trocar localStorage por queries ao banco de dados (Supabase)
- Usar `useQuery` para carregar e `useMutation` para salvar
- Manter fallback para valores padrão caso a tabela esteja vazia

**3. Corrigir erro de build em `useCustomers.ts`**
- O código seleciona `addresses` mas os tipos gerados não reconhecem essa coluna
- Adicionar cast `as unknown as Customer[]` para contornar até os tipos serem regenerados

### Detalhes técnicos

- Tabela `settings` usa padrão key-value (flexível para adicionar novas configs no futuro sem migrations)
- Hook `useSettings` passa a usar `@tanstack/react-query` + Supabase SDK, consistente com o restante do projeto
- Os valores são serializados como TEXT no banco (parseados no hook)

