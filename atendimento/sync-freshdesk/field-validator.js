/**
 * VALIDADOR DE CAMPOS COM LOGS PARA GITHUB
 * 
 * Este módulo valida se todos os campos obrigatórios foram preenchidos
 * antes de enviar para o Supabase. Campos faltantes são logados mas
 * NÃO bloqueiam a inserção.
 * 
 * Logs podem ser enviados para:
 * - Console (sempre)
 * - GitHub Issues (configurável)
 * - Supabase (configurável)
 */

const https = require('https');

// ============================================
// CONFIGURAÇÃO
// ============================================

const CONFIG = {
  // Habilitar envio de logs para GitHub Issues
  SEND_TO_GITHUB: process.env.SEND_LOGS_TO_GITHUB === 'true',
  
  // Habilitar envio de logs para Supabase
  SEND_TO_SUPABASE: process.env.SEND_LOGS_TO_SUPABASE === 'true',
  
  // Repositórios GitHub para enviar logs (separados por vírgula)
  // Formato: "owner/repo,owner2/repo2"
  GITHUB_REPOS: process.env.LOG_GITHUB_REPOS || '',
  
  // Token do GitHub para criar issues
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  
  // Supabase config
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  
  // Nível mínimo de log para enviar (info, warning, error)
  MIN_LOG_LEVEL: process.env.LOG_MIN_LEVEL || 'warning'
};

// ============================================
// DEFINIÇÃO DE CAMPOS OBRIGATÓRIOS POR TIPO
// ============================================

const REQUIRED_FIELDS = {
  ticket: {
    critical: ['id', 'subject', 'status'],
    important: ['requester_id', 'created_at', 'updated_at'],
    optional: ['description_text', 'priority', 'source', 'type', 'responder_id', 'group_id', 'tags']
  },
  conversation: {
    critical: ['id', 'ticket_id', 'body_text'],
    important: ['user_id', 'created_at'],
    optional: ['incoming', 'private', 'source']
  },
  satisfaction_rating: {
    critical: ['id', 'ticket_id'],
    important: ['ratings', 'created_at'],
    optional: ['feedback', 'agent_id', 'group_id']
  },
  agent: {
    critical: ['id', 'email'],
    important: ['name'],
    optional: ['active', 'job_title', 'group_ids']
  },
  company: {
    critical: ['id', 'name'],
    important: [],
    optional: ['description', 'domains']
  },
  group: {
    critical: ['id', 'name'],
    important: [],
    optional: ['description', 'agent_ids']
  },
  time_entry: {
    critical: ['id', 'ticket_id'],
    important: ['agent_id', 'time_spent'],
    optional: ['billable', 'note', 'executed_at']
  }
};

// ============================================
// ARMAZENAMENTO DE LOGS
// ============================================

const pendingLogs = [];
let logSummary = {
  startTime: new Date(),
  totalRecords: 0,
  recordsWithMissingFields: 0,
  missingFieldsCount: {},
  criticalMissing: [],
  importantMissing: []
};

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida um registro e retorna campos faltantes
 * @param {Object} record - O registro a validar
 * @param {string} type - Tipo do registro (ticket, conversation, etc)
 * @returns {Object} - { isValid: boolean, missing: { critical: [], important: [], optional: [] } }
 */
function validateRecord(record, type) {
  const fields = REQUIRED_FIELDS[type];
  if (!fields) {
    console.warn(`⚠️ Tipo desconhecido para validação: ${type}`);
    return { isValid: true, missing: { critical: [], important: [], optional: [] } };
  }

  const missing = {
    critical: [],
    important: [],
    optional: []
  };

  // Verificar campos críticos
  for (const field of fields.critical) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      missing.critical.push(field);
    }
  }

  // Verificar campos importantes
  for (const field of fields.important) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      missing.important.push(field);
    }
  }

  // Verificar campos opcionais
  for (const field of fields.optional) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      missing.optional.push(field);
    }
  }

  const isValid = missing.critical.length === 0;
  return { isValid, missing };
}

