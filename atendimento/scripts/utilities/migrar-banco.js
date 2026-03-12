/**
 * Script de Migração Completa: Banco Antigo → Banco Novo
 * Migra todas as tabelas do Supabase antigo para o novo
 */

const https = require('https');

// Configuração dos bancos
const ANTIGO = {
    host: 'mzjdmhgkrroajmsfwryu.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc'
};

const NOVO = {
    host: 'ifzypptlhpzuydjeympr.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlwcHRsaHB6dXlkamV5bXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzQ3MjYsImV4cCI6MjA4NDY1MDcyNn0.fCmElFOhX_9NLQoIWHPjpnjwnBKMuomztt0GP8Vv0W8'
};

// Tabelas a migrar
const TABELAS = [
    'agents',
    'groups', 
    'companies',
    'tickets',
    'conversations',
    'time_entries',
    'satisfaction_ratings',
    'products',
    'business_hours'
];

// Função para fazer GET request
function fetchData(cfg, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: cfg.host,
            path: path,
            method: 'GET',
            headers: {
                'apikey': cfg.key,
                'Authorization': `Bearer ${cfg.key}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve([]);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Função para fazer POST/UPSERT request
function upsertData(cfg, table, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: cfg.host,
            path: `/rest/v1/${table}`,
            method: 'POST',
            headers: {
                'apikey': cfg.key,
                'Authorization': `Bearer ${cfg.key}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, status: res.statusCode });
                } else {
                    resolve({ success: false, status: res.statusCode, error: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Função para contar registros
function countRecords(cfg, table) {
    return new Promise((resolve) => {
        const options = {
            hostname: cfg.host,
            path: `/rest/v1/${table}?select=id`,
            method: 'GET',
            headers: {
                'apikey': cfg.key,
                'Authorization': `Bearer ${cfg.key}`,
                'Prefer': 'count=exact',
                'Range': '0-0'
            }
        };

        const req = https.request(options, res => {
            const range = res.headers['content-range'];
            if (range && range.includes('/')) {
                resolve(parseInt(range.split('/')[1]) || 0);
            } else {
                resolve(0);
            }
        });

        req.on('error', () => resolve(-1));
        req.end();
    });
}

// Função para buscar todos os registros de uma tabela (paginado)
async function fetchAllRecords(cfg, table) {
    const allRecords = [];
    let offset = 0;
    const limit = 1000;
    
    while (true) {
        const data = await fetchData(cfg, `/rest/v1/${table}?select=*&limit=${limit}&offset=${offset}`);
        
        if (!Array.isArray(data) || data.length === 0) {
            break;
        }
        
        allRecords.push(...data);
        console.log(`    Buscando ${table}: ${allRecords.length} registros...`);
        
        if (data.length < limit) {
            break;
        }
        
        offset += limit;
        await sleep(100); // Rate limiting
    }
    
    return allRecords;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Migrar uma tabela
async function migrarTabela(tabela) {
    console.log(`\n📦 Migrando tabela: ${tabela}`);
    
    // Contar registros no antigo
    const countAntigo = await countRecords(ANTIGO, tabela);
    console.log(`   Registros no banco antigo: ${countAntigo}`);
    
    if (countAntigo <= 0) {
        console.log(`   ⏭️  Tabela vazia ou não existe, pulando...`);
        return { tabela, status: 'vazia', antigo: 0, novo: 0 };
    }
    
    // Buscar todos os registros do banco antigo
    const registros = await fetchAllRecords(ANTIGO, tabela);
    console.log(`   Total buscado: ${registros.length}`);
    
    if (registros.length === 0) {
        console.log(`   ⚠️  Nenhum registro retornado`);
        return { tabela, status: 'erro_busca', antigo: countAntigo, novo: 0 };
    }
    
    // Inserir em lotes no novo banco
    const batchSize = 100;
    let inserted = 0;
    let errors = 0;
    
    for (let i = 0; i < registros.length; i += batchSize) {
        const batch = registros.slice(i, i + batchSize);
        const result = await upsertData(NOVO, tabela, batch);
        
        if (result.success) {
            inserted += batch.length;
            process.stdout.write(`\r   Inserindo: ${inserted}/${registros.length}`);
        } else {
            errors++;
            console.log(`\n   ❌ Erro no lote ${i}: ${result.error?.substring(0, 100)}`);
        }
        
        await sleep(50); // Rate limiting
    }
    
    console.log('');
    
    // Verificar contagem final
    const countNovo = await countRecords(NOVO, tabela);
    
    if (countNovo >= countAntigo) {
        console.log(`   ✅ Sucesso! ${countNovo} registros no novo banco`);
        return { tabela, status: 'ok', antigo: countAntigo, novo: countNovo };
    } else {
        console.log(`   ⚠️  Parcial: ${countNovo}/${countAntigo} registros migrados`);
        return { tabela, status: 'parcial', antigo: countAntigo, novo: countNovo };
    }
}

// Função principal
async function main() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('        MIGRAÇÃO COMPLETA: BANCO ANTIGO → BANCO NOVO       ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Banco Origem:  mzjdmhgkrroajmsfwryu.supabase.co');
    console.log('Banco Destino: ifzypptlhpzuydjeympr.supabase.co');
    console.log('');
    
    // Verificar conexões
    console.log('🔌 Verificando conexões...');
    const testAntigo = await countRecords(ANTIGO, 'tickets');
    const testNovo = await countRecords(NOVO, 'tickets');
    
    console.log(`   Banco antigo: ${testAntigo >= 0 ? '✅ Conectado' : '❌ Erro'}`);
    console.log(`   Banco novo:   ${testNovo >= 0 ? '✅ Conectado' : '❌ Erro'}`);
    
    if (testAntigo < 0) {
        console.log('\n❌ Não foi possível conectar ao banco antigo. Abortando.');
        return;
    }
    
    // Migrar cada tabela
    const resultados = [];
    
    for (const tabela of TABELAS) {
        const resultado = await migrarTabela(tabela);
        resultados.push(resultado);
    }
    
    // Resumo final
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('                      RESUMO DA MIGRAÇÃO                     ');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('Tabela                | Antigo  | Novo    | Status');
    console.log('----------------------|---------|---------|--------');
    
    for (const r of resultados) {
        const status = r.status === 'ok' ? '✅' : r.status === 'vazia' ? '⏭️' : '⚠️';
        console.log(
            `${r.tabela.padEnd(22)}| ${String(r.antigo).padStart(7)} | ${String(r.novo).padStart(7)} | ${status} ${r.status}`
        );
    }
    
    const totalAntigo = resultados.reduce((sum, r) => sum + r.antigo, 0);
    const totalNovo = resultados.reduce((sum, r) => sum + r.novo, 0);
    
    console.log('----------------------|---------|---------|--------');
    console.log(`${'TOTAL'.padEnd(22)}| ${String(totalAntigo).padStart(7)} | ${String(totalNovo).padStart(7)} |`);
    console.log('');
    
    if (totalNovo >= totalAntigo * 0.95) {
        console.log('🎉 Migração concluída com sucesso!');
    } else {
        console.log('⚠️  Migração parcial. Verifique as tabelas com problemas.');
    }
}

main().catch(console.error);
