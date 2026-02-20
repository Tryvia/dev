/**
 * Sistema de Anotações Premium v2.0
 * Comunicação entre usuários sobre tickets
 * Supabase + Realtime + Design Premium
 */

class AnnotationsModule {
    constructor() {
        this.TABLE_NAME = 'ticket_annotations';
        this.USER_KEY = 'bi_current_user';
        this.annotations = [];
        this.currentUser = null;
        this.isOpen = false;
        this.unreadCount = 0;
        this.supabase = null;
        this.realtimeChannel = null;
        this.isLoading = false;
        this.searchQuery = '';
        this.activeFilter = 'all';
        this.activePriority = 'all';
        this.editingId = null;
        this.isConnected = false;
        
        this.config = {
            notificationDuration: 5000,
        };
        
        this.init();
    }
    
    async init() {
        this.loadCurrentUser();
        this.injectStyles();
        this.createUI();
        await this.initSupabase();
        await this.loadAnnotations();
        this.setupRealtime();
        this.updateUnreadCount();
        setTimeout(() => this.checkNewAnnotations(), 1500);
        console.log('📝 Anotações Premium v2.0 inicializado');
    }
    
    // ========== SUPABASE ==========
    
    async initSupabase() {
        try {
            if (typeof window.initSupabase === 'function') {
                this.supabase = await window.initSupabase();
            } else {
                const SUPABASE_URL = 'https://mzjdmhgkrroajmsfwryu.supabase.co';
                const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16amRtaGdrcnJvYWptc2Z3cnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMwMzUsImV4cCI6MjA2MzgwOTAzNX0.tQCwUfFCV7sD-IexQviU0XEPcbn9j5uK9NSUbH-OeBc';
                if (window.supabase?.createClient) {
                    this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                }
            }
            if (this.supabase) {
                this.isConnected = true;
                this.updateConnectionStatus();
            }
            return this.supabase;
        } catch (e) {
            console.error('Erro Supabase:', e);
            return null;
        }
    }
    