/**
 * Valida um array de registros e loga campos faltantes
 * @param {Array} records - Array de registros
 * @param {string} type - Tipo dos registros
 * @returns {Array} - Os mesmos registros (não bloqueia)
 */
function validateAndLog(records, type) {
  if (!Array.isArray(records) || records.length === 0) {
    return records;
  }

  logSummary.totalRecords += records.length;

  for (const record of records) {
    const { isValid, missing } = validateRecord(record, type);
    
    if (missing.critical.length > 0 || missing.important.length > 0) {
      logSummary.recordsWithMissingFields++;
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        recordId: record.id,
        level: missing.critical.length > 0 ? 'error' : 'warning',
        missingCritical: missing.critical,
        missingImportant: missing.important,
        missingOptional: missing.optional
      };

      // Contar campos faltantes
      [...missing.critical, ...missing.important].forEach(field => {
        const key = `${type}.${field}`;
        logSummary.missingFieldsCount[key] = (logSummary.missingFieldsCount[key] || 0) + 1;
      });

      // Adicionar ao resumo
      if (missing.critical.length > 0) {
        logSummary.criticalMissing.push({ id: record.id, type, fields: missing.critical });
      }
      if (missing.important.length > 0) {
        logSummary.importantMissing.push({ id: record.id, type, fields: missing.important });
      }

      pendingLogs.push(logEntry);

      // Log no console
      if (missing.critical.length > 0) {
        console.log(`❌ [${type}] ID ${record.id}: Campos CRÍTICOS faltando: ${missing.critical.join(', ')}`);
      } else if (missing.important.length > 0) {
        console.log(`⚠️ [${type}] ID ${record.id}: Campos importantes faltando: ${missing.important.join(', ')}`);
      }
    }
  }

  return records; // Sempre retorna os registros, não bloqueia
}

// ============================================
// ENVIO PARA GITHUB ISSUES
// ============================================

async function createGitHubIssue(owner, repo, title, body, labels = ['sync-log']) {
  if (!CONFIG.GITHUB_TOKEN) {
    console.log('⚠️ GITHUB_TOKEN não configurado, pulando criação de issue');
    return null;
  }

  const data = JSON.stringify({
    title,
    body,
    labels
  });

  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: `/repos/${owner}/${repo}/issues`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Sync-Field-Validator',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          const issue = JSON.parse(responseData);
          console.log(`✅ Issue criada: ${issue.html_url}`);
          resolve(issue);
        } else {
          console.log(`❌ Erro ao criar issue: ${res.statusCode} - ${responseData}`);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Erro de rede ao criar issue: ${e.message}`);
      resolve(null);
    });

    req.write(data);
    req.end();
  });
}

// ============================================
// ENVIO PARA SUPABASE
// ============================================

async function sendLogsToSupabase(logs) {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_SERVICE_KEY) {
    console.log('⚠️ Supabase não configurado, pulando envio de logs');
    return;
  }

  const url = new URL('/rest/v1/sync_logs', CONFIG.SUPABASE_URL);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CONFIG.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(logs.map(log => ({
        ...log,
        missing_critical: log.missingCritical,
        missing_important: log.missingImportant,
        missing_optional: log.missingOptional
      })))
    });

    if (response.ok) {
      console.log(`✅ ${logs.length} logs enviados para Supabase`);
    } else {
      console.log(`⚠️ Falha ao enviar logs para Supabase: ${response.status}`);
    }
  } catch (error) {
    console.log(`⚠️ Erro ao enviar logs para Supabase: ${error.message}`);
  }
}

// ============================================
// GERAR RELATÓRIO FINAL
// ============================================

function generateReport() {
  const endTime = new Date();
  const duration = Math.round((endTime - logSummary.startTime) / 1000);
  
  let report = `# 📊 Relatório de Validação de Campos\n\n`;
  report += `**Data:** ${endTime.toISOString()}\n`;
  report += `**Duração:** ${duration}s\n\n`;
  
  report += `## 📈 Resumo\n\n`;
  report += `| Métrica | Valor |\n`;
  report += `|---------|-------|\n`;
  report += `| Total de registros | ${logSummary.totalRecords} |\n`;
  report += `| Registros com campos faltantes | ${logSummary.recordsWithMissingFields} |\n`;
  report += `| Campos críticos faltando | ${logSummary.criticalMissing.length} |\n`;
  report += `| Campos importantes faltando | ${logSummary.importantMissing.length} |\n\n`;
  
  if (Object.keys(logSummary.missingFieldsCount).length > 0) {
    report += `## 🔍 Campos Faltantes (por frequência)\n\n`;
    report += `| Campo | Ocorrências |\n`;
    report += `|-------|-------------|\n`;
    
    const sortedFields = Object.entries(logSummary.missingFieldsCount)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [field, count] of sortedFields) {
      report += `| ${field} | ${count} |\n`;
    }
    report += `\n`;
  }
  
  if (logSummary.criticalMissing.length > 0) {
    report += `## ❌ Campos Críticos Faltantes (top 20)\n\n`;
    report += `| Tipo | ID | Campos |\n`;
    report += `|------|-----|--------|\n`;
    
    for (const item of logSummary.criticalMissing.slice(0, 20)) {
      report += `| ${item.type} | ${item.id} | ${item.fields.join(', ')} |\n`;
    }
    
    if (logSummary.criticalMissing.length > 20) {
      report += `\n*...e mais ${logSummary.criticalMissing.length - 20} registros*\n`;
    }
  }
  
  return report;
}

