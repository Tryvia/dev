/**
 * Configuração centralizada de Status do Freshdesk
 * Use este módulo em todo o sistema para manter consistência
 */

window.FRESHDESK_STATUS = {
  // Mapa completo: ID → { label, color, icon, category, desc }
  MAP: {
    2: { label: 'Aberto', color: '#3b82f6', icon: '🔵', category: 'open', desc: 'Status inicial similar ao Em Análise — ticket recém-aberto aguardando tratamento por qualquer time' },
    3: { label: 'Pendente', color: '#f59e0b', icon: '⏳', category: 'pending', desc: 'Ticket pendente de alguma ação ou informação para prosseguir' },
    4: { label: 'Resolvido', color: '#10b981', icon: '✅', category: 'resolved', desc: 'Ticket finalizado com solução aplicada (equivalente a Fechado)' },
    5: { label: 'Fechado', color: '#6b7280', icon: '✔️', category: 'resolved', desc: 'Ticket encerrado definitivamente (equivalente a Resolvido)' },
    6: { label: 'Em Homologação', color: '#8b5cf6', icon: '🧪', category: 'validation', desc: 'Em fase de testes no ambiente de homologação (staging)' },
    7: { label: 'Aguardando Cliente', color: '#f59e0b', icon: '⏸️', category: 'waiting', desc: 'Aguardando algum tipo de retorno ou informação do cliente' },
    8: { label: 'Em Tratativa', color: '#06b6d4', icon: '🔄', category: 'in_progress', desc: 'Ticket sendo ativamente trabalhado neste momento por um agente' },
    10: { label: 'Em Análise', color: '#06b6d4', icon: '🔍', category: 'in_progress', desc: 'Status padrão inicial — pode estar em análise com qualquer time' },
    11: { label: 'Interno', color: '#64748b', icon: '🏠', category: 'in_progress', desc: 'Solicitação interna de algum time ou da própria empresa' },
    12: { label: 'Aguardando Publicar HML', color: '#3b82f6', icon: '📦', category: 'waiting_deploy', desc: 'Aguardando publicação de atualização no ambiente de homologação (staging)' },
    13: { label: 'Aguardando Publicar PROD', color: '#8b5cf6', icon: '🚀', category: 'waiting_deploy', desc: 'Aguardando publicação de atualização no ambiente de produção' },
    14: { label: 'MVP', color: '#ec4899', icon: '⭐', category: 'special', desc: 'Cliente realizando período de teste em algum sistema da empresa' },
    15: { label: 'Validação-Atendimento', color: '#f97316', icon: '✍️', category: 'validation', desc: 'Aguardando o time de Atendimento validar alguma questão do ticket' },
    16: { label: 'Aguardando Parceiros', color: '#a855f7', icon: '🤝', category: 'waiting', desc: 'Aguardando retorno de parceiros externos — outra empresa que trabalha em conjunto' },
    17: { label: 'Pausado', color: '#64748b', icon: '⏸️', category: 'pending', desc: 'Ticket pausado temporariamente por motivos diversos' },
    18: { label: 'Validação-CS', color: '#f97316', icon: '✍️', category: 'validation', desc: 'Aguardando validação do time de CS (Customer Success) para alguma questão' },
    19: { label: 'Levantamento de Esforço', color: '#6366f1', icon: '📊', category: 'in_progress', desc: 'Time de DEV levantando horas necessárias para melhoria ou correção de bug' },
    20: { label: 'Em Fila DEV', color: '#ef4444', icon: '👨‍💻', category: 'in_progress', desc: 'Na fila dos desenvolvedores aguardando para ser tratado' },
    21: { label: 'Em Produção', color: '#10b981', icon: '🟢', category: 'deployed', desc: 'Atualização ou correção já publicada no ambiente de produção' }
  },

  // Categorias para agrupamento em gráficos
  CATEGORIES: {
    resolved: { label: 'Resolvido/Fechado', color: '#10b981', ids: [4, 5] },
    open: { label: 'Aberto', color: '#3b82f6', ids: [2] },
    pending: { label: 'Pendente/Pausado', color: '#f59e0b', ids: [3, 17] },
    in_progress: { label: 'Em Progresso', color: '#06b6d4', ids: [8, 10, 11, 19, 20] },
    waiting: { label: 'Aguardando', color: '#a855f7', ids: [7, 16] },
    waiting_deploy: { label: 'Aguardando Deploy', color: '#8b5cf6', ids: [12, 13] },
    validation: { label: 'Em Validação', color: '#f97316', ids: [6, 15, 18] },
    deployed: { label: 'Em Produção', color: '#22c55e', ids: [21] },
    special: { label: 'MVP/Especial', color: '#ec4899', ids: [14] }
  },

  // IDs de status considerados "fechados" para métricas
  CLOSED_IDS: [4, 5],

  // IDs de status considerados "abertos" (não resolvidos)
  OPEN_IDS: [2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],

  // Helpers
  getStatus(statusId) {
    return this.MAP[statusId] || { label: `Status ${statusId}`, color: '#6b7280', icon: '❓', category: 'unknown', desc: 'Status desconhecido' };
  },

  getLabel(statusId) {
    return this.getStatus(statusId).label;
  },

  getColor(statusId) {
    return this.getStatus(statusId).color;
  },

  getIcon(statusId) {
    return this.getStatus(statusId).icon;
  },

  getDesc(statusId) {
    return this.getStatus(statusId).desc;
  },

  isClosed(statusId) {
    return this.CLOSED_IDS.includes(statusId);
  },

  isOpen(statusId) {
    return !this.isClosed(statusId);
  },

  getCategory(statusId) {
    return this.getStatus(statusId).category;
  },

  // Para gráficos simplificados (4 categorias principais)
  getSimplifiedCategory(statusId) {
    if (this.CLOSED_IDS.includes(statusId)) return 'Resolvido';
    if ([2, 10].includes(statusId)) return 'Aberto';
    if ([3, 17].includes(statusId)) return 'Pendente';
    if ([7, 16].includes(statusId)) return 'Aguardando';
    return 'Em Progresso';
  },

  // Agrupa tickets por categoria simplificada
  groupBySimplifiedStatus(tickets) {
    const groups = {
      'Resolvido': 0,
      'Aberto': 0,
      'Pendente': 0,
      'Aguardando': 0,
      'Em Progresso': 0
    };

    tickets.forEach(ticket => {
      const cat = this.getSimplifiedCategory(ticket.status);
      groups[cat]++;
    });

    return groups;
  }
};

console.log('✅ FRESHDESK_STATUS configurado com', Object.keys(window.FRESHDESK_STATUS.MAP).length, 'status');
