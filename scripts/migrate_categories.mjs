import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mcgjaewtjxwzuikeboie.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZ2phZXd0anh3enVpa2Vib2llIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTE1MTksImV4cCI6MjA5MDYyNzUxOX0.83--ZKkkrBYQwrHZFGvg7a7NqN2EuhMQUAWRUVcQpIs";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log("Iniciando migração de categorias...");

    // 1. Criar ou buscar categorias base
    const categoriasBase = ["Lanches", "Bebidas", "Porções"];
    const categoriaIds = {};

    for (const nome of categoriasBase) {
        let { data: cat } = await supabase.from('categories').select('*').eq('name', nome).single();
        
        if (!cat) {
            console.log(`Criando categoria: ${nome}...`);
            const { data: newCat, error } = await supabase.from('categories').insert({ name: nome }).select().single();
            if (error) {
                console.error("Erro ao criar categoria", nome, error);
                return;
            }
            cat = newCat;
        }
        categoriaIds[nome] = cat.id;
    }

    console.log("Categorias garantidas:", categoriaIds);

    // 2. Buscar todos os produtos
    const { data: produtos, error: errProd } = await supabase.from('products').select('*');
    if (errProd) {
        console.error("Erro ao buscar produtos. Você rodou aquele script SQL no Supabase que te mandei? Erro:", errProd);
        return;
    }

    console.log(`Encontrados ${produtos.length} produtos.`);

    // 3. Classificar e atualizar
    let atualizados = 0;
    
    for (const p of produtos) {
        if (p.category_id) continue; // Já categorizado
        
        const nameLower = p.name.toLowerCase();
        let catName = null;

        if (nameLower.includes('coca') || nameLower.includes('fanta') || nameLower.includes('guarana') || 
            nameLower.includes('agua') || nameLower.includes('suco') || nameLower.includes('cerveja') || 
            nameLower.includes('lata') || nameLower.includes('2l') || nameLower.includes('600ml')) {
            catName = "Bebidas";
        } else if (nameLower.includes('x-') || nameLower.includes('burger') || nameLower.includes('hamburguer') || 
                   nameLower.includes('salada') || nameLower.includes('bacon')) {
            catName = "Lanches";
        } else if (nameLower.includes('batata') || nameLower.includes('frita') || nameLower.includes('calabresa') || 
                   nameLower.includes('porcao') || nameLower.includes('porção')) {
            catName = "Porções";
        }

        if (catName) {
            const { error: errUp } = await supabase.from('products').update({ category_id: categoriaIds[catName] }).eq('id', p.id);
            if (errUp) {
                console.error(`Erro ao atualizar ${p.name}:`, errUp);
            } else {
                console.log(`=> Categorizado '${p.name}' como [${catName}]`);
                atualizados++;
            }
        } else {
            console.log(`=> Não consegui classificar '${p.name}'. Ficará sem categoria.`);
        }
    }

    console.log(`\nMigração concluída! ${atualizados} produtos categorizados automaticamente.`);
}

migrate();