// ============================================
// FINALIZAR E ENVIAR LOGS
// ============================================

async function flushLogs() {
  if (pendingLogs.length === 0 && logSummary.recordsWithMissingFields === 0) {
    console.log('✅ Nenhum campo faltante detectado');
    return;
  }

  console.log(`\n📊 RESUMO DE VALIDAÇÃO:`);
  console.log(`   Total de registros: ${logSummary.totalRecords}`);
  console.log(`   Com campos faltantes: ${logSummary.recordsWithMissingFields}`);
  console.log(`   Críticos: ${logSummary.criticalMissing.length}`);
  console.log(`   Importantes: ${logSummary.importantMissing.length}`);

  // Enviar para GitHub se configurado
  if (CONFIG.SEND_TO_GITHUB && CONFIG.GITHUB_REPOS && logSummary.recordsWithMissingFields > 0) {
    const repos = CONFIG.GITHUB_REPOS.split(',').map(r => r.trim());
    const report = generateReport();
    const title = `[Sync] ${logSummary.recordsWithMissingFields} registros com campos faltantes - ${new Date().toLocaleDateString('pt-BR')}`;
    
    for (const repo of repos) {
      const [owner, repoName] = repo.split('/');
      if (owner && repoName) {
        console.log(`📤 Enviando log para GitHub: ${repo}...`);
        await createGitHubIssue(owner, repoName, title, report, ['sync-log', 'automated']);
      }
    }
  }

  // Enviar para Supabase se configurado
  if (CONFIG.SEND_TO_SUPABASE && pendingLogs.length > 0) {
    console.log(`📤 Enviando ${pendingLogs.length} logs para Supabase...`);
    await sendLogsToSupabase(pendingLogs);
  }

  // Limpar logs pendentes
  pendingLogs.length = 0;
}

// ============================================
// RESET PARA NOVA EXECUÇÃO
// ============================================

function resetLogs() {
  pendingLogs.length = 0;
  logSummary = {
    startTime: new Date(),
    totalRecords: 0,
    recordsWithMissingFields: 0,
    missingFieldsCount: {},
    criticalMissing: [],
    importantMissing: []
  };
}

// ============================================
// EXPORTAÇÕES
// ============================================

module.exports = {
  validateRecord,
  validateAndLog,
  flushLogs,
  resetLogs,
  generateReport,
  CONFIG,
  REQUIRED_FIELDS
};
