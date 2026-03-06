/**
 * Realtime Dashboard Module
 * Escuta mudanças no Supabase em tempo real e atualiza o dashboard automaticamente
 * @version 1.0.0
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  
  const CONFIG = {
    // Tabelas para escutar
    tables: ['tickets', 'ticket_conversations', 'satisfaction_ratings'],
    // Intervalo mínimo entre atualizações (ms) - debounce
    updateDebounce: 2000,
    // Mostrar notificações toast
    showToasts: true,
    // Som de notificação
    playSound: false,
    // Auto-reconectar
    autoReconnect: true,
    reconnectInterval: 5000
  };

  // ============================================
  // ESTADO
  // ============================================
  
  const state = {
    subscriptions: [],
    isConnected: false,
    lastUpdate: null,
    pendingUpdates: [],
    updateTimeout: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 10,
    stats: {
      ticketsCreated: 0,
      ticketsUpdated: 0,
      conversationsAdded: 0,
      ratingsReceived: 0
    }
  };

  // ============================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================

  /**
   * Debounce para evitar atualizações excessivas
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Formata data para exibição
   */
  function formatTime(date) {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Toca som de notificação
   */
  function playNotificationSound() {
    if (!CONFIG.playSound) return;
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleHJMQoXMzpuWYj1Oi7epjnNUUXuouJl5WlN2naSXb1dVfZaZiG1eLm59goF5dHJ7hoWAfHh3fYKEfnt5eX2Ag4F+e3l7f4KCgH57eX+BgX99fX5/gYF/fn1+f4GBf35+fn+AgYB+fn5/gIGAfn5+f4CBgH5+fn+AgIB+fn5/gICAfn5+f4CAgH5+fn+AgIB+fn5/gICAfn5+f4CAgH5+fn+AgIB+fn5/gICA');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) { console.warn('⚠️ Erro ao tocar som de notificação:', e.message); }
  }

  // ============================================
  // INDICADOR DE STATUS
  // ============================================

  /**
   * Cria ou atualiza indicador de status de conexão
   */
  function updateConnectionIndicator() {
    let indicator = document.getElementById('realtime-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'realtime-indicator';
      indicator.setAttribute('role', 'status');
      indicator.setAttribute('aria-live', 'polite');
      indicator.setAttribute('aria-label', 'Status da conexão em tempo real');
      indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        background: rgba(30, 30, 46, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        font-size: 10px;
        color: #71717a;
        z-index: 9998;
        backdrop-filter: blur(10px);
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        cursor: pointer;
        opacity: 0.5;
      `;
      indicator.onmouseenter = () => { indicator.style.opacity = '1'; indicator.style.padding = '6px 12px'; };
      indicator.onmouseleave = () => { indicator.style.opacity = '0.5'; indicator.style.padding = '4px 8px'; };
      indicator.onclick = () => toggleRealtimePanel();
      document.body.appendChild(indicator);
    }

    const statusDot = state.isConnected ? 
      '<span style="width:6px;height:6px;border-radius:50%;background:#10b981;"></span>' :
      '<span style="width:6px;height:6px;border-radius:50%;background:#f59e0b;"></span>';
    
    const statusText = state.isConnected ? 'Realtime' : 'Offline';

    indicator.innerHTML = `
      ${statusDot}
      <span>${statusText}</span>
    `;

    // Adiciona estilo de pulse animation se não existir
    if (!document.getElementById('realtime-styles')) {
      const style = document.createElement('style');
      style.id = 'realtime-styles';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .realtime-toast {
          animation: slideInUp 0.3s ease;
        }
        .realtime-panel {
          animation: fadeIn 0.2s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // ============================================
  // PAINEL DE REALTIME
  // ============================================

  /**
   * Toggle painel de detalhes do realtime
   */
  function toggleRealtimePanel() {
    let panel = document.getElementById('realtime-panel');
    
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'realtime-panel';
    panel.className = 'realtime-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Painel de atualizações em tempo real');
    panel.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 20px;
      width: 320px;
      max-height: 400px;
      background: rgba(30, 30, 46, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      z-index: 9997;
      backdrop-filter: blur(20px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    `;

    panel.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #e4e4e7;">
            📡 Atualizações em Tempo Real
          </h3>
          <button onclick="document.getElementById('realtime-panel').remove()" 
                  style="background: none; border: none; color: #a1a1aa; cursor: pointer; font-size: 18px;"
                  aria-label="Fechar painel">×</button>
        </div>
        <p style="margin: 8px 0 0; font-size: 12px; color: #a1a1aa;">
          Status: ${state.isConnected ? '<span style="color:#10b981;">●</span> Conectado' : '<span style="color:#ef4444;">●</span> Desconectado'}
        </p>
      </div>
      
      <div style="padding: 16px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: rgba(59,130,246,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${state.stats.ticketsCreated}</div>
            <div style="font-size: 11px; color: #a1a1aa;">Tickets Criados</div>
          </div>
          <div style="background: rgba(16,185,129,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #10b981;">${state.stats.ticketsUpdated}</div>
            <div style="font-size: 11px; color: #a1a1aa;">Atualizados</div>
          </div>
          <div style="background: rgba(168,85,247,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #a855f7;">${state.stats.conversationsAdded}</div>
            <div style="font-size: 11px; color: #a1a1aa;">Conversas</div>
          </div>
          <div style="background: rgba(251,191,36,0.1); padding: 12px; border-radius: 8px; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; color: #fbbf24;">${state.stats.ratingsReceived}</div>
            <div style="font-size: 11px; color: #a1a1aa;">Avaliações</div>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #e4e4e7; cursor: pointer;">
            <input type="checkbox" ${CONFIG.showToasts ? 'checked' : ''} 
                   onchange="window.RealtimeDashboard.setConfig('showToasts', this.checked)"
                   style="accent-color: #667eea;">
            Mostrar notificações toast
          </label>
        </div>

        <div style="display: flex; gap: 8px;">
          <button onclick="window.RealtimeDashboard.reconnect()" 
                  style="flex: 1; padding: 10px; background: linear-gradient(135deg, #667eea, #764ba2); border: none; border-radius: 8px; color: white; font-size: 12px; font-weight: 500; cursor: pointer;">
            🔄 Reconectar
          </button>
          <button onclick="window.RealtimeDashboard.forceRefresh()" 
                  style="flex: 1; padding: 10px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #e4e4e7; font-size: 12px; font-weight: 500; cursor: pointer;">
            ⚡ Atualizar Agora
          </button>
        </div>
      </div>
      
      <div id="realtime-log" style="max-height: 150px; overflow-y: auto; padding: 0 16px 16px; font-size: 11px;">
        <div style="color: #a1a1aa; text-align: center; padding: 20px;">
          Aguardando atualizações...
        </div>
      </div>
    `;

    document.body.appendChild(panel);
  }

  /**
   * Adiciona entrada ao log do painel
   */
  function addToLog(message, type = 'info') {
    const log = document.getElementById('realtime-log');
    if (!log) return;

    const colors = {
      info: '#3b82f6',
      success: '#10b981',
      warning: '#fbbf24',
      error: '#ef4444'
    };

    const entry = document.createElement('div');
    entry.style.cssText = `
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      display: flex;
      align-items: flex-start;
      gap: 8px;
    `;
    entry.innerHTML = `
      <span style="color: ${colors[type]}; font-size: 10px;">●</span>
      <div>
        <div style="color: #e4e4e7;">${message}</div>
        <div style="color: #71717a; font-size: 10px;">${formatTime(new Date())}</div>
      </div>
    `;

    // Remove mensagem de "aguardando"
    const placeholder = log.querySelector('div[style*="text-align: center"]');
    if (placeholder) placeholder.remove();

    log.insertBefore(entry, log.firstChild);

    // Limita a 50 entradas
    while (log.children.length > 50) {
      log.removeChild(log.lastChild);
    }
  }

  // ============================================
  // TOAST NOTIFICATIONS
  // ============================================

  /**
   * Mostra toast notification
   */
  function showToast(message, type = 'info', duration = 4000) {
    if (!CONFIG.showToasts) return;

    const icons = {
      info: '📢',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      ticket: '🎫',
      conversation: '💬',
      rating: '⭐'
    };

    const colors = {
      info: 'rgba(59, 130, 246, 0.2)',
      success: 'rgba(16, 185, 129, 0.2)',
      warning: 'rgba(251, 191, 36, 0.2)',
      error: 'rgba(239, 68, 68, 0.2)',
      ticket: 'rgba(168, 85, 247, 0.2)',
      conversation: 'rgba(59, 130, 246, 0.2)',
      rating: 'rgba(251, 191, 36, 0.2)'
    };

    let container = document.getElementById('realtime-toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'realtime-toasts';
      container.setAttribute('role', 'alert');
      container.setAttribute('aria-live', 'assertive');
      container.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'realtime-toast';
    toast.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(30, 30, 46, 0.98);
      border: 1px solid ${colors[type]};
      border-left: 3px solid ${colors[type].replace('0.2', '1')};
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    toast.innerHTML = `
      <span style="font-size: 20px;">${icons[type] || icons.info}</span>
      <div style="flex: 1;">
        <div style="color: #e4e4e7; font-size: 13px; line-height: 1.4;">${message}</div>
        <div style="color: #71717a; font-size: 11px; margin-top: 4px;">${formatTime(new Date())}</div>
      </div>
      <button onclick="this.parentElement.remove()" 
              style="background: none; border: none; color: #71717a; cursor: pointer; font-size: 16px; padding: 0;"
              aria-label="Fechar notificação">×</button>
    `;

    container.appendChild(toast);
    playNotificationSound();

    // Remove após duração
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ============================================
  // HANDLERS DE EVENTOS
  // ============================================

  /**
   * Handler para novos tickets
   */
  function handleTicketInsert(payload) {
    const ticket = payload.new;
    state.stats.ticketsCreated++;
    state.lastUpdate = new Date();

    console.log('🎫 Novo ticket:', ticket.id, ticket.subject);
    
    showToast(
      `<strong>Novo Ticket #${ticket.id}</strong><br>${ticket.subject?.substring(0, 50) || 'Sem assunto'}...`,
      'ticket'
    );
    
    addToLog(`Ticket #${ticket.id} criado: ${ticket.subject?.substring(0, 30)}...`, 'success');
    
    queueUpdate('ticket_created', ticket);
    updateConnectionIndicator();
  }

  /**
   * Handler para tickets atualizados
   * Com throttle para evitar spam de notificações
   */
  let pendingUpdates = [];
  let updateThrottleTimer = null;
  const UPDATE_THROTTLE_MS = 3000; // Agrupa atualizações em janelas de 3 segundos
  
  function handleTicketUpdate(payload) {
    const ticket = payload.new;
    const oldTicket = payload.old;
    state.stats.ticketsUpdated++;
    state.lastUpdate = new Date();

    // Verifica mudanças significativas
    let changes = [];
    if (oldTicket?.status !== ticket.status) {
      const statusNames = { 2: 'Aberto', 3: 'Pendente', 4: 'Resolvido', 5: 'Fechado' };
      changes.push(`Status: ${statusNames[ticket.status] || ticket.status}`);
    }
    if (oldTicket?.priority !== ticket.priority) {
      const priorityNames = { 1: 'Baixa', 2: 'Média', 3: 'Alta', 4: 'Urgente' };
      changes.push(`Prioridade: ${priorityNames[ticket.priority] || ticket.priority}`);
    }

    // Acumula atualizações para mostrar em lote
    if (changes.length > 0) {
      pendingUpdates.push({ id: ticket.id, changes });
    }
    
    // Throttle: mostra notificação agrupada após intervalo
    if (!updateThrottleTimer) {
      updateThrottleTimer = setTimeout(() => {
        if (pendingUpdates.length === 1) {
          // Apenas 1 atualização: mostra normal
          const u = pendingUpdates[0];
          showToast(`<strong>Ticket #${u.id} Atualizado</strong><br>${u.changes.join(', ')}`, 'info');
        } else if (pendingUpdates.length > 1) {
          // Múltiplas: mostra resumo
          showToast(`<strong>${pendingUpdates.length} tickets atualizados</strong><br>Clique para ver detalhes no log`, 'info');
        }
        pendingUpdates = [];
        updateThrottleTimer = null;
      }, UPDATE_THROTTLE_MS);
    }

    // Log silencioso (sem toast)
    console.log(`📝 Ticket #${ticket.id} atualizado${changes.length ? ': ' + changes.join(', ') : ''}`);
    
    queueUpdate('ticket_updated', ticket);
    updateConnectionIndicator();
  }

  /**
   * Handler para novas conversas
   */
  function handleConversationInsert(payload) {
    const conversation = payload.new;
    state.stats.conversationsAdded++;
    state.lastUpdate = new Date();

    console.log('💬 Nova conversa no ticket:', conversation.ticket_id);

    showToast(
      `<strong>Nova Resposta - Ticket #${conversation.ticket_id}</strong><br>${conversation.incoming ? 'Cliente respondeu' : 'Equipe respondeu'}`,
      'conversation'
    );

    addToLog(`Nova conversa no ticket #${conversation.ticket_id}`, 'info');
    
    queueUpdate('conversation_added', conversation);
    updateConnectionIndicator();
  }

  /**
   * Handler para novas avaliações
   */
  function handleRatingInsert(payload) {
    const rating = payload.new;
    state.stats.ratingsReceived++;
    state.lastUpdate = new Date();

    console.log('⭐ Nova avaliação:', rating.score);

    const stars = '⭐'.repeat(rating.score || 0);
    showToast(
      `<strong>Nova Avaliação - Ticket #${rating.ticket_id}</strong><br>${stars} (${rating.score}/5)`,
      'rating'
    );

    addToLog(`Avaliação ${rating.score}/5 no ticket #${rating.ticket_id}`, rating.score >= 4 ? 'success' : 'warning');
    
    queueUpdate('rating_added', rating);
    updateConnectionIndicator();
  }

  // ============================================
  // FILA DE ATUALIZAÇÕES
  // ============================================

  /**
   * Adiciona atualização à fila (debounced)
   */
  function queueUpdate(type, data) {
    state.pendingUpdates.push({ type, data, timestamp: Date.now() });

    // Debounce para evitar múltiplas atualizações seguidas
    if (state.updateTimeout) {
      clearTimeout(state.updateTimeout);
    }

    state.updateTimeout = setTimeout(() => {
      processUpdateQueue();
    }, CONFIG.updateDebounce);
  }

  /**
   * Processa fila de atualizações
   */
  async function processUpdateQueue() {
    if (state.pendingUpdates.length === 0) return;

    const updates = [...state.pendingUpdates];
    state.pendingUpdates = [];

    console.log(`🔄 Processando ${updates.length} atualização(ões)...`);

    try {
      // Atualiza cache de tickets (força recarregamento)
      if (typeof loadTicketsFromSupabase === 'function') {
        await loadTicketsFromSupabase(true); // forceRefresh = true
      }

      // Atualiza dashboard se visível
      if (typeof updateDashboard === 'function') {
        updateDashboard();
      }

      // Atualiza BI Analytics se visível
      if (window.biAnalytics && typeof window.biAnalytics.refresh === 'function') {
        window.biAnalytics.refresh();
      }

      // Dispara evento customizado para outros módulos
      window.dispatchEvent(new CustomEvent('realtime:updated', {
        detail: { updates, timestamp: Date.now() }
      }));

      console.log('✅ Dashboard atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao processar atualizações:', error);
      addToLog('Erro ao atualizar dashboard', 'error');
    }
  }

  // ============================================
  // CONEXÃO REALTIME
  // ============================================

  /**
   * Inicia conexão com Supabase Realtime
   */
  async function connect() {
    try {
      const client = await window.SupabaseLoader?.getClient();
      
      if (!client) {
        console.error('❌ Cliente Supabase não disponível');
        state.isConnected = false;
        updateConnectionIndicator();
        scheduleReconnect();
        return;
      }

      // Remove subscriptions antigas
      disconnect();

      console.log('🔄 Conectando ao Supabase Realtime...');

      // Subscribe para tickets
      const ticketSubscription = client
        .channel('tickets-changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'tickets' },
          handleTicketInsert
        )
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tickets' },
          handleTicketUpdate
        )
        .subscribe((status) => {
          console.log('📡 Tickets subscription status:', status);
          if (status === 'SUBSCRIBED') {
            state.isConnected = true;
            state.reconnectAttempts = 0;
            updateConnectionIndicator();
            addToLog('Conectado à tabela tickets', 'success');
          }
        });

      state.subscriptions.push(ticketSubscription);

      // Subscribe para conversas
      const conversationSubscription = client
        .channel('conversations-changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'ticket_conversations' },
          handleConversationInsert
        )
        .subscribe((status) => {
          console.log('📡 Conversations subscription status:', status);
          if (status === 'SUBSCRIBED') {
            addToLog('Conectado à tabela conversations', 'success');
          }
        });

      state.subscriptions.push(conversationSubscription);

      // Subscribe para avaliações
      const ratingSubscription = client
        .channel('ratings-changes')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'satisfaction_ratings' },
          handleRatingInsert
        )
        .subscribe((status) => {
          console.log('📡 Ratings subscription status:', status);
          if (status === 'SUBSCRIBED') {
            addToLog('Conectado à tabela ratings', 'success');
          }
        });

      state.subscriptions.push(ratingSubscription);

      console.log('✅ Realtime conectado com sucesso!');
      // Removido toast ao conectar - notificação desnecessária ao carregar página

    } catch (error) {
      console.error('❌ Erro ao conectar realtime:', error);
      state.isConnected = false;
      updateConnectionIndicator();
      addToLog('Erro de conexão: ' + error.message, 'error');
      scheduleReconnect();
    }
  }

  /**
   * Desconecta do Supabase Realtime
   */
  async function disconnect() {
    for (const subscription of state.subscriptions) {
      try {
        await subscription.unsubscribe();
      } catch (e) {
        console.warn('Erro ao unsubscribe:', e);
      }
    }
    state.subscriptions = [];
    state.isConnected = false;
  }

  /**
   * Agenda reconexão automática
   */
  function scheduleReconnect() {
    if (!CONFIG.autoReconnect) return;
    if (state.reconnectAttempts >= state.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão atingido');
      addToLog('Reconexão automática falhou', 'error');
      return;
    }

    state.reconnectAttempts++;
    const delay = CONFIG.reconnectInterval * state.reconnectAttempts;
    
    console.log(`🔄 Tentando reconectar em ${delay/1000}s (tentativa ${state.reconnectAttempts})...`);
    addToLog(`Reconectando em ${delay/1000}s...`, 'warning');
    
    setTimeout(connect, delay);
  }

  /**
   * Força atualização manual
   */
  async function forceRefresh() {
    console.log('⚡ Forçando atualização manual...');
    addToLog('Atualização manual iniciada', 'info');
    
    try {
      if (typeof loadTicketsFromSupabase === 'function') {
        await loadTicketsFromSupabase(true); // forceRefresh = true para ignorar cache
      }
      if (typeof updateDashboard === 'function') {
        updateDashboard();
      }
      state.lastUpdate = new Date();
      updateConnectionIndicator();
      showToast('Dashboard atualizado!', 'success', 2000);
      addToLog('Atualização manual concluída', 'success');
    } catch (error) {
      console.error('Erro na atualização manual:', error);
      addToLog('Erro na atualização: ' + error.message, 'error');
    }
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  window.RealtimeDashboard = {
    connect,
    disconnect,
    reconnect: connect,
    forceRefresh,
    getState: () => ({ ...state }),
    getStats: () => ({ ...state.stats }),
    isConnected: () => state.isConnected,
    setConfig: (key, value) => {
      if (key in CONFIG) {
        CONFIG[key] = value;
        console.log(`⚙️ Realtime config: ${key} = ${value}`);
      }
    },
    showToast,
    togglePanel: toggleRealtimePanel
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  document.addEventListener('DOMContentLoaded', () => {
    // Aguarda Supabase carregar
    setTimeout(() => {
      updateConnectionIndicator();
      connect();
    }, 1500);
  });

  console.log('📡 RealtimeDashboard module loaded');

})();
