

## Plano: Página de Produtos + Sistema de Adicionais

### O que será feito

**1. Página de Gestão de Produtos**
- Criar uma página similar à de Clientes, listando todos os produtos cadastrados (código, nome, preço)
- Permitir editar nome e preço de qualquer produto
- Permitir cadastrar novos produtos e excluir existentes
- Busca por nome ou código
- Botão "Produtos" no header da página principal

**2. Tabela de Adicionais no banco de dados**
- Criar tabela `addons` com campos: `id`, `code` (SERIAL), `name`, `price`, `created_at`
- RLS público (mesmo padrão das outras tabelas)

**3. Página/seção de Gestão de Adicionais**
- CRUD completo para adicionais (cadastrar, editar, excluir) — dentro da própria página de Produtos ou como aba separada
- Botão "+" para cadastro rápido

**4. Seletor de Adicionais no formulário de pedido**
- Substituir o campo numérico "Adicional (R$)" por um menu de seleção múltipla
- Ao selecionar adicionais, o preço é somado automaticamente ao item
- Exibir os adicionais selecionados com seus valores

### Detalhes técnicos

| Componente | Arquivo |
|---|---|
| Migration SQL | Nova migration: tabela `addons` |
| Hook de produtos (CRUD) | Atualizar `src/hooks/useProducts.ts` com mutations |
| Hook de adicionais | Novo `src/hooks/useAddons.ts` |
| Página de produtos | Novo `src/components/ProductsPage.tsx` |
| Formulário de pedido | Editar `src/components/NewOrderForm.tsx` |
| Tipo OrderItem | Editar `src/types/order.ts` — adicionar `addons: { name, price }[]` |
| Navegação | Editar `src/pages/Index.tsx` — adicionar view "products" |

### Fluxo do usuário

1. Header → botão **"Produtos"** → lista todos os produtos com busca, edição inline de preço/nome
2. Na mesma página, seção **"Adicionais"** com listagem e botão "+" para cadastrar
3. No formulário de pedido, cada item terá um dropdown multi-select para escolher adicionais cadastrados, com preço somado automaticamente

