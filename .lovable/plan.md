

## Plano: Aplicar migration de Categorias

O código já está sincronizado do GitHub (hooks, componentes, etc.), mas a migration SQL ainda não foi executada no banco de dados.

### O que será feito

Aplicar a migration `20260403000000_categories_init.sql` que:

1. **Cria a tabela `categories`** com campos `id` (UUID), `name` (TEXT UNIQUE) e `created_at`
2. **Adiciona coluna `category_id`** na tabela `products` (FK para `categories`)
3. **Adiciona coluna `category_id`** na tabela `addons` (FK para `categories`)
4. **Configura RLS** com acesso público (mesmo padrão das outras tabelas)

### Detalhes técnicos

A migration será executada via ferramenta de migração do banco de dados com o SQL exato que já está no arquivo `supabase/migrations/20260403000000_categories_init.sql`.

Nenhuma alteração de código é necessária — os arquivos já vieram atualizados do GitHub (`useCategories.ts`, `ProductsPage.tsx`, `NewOrderForm.tsx`, etc.).