    async loadAnnotations() {
        if (!this.supabase) return;
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false })
                .limit(500);
            
            if (error) throw error;
            
            this.annotations = (data || []).map(row => ({
                id: row.id,
                ticketId: row.ticket_id,
                ticketSubject: row.ticket_subject,
                author: row.author,
                message: row.message,
                priority: row.priority,
                createdAt: row.created_at,
                readBy: row.read_by || []
            }));
            
            this.updateUnreadCount();
            if (this.isOpen) this.renderAnnotationsList();
        } catch (e) {
            console.error('Erro ao carregar:', e);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    async saveAnnotation(annotation) {
        if (!this.supabase) return null;
        try {
            const row = {
                id: annotation.id,
                ticket_id: annotation.ticketId,
                ticket_subject: annotation.ticketSubject,
                author: annotation.author,
                message: annotation.message,
                priority: annotation.priority,
                created_at: annotation.createdAt,
                read_by: annotation.readBy
            };
            const { data, error } = await this.supabase
                .from(this.TABLE_NAME)
                .upsert(row, { onConflict: 'id' })
                .select();
            if (error) throw error;
            return data?.[0];
        } catch (e) {
            console.error('Erro ao salvar:', e);
            return null;
        }
    }
    
    async updateReadBy(annotationId, readByArray) {
        if (!this.supabase) return;
        try {
            await this.supabase
                .from(this.TABLE_NAME)
                .update({ read_by: readByArray })
                .eq('id', annotationId);
        } catch (e) {
            console.error('Erro ao atualizar leitura:', e);
        }
    }
    
    async deleteAnnotationFromDB(annotationId) {
        if (!this.supabase) return false;
        try {
            const { error } = await this.supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', annotationId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error('Erro ao deletar:', e);
            return false;
        }
    }
    
    // ========== REALTIME ==========
    
    setupRealtime() {
        if (!this.supabase) return;
        try {
            this.realtimeChannel = this.supabase
                .channel('annotations-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: this.TABLE_NAME
                }, (payload) => this.handleRealtimeEvent(payload))
                .subscribe((status) => {
                    this.isConnected = status === 'SUBSCRIBED';
                    this.updateConnectionStatus();
                });
        } catch (e) {
            console.error('Erro Realtime:', e);
        }
    }
    
    handleRealtimeEvent(payload) {
        const mapRow = (row) => ({
            id: row.id,
            ticketId: row.ticket_id,
            ticketSubject: row.ticket_subject,
            author: row.author,
            message: row.message,
            priority: row.priority,
            createdAt: row.created_at,
            readBy: row.read_by || []
        });
        
        if (payload.eventType === 'INSERT') {
            const newAnnotation = mapRow(payload.new);
            if (!this.annotations.find(a => a.id === newAnnotation.id)) {
                this.annotations.unshift(newAnnotation);
                if (newAnnotation.author !== this.currentUser) {
                    this.showNotification('info', `📝 ${newAnnotation.author}: Ticket #${newAnnotation.ticketId}`, 8000);
                    this.playNotificationSound();
                }
                this.updateUnreadCount();
                if (this.isOpen) this.renderAnnotationsList();
            }
        } else if (payload.eventType === 'UPDATE') {
            const updated = mapRow(payload.new);
            const idx = this.annotations.findIndex(a => a.id === updated.id);
            if (idx !== -1) {
                this.annotations[idx] = updated;
                this.updateUnreadCount();
                if (this.isOpen) this.renderAnnotationsList();
            }
        } else if (payload.eventType === 'DELETE') {
            this.annotations = this.annotations.filter(a => a.id !== payload.old.id);
            this.updateUnreadCount();
            if (this.isOpen) this.renderAnnotationsList();
        }
    }
    
    playNotificationSound() {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVs2PZa7/9t1NQ0MbtT/znYRAABWy//9gS8AAFnS//yALgAAWNH/+4EvAABVzv/6gy8AAE/F//WJMQAASrz/8I44AABEvP/ukzwAAD63/+2WPwAAObb/7Jg/AAA0s//rmEAAADCx/+qZQQAALbD/6ZlBAAArr//omp');
            audio.volume = 0.3;
            audio.play().catch(() => {});
        } catch (e) {}
    }
    
    loadCurrentUser() {
        this.currentUser = localStorage.getItem(this.USER_KEY) || null;
    }
    
    saveCurrentUser(name) {
        this.currentUser = name;
        localStorage.setItem(this.USER_KEY, name);
    }
    
    // ========== GERENCIAMENTO ==========
    
    async addAnnotation(ticketId, ticketSubject, message, priority = 'normal') {
        if (!this.currentUser) {
            this.promptUserName(() => this.addAnnotation(ticketId, ticketSubject, message, priority));
            return;
        }
        
        const annotation = {
            id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ticketId: String(ticketId),
            ticketSubject: ticketSubject || `Ticket #${ticketId}`,
            author: this.currentUser,
            message: message.trim(),
            priority: priority,
            createdAt: new Date().toISOString(),
            readBy: [this.currentUser]
        };
        
        const saved = await this.saveAnnotation(annotation);
        if (saved) {
            if (!this.annotations.find(a => a.id === annotation.id)) {
                this.annotations.unshift(annotation);
            }
            this.updateUnreadCount();
            this.showNotification('success', `✓ Anotação adicionada ao ticket #${ticketId}`);
            if (this.isOpen) this.renderAnnotationsList();
            this.clearForm();
        } else {
            this.showNotification('error', '✗ Erro ao salvar anotação');
        }
        return annotation;
    }
    
    async editAnnotation(annotationId, newMessage) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation || annotation.author !== this.currentUser) {
            this.showNotification('error', 'Você só pode editar suas próprias anotações');
            return;
        }
        annotation.message = newMessage.trim();
        const saved = await this.saveAnnotation(annotation);
        if (saved) {
            this.showNotification('success', '✓ Anotação atualizada');
            this.editingId = null;
            this.renderAnnotationsList();
        }
    }
    
    async markAsRead(annotationId) {
        if (!this.currentUser) return;
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (annotation && !annotation.readBy.includes(this.currentUser)) {
            annotation.readBy.push(this.currentUser);
            await this.updateReadBy(annotationId, annotation.readBy);
            this.updateUnreadCount();
        }
    }
    
    async markAllAsRead() {
        if (!this.currentUser) return;
        const promises = [];
        this.annotations.forEach(a => {
            if (!a.readBy.includes(this.currentUser)) {
                a.readBy.push(this.currentUser);
                promises.push(this.updateReadBy(a.id, a.readBy));
            }
        });
        await Promise.all(promises);
        this.updateUnreadCount();
        this.renderAnnotationsList();
        this.showNotification('success', '✓ Todas marcadas como lidas');
    }
    
    async deleteAnnotation(annotationId) {
        const annotation = this.annotations.find(a => a.id === annotationId);
        if (!annotation) return;
        if (annotation.author !== this.currentUser) {
            this.showNotification('error', 'Apenas o autor pode remover');
            return;
        }
        if (!confirm('Remover esta anotação?')) return;
        
        const deleted = await this.deleteAnnotationFromDB(annotationId);
        if (deleted) {
            this.annotations = this.annotations.filter(a => a.id !== annotationId);
            this.updateUnreadCount();
            this.renderAnnotationsList();
            this.showNotification('info', '✓ Anotação removida');
        }
    }
    
    getFilteredAnnotations() {
        let filtered = [...this.annotations];
        
        // Filtro por tab
        if (this.activeFilter === 'unread') {
            filtered = filtered.filter(a => 
                a.author !== this.currentUser && !a.readBy.includes(this.currentUser)
            );
        } else if (this.activeFilter === 'mine') {
            filtered = filtered.filter(a => a.author === this.currentUser);
        }
        
        // Filtro por prioridade
        if (this.activePriority !== 'all') {
            filtered = filtered.filter(a => a.priority === this.activePriority);
        }
        
        // Busca
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.ticketId.toLowerCase().includes(q) ||
                a.ticketSubject.toLowerCase().includes(q) ||
                a.message.toLowerCase().includes(q) ||
                a.author.toLowerCase().includes(q)
            );
        }
        
        return filtered;
    }
    
    getUnreadAnnotations() {
        if (!this.currentUser) return [];
        return this.annotations.filter(a => 
            a.author !== this.currentUser && !a.readBy.includes(this.currentUser)
        );
    }
    
    updateUnreadCount() {
        this.unreadCount = this.getUnreadAnnotations().length;
        this.updateBadge();
    }
    
    checkNewAnnotations() {
        const unread = this.getUnreadAnnotations();
        if (unread.length > 0 && !this.isOpen) {
            this.showNotification('info', `📝 Você tem ${unread.length} anotação(ões) não lida(s)`, 6000);
        }
    }
    
    // ========== ESTILOS PREMIUM ==========
    
    injectStyles() {
        if (document.getElementById('annotations-premium-styles')) return;
        const styles = document.createElement('style');
        styles.id = 'annotations-premium-styles';
        styles.textContent = `
            /* Badge Sidebar */
            .sidebar-badge {
                min-width: 20px; height: 20px; padding: 0 6px;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                border-radius: 10px; font-size: 11px; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
                margin-left: auto; animation: ann-pulse 2s infinite;
                box-shadow: 0 2px 8px rgba(239,68,68,0.4);
            }
            @keyframes ann-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
            
            /* Overlay */
            .ann-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                backdrop-filter: blur(8px); z-index: 99998;
                opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
            }
            .ann-overlay.visible { opacity: 1; pointer-events: auto; }
            
            /* Painel Principal */
            .ann-panel {
                position: fixed; top: 0; right: -520px; width: 520px; height: 100vh;
                background: linear-gradient(180deg, #0a0a1a 0%, #12122a 50%, #1a1a35 100%);
                border-left: 1px solid rgba(139,92,246,0.3); z-index: 99999;
                display: flex; flex-direction: column;
                transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: -20px 0 60px rgba(0,0,0,0.7);
            }
            .ann-panel.open { right: 0; }
            
            /* Header Premium */
            .ann-header {
                padding: 20px 24px;
                background: linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.15) 100%);
                border-bottom: 1px solid rgba(139,92,246,0.25);
            }
            .ann-header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .ann-title {
                font-size: 1.4rem; font-weight: 800; margin: 0;
                background: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #3b82f6 100%);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                display: flex; align-items: center; gap: 12px;
            }
            .ann-title svg { stroke: #a855f7; }
            .ann-close {
                width: 40px; height: 40px; border-radius: 12px;
                background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3);
                color: #f87171; font-size: 20px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s ease;
            }
            .ann-close:hover { background: rgba(239,68,68,0.25); transform: scale(1.05); }
            
            /* Status Conexão */
            .ann-connection {
                display: flex; align-items: center; gap: 8px;
                font-size: 12px; color: #64748b;
            }
            .ann-connection-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: #ef4444; animation: ann-pulse 2s infinite;
            }
            .ann-connection-dot.connected { background: #22c55e; }
            
            /* User Bar */
            .ann-user-bar {
                padding: 12px 24px;
                background: rgba(30,30,60,0.5);
                border-bottom: 1px solid rgba(139,92,246,0.15);
                display: flex; justify-content: space-between; align-items: center;
            }
            .ann-user-info { display: flex; align-items: center; gap: 12px; }
            .ann-avatar {
                width: 36px; height: 36px; border-radius: 50%;
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                display: flex; align-items: center; justify-content: center;
                font-weight: 700; font-size: 14px; color: white;
                box-shadow: 0 4px 12px rgba(139,92,246,0.3);
            }
            .ann-user-name { font-size: 14px; color: #e2e8f0; font-weight: 600; }
            .ann-change-user {
                padding: 8px 14px; background: rgba(139,92,246,0.15);
                border: 1px solid rgba(139,92,246,0.3); border-radius: 8px;
                color: #a78bfa; font-size: 12px; cursor: pointer;
                transition: all 0.2s ease;
            }
            .ann-change-user:hover { background: rgba(139,92,246,0.25); }
            
            /* Busca */
            .ann-search-box {
                padding: 12px 24px;
                background: rgba(20,20,45,0.5);
                border-bottom: 1px solid rgba(139,92,246,0.1);
            }
            .ann-search-input {
                width: 100%; padding: 12px 16px 12px 44px;
                background: rgba(30,30,60,0.8); border: 1px solid rgba(139,92,246,0.2);
                border-radius: 12px; color: #e2e8f0; font-size: 14px;
                transition: all 0.2s ease;
            }
            .ann-search-input:focus {
                outline: none; border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
            }
            .ann-search-input::placeholder { color: #64748b; }
            .ann-search-wrapper { position: relative; }
            .ann-search-icon {
                position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
                color: #64748b;
            }
            
            /* Tabs Premium */
            .ann-tabs {
                display: flex; padding: 0 24px; gap: 8px;
                background: rgba(20,20,45,0.3);
                border-bottom: 1px solid rgba(139,92,246,0.1);
            }
            .ann-tab {
                padding: 14px 18px; background: transparent; border: none;
                color: #94a3b8; font-size: 13px; font-weight: 600;
                cursor: pointer; position: relative; transition: all 0.2s ease;
                display: flex; align-items: center; gap: 8px;
            }
            .ann-tab:hover { color: #e2e8f0; }
            .ann-tab.active {
                color: #a855f7;
            }
            .ann-tab.active::after {
                content: ''; position: absolute; bottom: 0; left: 0; right: 0;
                height: 3px; background: linear-gradient(90deg, #a855f7, #6366f1);
                border-radius: 3px 3px 0 0;
            }
            .ann-tab-count {
                background: rgba(139,92,246,0.2); padding: 2px 8px;
                border-radius: 10px; font-size: 11px;
            }
            .ann-tab.active .ann-tab-count { background: rgba(168,85,247,0.3); color: #c4b5fd; }
            
            /* Filtros Prioridade */
            .ann-priority-filters {
                display: flex; gap: 8px; padding: 12px 24px;
                background: rgba(15,15,35,0.5);
                border-bottom: 1px solid rgba(139,92,246,0.1);
            }
            .ann-priority-btn {
                padding: 8px 14px; border-radius: 20px;
                background: rgba(50,50,80,0.5); border: 1px solid rgba(100,100,150,0.3);
                color: #94a3b8; font-size: 12px; font-weight: 600;
                cursor: pointer; transition: all 0.2s ease;
            }
            .ann-priority-btn:hover { background: rgba(70,70,100,0.5); }
            .ann-priority-btn.active { border-color: currentColor; }
            .ann-priority-btn[data-priority="all"].active { background: rgba(139,92,246,0.2); color: #a855f7; border-color: #a855f7; }
            .ann-priority-btn[data-priority="urgent"].active { background: rgba(239,68,68,0.2); color: #f87171; border-color: #ef4444; }
            .ann-priority-btn[data-priority="normal"].active { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: #3b82f6; }
            .ann-priority-btn[data-priority="info"].active { background: rgba(34,197,94,0.2); color: #4ade80; border-color: #22c55e; }
            
            /* Lista de Anotações */
            .ann-list {
                flex: 1; overflow-y: auto; padding: 16px 24px;
                display: flex; flex-direction: column; gap: 12px;
            }
            .ann-list::-webkit-scrollbar { width: 6px; }
            .ann-list::-webkit-scrollbar-track { background: rgba(30,30,60,0.3); }
            .ann-list::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 3px; }
            
            /* Card Anotação Premium */
            .ann-card {
                background: linear-gradient(135deg, rgba(30,30,60,0.8) 0%, rgba(25,25,50,0.9) 100%);
                border: 1px solid rgba(139,92,246,0.2); border-radius: 16px;
                padding: 16px; transition: all 0.3s ease;
                animation: ann-slideIn 0.3s ease;
            }
            @keyframes ann-slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
            .ann-card:hover {
                border-color: rgba(139,92,246,0.4);
                box-shadow: 0 8px 32px rgba(139,92,246,0.15);
                transform: translateX(-4px);
            }
            .ann-card.unread {
                border-left: 3px solid #a855f7;
                background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(30,30,60,0.8) 100%);
            }
            .ann-card.urgent { border-left-color: #ef4444; }
            .ann-card.info { border-left-color: #22c55e; }
            
            /* Card Header */
            .ann-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
            .ann-card-ticket {
                display: flex; align-items: center; gap: 10px;
            }
            .ann-card-ticket-id {
                padding: 6px 12px; border-radius: 8px;
                background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%);
                color: #60a5fa; font-weight: 700; font-size: 13px;
                cursor: pointer; transition: all 0.2s ease;
            }
            .ann-card-ticket-id:hover { background: rgba(59,130,246,0.3); }
            .ann-priority-tag {
                padding: 4px 10px; border-radius: 6px;
                font-size: 10px; font-weight: 700; text-transform: uppercase;
            }
            .ann-priority-tag.urgent { background: rgba(239,68,68,0.2); color: #f87171; }
            .ann-priority-tag.normal { background: rgba(59,130,246,0.2); color: #60a5fa; }
            .ann-priority-tag.info { background: rgba(34,197,94,0.2); color: #4ade80; }
            
            .ann-card-actions { display: flex; gap: 6px; }
            .ann-card-action {
                width: 32px; height: 32px; border-radius: 8px;
                background: rgba(50,50,80,0.5); border: none;
                color: #94a3b8; cursor: pointer; display: flex;
                align-items: center; justify-content: center;
                transition: all 0.2s ease;
            }
            .ann-card-action:hover { background: rgba(139,92,246,0.2); color: #a855f7; }
            .ann-card-action.delete:hover { background: rgba(239,68,68,0.2); color: #f87171; }
            
            /* Card Subject */
            .ann-card-subject {
                font-size: 12px; color: #94a3b8; margin-bottom: 10px;
                display: flex; align-items: center; gap: 6px;
            }
            
            /* Card Message */
            .ann-card-message {
                color: #e2e8f0; font-size: 14px; line-height: 1.6;
                margin-bottom: 12px; word-break: break-word;
            }
            
            /* Card Footer */
            .ann-card-footer {
                display: flex; justify-content: space-between; align-items: center;
                padding-top: 12px; border-top: 1px solid rgba(139,92,246,0.1);
            }
            .ann-card-author { display: flex; align-items: center; gap: 10px; }
            .ann-card-avatar {
                width: 28px; height: 28px; border-radius: 50%;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                display: flex; align-items: center; justify-content: center;
                font-size: 11px; font-weight: 700; color: white;
            }
            .ann-card-author-name { font-size: 13px; color: #c4b5fd; font-weight: 600; }
            .ann-card-time { font-size: 12px; color: #64748b; }
            
            /* Formulário Nova Anotação */
            .ann-form {
                padding: 20px 24px;
                background: linear-gradient(180deg, rgba(20,20,45,0.9) 0%, rgba(15,15,35,0.95) 100%);
                border-top: 1px solid rgba(139,92,246,0.2);
            }
            .ann-form-title {
                font-size: 13px; font-weight: 700; color: #a855f7;
                margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1px;
            }
            .ann-form-row { display: flex; gap: 10px; margin-bottom: 12px; }
            .ann-form-input {
                flex: 1; padding: 12px 16px;
                background: rgba(30,30,60,0.8); border: 1px solid rgba(139,92,246,0.2);
                border-radius: 10px; color: #e2e8f0; font-size: 14px;
                transition: all 0.2s ease;
            }
            .ann-form-input:focus {
                outline: none; border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
            }
            .ann-form-input::placeholder { color: #64748b; }
            .ann-form-textarea {
                width: 100%; min-height: 80px; resize: vertical;
                padding: 12px 16px;
                background: rgba(30,30,60,0.8); border: 1px solid rgba(139,92,246,0.2);
                border-radius: 10px; color: #e2e8f0; font-size: 14px;
                font-family: inherit; transition: all 0.2s ease;
            }
            .ann-form-textarea:focus {
                outline: none; border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139,92,246,0.15);
            }
            .ann-form-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
            .ann-priority-select { display: flex; gap: 8px; }
            .ann-priority-option {
                padding: 8px 14px; border-radius: 8px;
                background: rgba(50,50,80,0.5); border: 2px solid transparent;
                color: #94a3b8; font-size: 12px; font-weight: 600;
                cursor: pointer; transition: all 0.2s ease;
            }
            .ann-priority-option:hover { background: rgba(70,70,100,0.5); }
            .ann-priority-option.selected[data-value="normal"] { background: rgba(59,130,246,0.2); color: #60a5fa; border-color: #3b82f6; }
            .ann-priority-option.selected[data-value="urgent"] { background: rgba(239,68,68,0.2); color: #f87171; border-color: #ef4444; }
            .ann-priority-option.selected[data-value="info"] { background: rgba(34,197,94,0.2); color: #4ade80; border-color: #22c55e; }
            
            .ann-submit {
                padding: 12px 28px; border-radius: 10px;
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                border: none; color: white; font-size: 14px; font-weight: 700;
                cursor: pointer; transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(139,92,246,0.3);
            }
            .ann-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(139,92,246,0.4);
            }
            .ann-submit:active { transform: translateY(0); }
            
            /* Empty State */
            .ann-empty {
                flex: 1; display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                color: #64748b; text-align: center; padding: 40px;
            }
            .ann-empty svg { opacity: 0.3; margin-bottom: 20px; }
            .ann-empty-title { font-size: 18px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
            .ann-empty-text { font-size: 14px; }
            
            /* Loading */
            .ann-loading {
                position: absolute; inset: 0;
                background: rgba(10,10,26,0.9);
                display: flex; align-items: center; justify-content: center;
                z-index: 10;
            }
            .ann-spinner {
                width: 40px; height: 40px;
                border: 3px solid rgba(139,92,246,0.2);
                border-top-color: #8b5cf6;
                border-radius: 50%;
                animation: ann-spin 1s linear infinite;
            }
            @keyframes ann-spin { to { transform: rotate(360deg); } }
            
            /* Toast Premium */
            .ann-toast {
                position: fixed; bottom: 24px; right: 24px;
                padding: 16px 24px;
                background: linear-gradient(135deg, rgba(30,30,60,0.95) 0%, rgba(20,20,45,0.98) 100%);
                border: 1px solid rgba(139,92,246,0.3);
                border-radius: 14px; color: #e2e8f0; font-size: 14px;
                z-index: 100001; display: flex; align-items: center; gap: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                transform: translateY(100px); opacity: 0;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .ann-toast.show { transform: translateY(0); opacity: 1; }
            .ann-toast.success { border-color: rgba(34,197,94,0.5); }
            .ann-toast.error { border-color: rgba(239,68,68,0.5); }
            .ann-toast.info { border-color: rgba(59,130,246,0.5); }
            
            /* Modal Usuário */
            .ann-user-modal {
                position: fixed; inset: 0;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(12px);
                z-index: 100002; display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
            }
            .ann-user-modal.visible { opacity: 1; pointer-events: auto; }
            .ann-user-modal-content {
                background: linear-gradient(180deg, #1a1a35 0%, #12122a 100%);
                border: 1px solid rgba(139,92,246,0.3);
                border-radius: 20px; padding: 32px; width: 380px;
                box-shadow: 0 25px 80px rgba(0,0,0,0.6);
            }
            .ann-user-modal-title {
                font-size: 1.5rem; font-weight: 800; margin-bottom: 8px;
                background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
                -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            }
            .ann-user-modal-subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
            .ann-user-modal-input {
                width: 100%; padding: 14px 18px;
                background: rgba(30,30,60,0.8); border: 2px solid rgba(139,92,246,0.3);
                border-radius: 12px; color: #e2e8f0; font-size: 16px;
                margin-bottom: 20px; transition: all 0.2s ease;
            }
            .ann-user-modal-input:focus {
                outline: none; border-color: #8b5cf6;
                box-shadow: 0 0 0 4px rgba(139,92,246,0.15);
            }
            .ann-user-modal-btn {
                width: 100%; padding: 14px;
                background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                border: none; border-radius: 12px;
                color: white; font-size: 16px; font-weight: 700;
                cursor: pointer; transition: all 0.3s ease;
            }
            .ann-user-modal-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,92,246,0.4); }
        `;
        document.head.appendChild(styles);
    }

    // ========== UI PRINCIPAL ==========

    createUI() {
        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'ann-overlay';
        overlay.id = 'annotationsOverlay';
        overlay.onclick = () => this.closePanel();
        document.body.appendChild(overlay);

        // Painel Principal
        const panel = document.createElement('div');
        panel.className = 'ann-panel';
        panel.id = 'annotationsPanel';
        panel.innerHTML = this.renderPanelHTML();
        document.body.appendChild(panel);

        // User Modal
        const modal = document.createElement('div');
        modal.className = 'ann-user-modal';
        modal.id = 'annotationsUserModal';
        modal.innerHTML = `
            <div class="ann-user-modal-content">
                <div class="ann-user-modal-title">Identificação</div>
                <div class="ann-user-modal-subtitle">Digite seu nome para usar as anotações</div>
                <input type="text" class="ann-user-modal-input" id="annUserNameInput" placeholder="Seu nome..." maxlength="50">
                <button class="ann-user-modal-btn" onclick="window.annotationsModule?.confirmUserName()">Confirmar</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Toast
        const toast = document.createElement('div');
        toast.className = 'ann-toast';
        toast.id = 'annotationsToast';
        document.body.appendChild(toast);

        this.bindEvents();
    }

    renderPanelHTML() {
        const initial = this.currentUser ? this.currentUser.charAt(0).toUpperCase() : '?';
        return `
            <div class="ann-header">
                <div class="ann-header-top">
                    <h2 class="ann-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        Anotações
                    </h2>
                    <button class="ann-close" onclick="window.annotationsModule?.closePanel()">✕</button>
                </div>
                <div class="ann-connection" id="annConnection">
                    <span class="ann-connection-dot ${this.isConnected ? 'connected' : ''}" id="annConnectionDot"></span>
                    <span id="annConnectionText">${this.isConnected ? 'Conectado em tempo real' : 'Conectando...'}</span>
                </div>
            </div>

            <div class="ann-user-bar">
                <div class="ann-user-info">
                    <div class="ann-avatar">${initial}</div>
                    <span class="ann-user-name">${this.currentUser || 'Não identificado'}</span>
                </div>
                <button class="ann-change-user" onclick="window.annotationsModule?.promptUserName()">Alterar</button>
            </div>

            <div class="ann-search-box">
                <div class="ann-search-wrapper">
                    <svg class="ann-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="ann-search-input" id="annSearchInput" placeholder="Buscar por ticket, mensagem ou autor...">
                </div>
            </div>

            <div class="ann-tabs">
                <button class="ann-tab active" data-filter="all">
                    Todas <span class="ann-tab-count" id="annCountAll">${this.annotations.length}</span>
                </button>
                <button class="ann-tab" data-filter="unread">
                    Não lidas <span class="ann-tab-count" id="annCountUnread">${this.unreadCount}</span>
                </button>
                <button class="ann-tab" data-filter="mine">
                    Minhas <span class="ann-tab-count" id="annCountMine">${this.annotations.filter(a => a.author === this.currentUser).length}</span>
                </button>
            </div>

            <div class="ann-priority-filters">
                <button class="ann-priority-btn active" data-priority="all">Todas</button>
                <button class="ann-priority-btn" data-priority="urgent">🔴 Urgente</button>
                <button class="ann-priority-btn" data-priority="normal">🔵 Normal</button>
                <button class="ann-priority-btn" data-priority="info">🟢 Info</button>
            </div>

            <div class="ann-list" id="annotationsList"></div>

            <div class="ann-form">
                <div class="ann-form-title">Nova Anotação</div>
                <div class="ann-form-row">
                    <input type="text" class="ann-form-input" id="annTicketId" placeholder="ID do Ticket *" style="flex:0.4">
                    <input type="text" class="ann-form-input" id="annTicketSubject" placeholder="Assunto (opcional)" style="flex:0.6">
                </div>
                <textarea class="ann-form-textarea" id="annMessage" placeholder="Escreva sua anotação..." maxlength="1000"></textarea>
                <div class="ann-form-footer">
                    <div class="ann-priority-select">
                        <button class="ann-priority-option selected" data-value="normal">🔵 Normal</button>
                        <button class="ann-priority-option" data-value="urgent">🔴 Urgente</button>
                        <button class="ann-priority-option" data-value="info">🟢 Info</button>
                    </div>
                    <button class="ann-submit" onclick="window.annotationsModule?.submitAnnotation()">Enviar</button>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Search
        const searchInput = document.getElementById('annSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderAnnotationsList();
            });
        }

        // Tabs
        document.querySelectorAll('.ann-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.ann-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeFilter = tab.dataset.filter;
                this.renderAnnotationsList();
            };
        });

        // Priority filters
        document.querySelectorAll('.ann-priority-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.ann-priority-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activePriority = btn.dataset.priority;
                this.renderAnnotationsList();
            };
        });

        // Priority select in form
        document.querySelectorAll('.ann-priority-option').forEach(opt => {
            opt.onclick = () => {
                document.querySelectorAll('.ann-priority-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            };
        });

        // User modal enter key
        const userInput = document.getElementById('annUserNameInput');
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.confirmUserName();
            });
        }

        // Message enter to submit
        const msgInput = document.getElementById('annMessage');
        if (msgInput) {
            msgInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) this.submitAnnotation();
            });
        }
    }

    renderAnnotationsList() {
        const container = document.getElementById('annotationsList');
        if (!container) return;

        const filtered = this.getFilteredAnnotations();
        this.updateTabCounts();

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="ann-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div class="ann-empty-title">Nenhuma anotação</div>
                    <div class="ann-empty-text">${this.searchQuery ? 'Tente uma busca diferente' : 'Crie uma nova anotação abaixo'}</div>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(a => this.renderAnnotationCard(a)).join('');
    }

    renderAnnotationCard(annotation) {
        const isUnread = this.currentUser &&
            annotation.author !== this.currentUser &&
            !annotation.readBy.includes(this.currentUser);
        const isOwner = annotation.author === this.currentUser;
        const initial = annotation.author.charAt(0).toUpperCase();
        const priorityLabels = { urgent: 'Urgente', normal: 'Normal', info: 'Info' };

        return `
            <div class="ann-card ${isUnread ? 'unread' : ''} ${annotation.priority}" onclick="window.annotationsModule?.markAsRead('${annotation.id}')">
                <div class="ann-card-header">
                    <div class="ann-card-ticket">
                        <span class="ann-card-ticket-id" onclick="event.stopPropagation(); window.annotationsModule?.locateTicket('${annotation.ticketId}')">#${annotation.ticketId}</span>
                        <span class="ann-priority-tag ${annotation.priority}">${priorityLabels[annotation.priority] || 'Normal'}</span>
                    </div>
                    <div class="ann-card-actions">
                        ${isOwner ? `
                            <button class="ann-card-action delete" onclick="event.stopPropagation(); window.annotationsModule?.deleteAnnotation('${annotation.id}')" title="Excluir">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="ann-card-subject">📋 ${this.escapeHtml(annotation.ticketSubject || 'Sem assunto')}</div>
                <div class="ann-card-message">${this.escapeHtml(annotation.message)}</div>
                <div class="ann-card-footer">
                    <div class="ann-card-author">
                        <div class="ann-card-avatar">${initial}</div>
                        <span class="ann-card-author-name">${this.escapeHtml(annotation.author)}</span>
                    </div>
                    <span class="ann-card-time">${this.getTimeAgo(annotation.createdAt)}</span>
                </div>
            </div>
        `;
    }

    updateTabCounts() {
        const countAll = document.getElementById('annCountAll');
        const countUnread = document.getElementById('annCountUnread');
        const countMine = document.getElementById('annCountMine');

        if (countAll) countAll.textContent = this.annotations.length;
        if (countUnread) countUnread.textContent = this.unreadCount;
        if (countMine) countMine.textContent = this.annotations.filter(a => a.author === this.currentUser).length;
    }

    updateConnectionStatus() {
        const dot = document.getElementById('annConnectionDot');
        const text = document.getElementById('annConnectionText');
        if (dot) dot.classList.toggle('connected', this.isConnected);
        if (text) text.textContent = this.isConnected ? 'Conectado em tempo real' : 'Conectando...';
    }

    updateBadge() {
        const badge = document.getElementById('sidebarAnnotationsBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    showLoadingState() {
        const list = document.getElementById('annotationsList');
        if (list) {
            list.innerHTML = '<div class="ann-loading"><div class="ann-spinner"></div></div>';
        }
    }

    hideLoadingState() {
        if (this.isOpen) this.renderAnnotationsList();
    }

    // ========== AÇÕES ==========

    openPanel() {
        if (!this.currentUser) {
            this.promptUserName(() => this.openPanel());
            return;
        }
        this.isOpen = true;
        document.getElementById('annotationsOverlay')?.classList.add('visible');
        document.getElementById('annotationsPanel')?.classList.add('open');
        this.renderAnnotationsList();
    }

    closePanel() {
        this.isOpen = false;
        document.getElementById('annotationsOverlay')?.classList.remove('visible');
        document.getElementById('annotationsPanel')?.classList.remove('open');
    }

    submitAnnotation() {
        const ticketId = document.getElementById('annTicketId')?.value.trim();
        const subject = document.getElementById('annTicketSubject')?.value.trim();
        const message = document.getElementById('annMessage')?.value.trim();
        const priorityBtn = document.querySelector('.ann-priority-option.selected');
        const priority = priorityBtn?.dataset.value || 'normal';

        if (!ticketId) {
            this.showNotification('error', 'Informe o ID do ticket');
            return;
        }
        if (!message) {
            this.showNotification('error', 'Escreva uma mensagem');
            return;
        }

        this.addAnnotation(ticketId, subject, message, priority);
    }

    clearForm() {
        const ticketId = document.getElementById('annTicketId');
        const subject = document.getElementById('annTicketSubject');
        const message = document.getElementById('annMessage');
        if (ticketId) ticketId.value = '';
        if (subject) subject.value = '';
        if (message) message.value = '';
    }

    promptUserName(callback = null) {
        this.pendingCallback = callback;
        const modal = document.getElementById('annotationsUserModal');
        const input = document.getElementById('annUserNameInput');
        if (modal) modal.classList.add('visible');
        if (input) {
            input.value = this.currentUser || '';
            setTimeout(() => input.focus(), 100);
        }
    }

    confirmUserName() {
        const input = document.getElementById('annUserNameInput');
        const name = input?.value.trim();
        if (!name) {
            this.showNotification('error', 'Digite seu nome');
            return;
        }
        this.saveCurrentUser(name);
        document.getElementById('annotationsUserModal')?.classList.remove('visible');

        // Update UI
        const avatar = document.querySelector('.ann-avatar');
        const userName = document.querySelector('.ann-user-name');
        if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
        if (userName) userName.textContent = name;

        this.updateTabCounts();
        this.renderAnnotationsList();

        if (this.pendingCallback) {
            this.pendingCallback();
            this.pendingCallback = null;
        }
    }

    locateTicket(ticketId) {
        // Try to find ticket in cache
        if (window.allTicketsCache) {
            const ticket = window.allTicketsCache.find(t => String(t.id) === String(ticketId));
            if (ticket && typeof window.showTicketDetails === 'function') {
                this.closePanel();
                window.showTicketDetails(ticket);
                return;
            }
        }
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(ticketId).then(() => {
            this.showNotification('info', `Ticket #${ticketId} copiado para área de transferência`);
        });
    }

    showNotification(type, message, duration = null) {
        const toast = document.getElementById('annotationsToast');
        if (!toast) return;

        toast.className = `ann-toast ${type}`;
        toast.innerHTML = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, duration || this.config.notificationDuration);
    }

    // ========== UTILITÁRIOS ==========

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}min atrás`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h atrás`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d atrás`;
        return date.toLocaleDateString('pt-BR');
    }

    getAnnotationsForTicket(ticketId) {
        return this.annotations.filter(a => String(a.ticketId) === String(ticketId));
    }

    // ========== API PÚBLICA ==========

    addNote(ticketId, message, subject = null, priority = 'normal') {
        return this.addAnnotation(ticketId, subject, message, priority);
    }

    getNotesForTicket(ticketId) {
        return this.getAnnotationsForTicket(ticketId);
    }

    hasNotes(ticketId) {
        return this.getAnnotationsForTicket(ticketId).length > 0;
    }

    getIndicatorHTML(ticketId) {
        const notes = this.getAnnotationsForTicket(ticketId);
        if (notes.length === 0) return '';

        const hasUrgent = notes.some(n => n.priority === 'urgent');
        const color = hasUrgent ? '#ef4444' : '#8b5cf6';

        return `<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:${color}20;border-radius:6px;font-size:11px;color:${color};cursor:pointer" onclick="window.annotationsModule?.openPanel()" title="${notes.length} anotação(ões)">📝 ${notes.length}</span>`;
    }
}

// Inicialização
window.annotationsModule = new AnnotationsModule();
console.log('📝 Anotações Premium carregado');
