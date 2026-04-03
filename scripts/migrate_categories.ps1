$SupabaseUrl = "https://mcgjaewtjxwzuikeboie.supabase.co"
$SupabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2phZXd0anh3enVpa2Vib2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTE1MTksImV4cCI6MjA5MDYyNzUxOX0.83--ZKkkrBYQwrHZFGvg7a7NqN2EuhMQUAWRUVcQpIs"

$Headers = @{
    "apikey" = $SupabaseKey
    "Authorization" = "Bearer $SupabaseKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

Write-Host "Iniciando migracao de categorias..."

# 1. Puxar categorias
$CategoriasUrl = "$SupabaseUrl/rest/v1/categories?select=*"
try {
    $Categorias = Invoke-RestMethod -Uri $CategoriasUrl -Headers $Headers -Method Get
} catch {
    Write-Host "Erro: Voce rodou aquele script SQL no Supabase que te mandei? Nao consegui ler a tabela 'categories'."
    Write-Host $_.Exception.Message
    exit
}

$CategoriaIds = @{}
foreach ($cat in $Categorias) {
    if ($cat.name) {
        $CategoriaIds[$cat.name] = $cat.id
    }
}

$CategoriasBase = "Lanches", "Bebidas", "Porções"

foreach ($nome in $CategoriasBase) {
    if (-not $CategoriaIds.ContainsKey($nome)) {
        Write-Host "Criando categoria: $nome..."
        $Body = @{ name = $nome } | ConvertTo-Json
        $NewCat = Invoke-RestMethod -Uri $CategoriasUrl -Headers $Headers -Method Post -Body $Body
        $CategoriaIds[$nome] = $NewCat[0].id
    }
}

Write-Host "Categorias garantidas. Buscando produtos..."

# 2. Buscar todos os produtos
$ProdutosUrl = "$SupabaseUrl/rest/v1/products?select=*"
$Produtos = Invoke-RestMethod -Uri $ProdutosUrl -Headers $Headers -Method Get

# 3. Classificar e atualizar
$atualizados = 0

foreach ($p in $Produtos) {
    if ($p.category_id) { continue }
    
    $nameLower = $p.name.ToLower()
    $catName = $null

    if ($nameLower -match "coca|fanta|guarana|agua|suco|cerveja|lata|2l|600ml") {
        $catName = "Bebidas"
    } elseif ($nameLower -match "x-|burger|hamburguer|salada|bacon") {
        $catName = "Lanches"
    } elseif ($nameLower -match "batata|frita|calabresa|porcao|porção") {
        $catName = "Porções"
    }

    if ($catName) {
        $idCategoria = $CategoriaIds[$catName]
        $UpdateUrl = "$SupabaseUrl/rest/v1/products?id=eq.$($p.id)"
        $HeadersPatch = $Headers.Clone()
        $HeadersPatch["Prefer"] = "return=minimal"
        
        $BodyPatch = @{ category_id = $idCategoria } | ConvertTo-Json
        
        try {
            Invoke-RestMethod -Uri $UpdateUrl -Headers $HeadersPatch -Method Patch -Body $BodyPatch
            Write-Host "=> Categorizado '$($p.name)' como [$catName]"
            $atualizados++
        } catch {
            Write-Host "Erro ao atualizar $($p.name): $($_.Exception.Message)"
        }
    } else {
        Write-Host "=> Nao classificado: '$($p.name)'. Ficara sem categoria."
    }
}

Write-Host "`nMigracao concluida! $atualizados produtos categorizados."
