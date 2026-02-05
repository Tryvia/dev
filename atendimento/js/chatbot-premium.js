/**
 * IA Tryviano Premium v4.0
 * Assistente Inteligente de Alta Performance
 * 
 * Melhorias:
 * - Design premium com animações fluidas
 * - Inteligência contextual avançada
 * - Respostas mais naturais e personalizadas
 * - Modo escuro/claro
 * - Sugestões inteligentes baseadas em contexto
 * - Análise preditiva de tickets
 * - Dashboard de métricas inline
 */

(function() {
    'use strict';

    // Injetar CSS Premium
    const injectPremiumStyles = () => {
        const styleId = 'tryviano-premium-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* =============================================
               TRYVIANO PREMIUM - DESIGN SYSTEM
               ============================================= */
            
            :root {
                --try-primary: #8b5cf6;
                --try-primary-dark: #7c3aed;
                --try-secondary: #06b6d4;
                --try-accent: #f59e0b;
                --try-success: #10b981;
                --try-danger: #ef4444;
                --try-warning: #f59e0b;
                
                --try-bg: #0f0f1a;
                --try-surface: #1a1a2e;
                --try-surface-hover: #252540;
                --try-border: rgba(139, 92, 246, 0.2);
                --try-text: #f1f5f9;
                --try-text-muted: #94a3b8;
                
                --try-gradient-1: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
                --try-gradient-2: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
                --try-gradient-3: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f59e0b 100%);
                
                --try-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                --try-shadow-glow: 0 0 40px rgba(139, 92, 246, 0.3);
                --try-radius: 20px;
            }

            /* Botão Flutuante Premium */
            #tryvianoButton {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 64px;
                height: 64px;
                background: var(--try-gradient-1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: var(--try-shadow), var(--try-shadow-glow);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 99998;
                border: 2px solid rgba(255,255,255,0.1);
                overflow: hidden;
            }

            #tryvianoButton::before {
                content: '';
                position: absolute;
                inset: -50%;
                background: conic-gradient(from 0deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: tryRotate 4s linear infinite;
            }

            #tryvianoButton::after {
                content: '';
                position: absolute;
                inset: 2px;
                background: var(--try-gradient-1);
                border-radius: 50%;
            }

            @keyframes tryRotate {
                to { transform: rotate(360deg); }
            }

            #tryvianoButton:hover {
                transform: scale(1.1) translateY(-4px);
                box-shadow: var(--try-shadow), 0 0 60px rgba(139, 92, 246, 0.5);
            }

            #tryvianoButton img {
                width: 65%;
                height: 65%;
                object-fit: contain;
                position: relative;
                z-index: 1;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }

            /* Indicador de Notificação */
            #tryvianoButton .try-badge {
                position: absolute;
                top: -4px;
                right: -4px;
                width: 24px;
                height: 24px;
                background: var(--try-danger);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                color: white;
                z-index: 2;
                animation: tryPulse 2s ease-in-out infinite;
            }

            @keyframes tryPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            /* Janela Principal Premium */
            #tryvianoWindow {
                display: none;
                position: fixed;
                bottom: 100px;
                right: 24px;
                width: 420px;
                height: 600px;
                background: var(--try-bg);
                border: 1px solid var(--try-border);
                border-radius: var(--try-radius);
                box-shadow: var(--try-shadow), var(--try-shadow-glow);
                z-index: 99999;
                flex-direction: column;
                overflow: hidden;
                backdrop-filter: blur(20px);
            }

            #tryvianoWindow.active {
                display: flex;
                animation: trySlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes trySlideIn {
                from { 
                    opacity: 0; 
                    transform: translateY(30px) scale(0.95);
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1);
                }
            }

            /* Header Premium */
            .try-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.25rem;
                background: var(--try-gradient-1);
                position: relative;
                overflow: hidden;
            }

            .try-header::before {
                content: '';
                position: absolute;
                inset: 0;
                background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
                opacity: 0.5;
            }

            .try-header-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                position: relative;
                z-index: 1;
            }

            .try-avatar {
                width: 48px;
                height: 48px;
                background: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                padding: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                position: relative;
            }

            .try-avatar::after {
                content: '';
                position: absolute;
                bottom: 2px;
                right: 2px;
                width: 14px;
                height: 14px;
                background: var(--try-success);
                border-radius: 50%;
                border: 3px solid white;
            }

            .try-avatar img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .try-name {
                font-weight: 700;
                font-size: 1.1rem;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .try-status {
                font-size: 0.75rem;
                color: rgba(255,255,255,0.9);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .try-status-dot {
                width: 8px;
                height: 8px;
                background: #4ade80;
                border-radius: 50%;
                animation: tryStatusPulse 2s ease-in-out infinite;
            }

            @keyframes tryStatusPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            .try-header-actions {
                display: flex;
                gap: 0.5rem;
                position: relative;
                z-index: 1;
            }

            .try-btn {
                background: rgba(255,255,255,0.15);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 12px;
                cursor: pointer;
                color: white;
                font-size: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
                backdrop-filter: blur(10px);
            }

            .try-btn:hover {
                background: rgba(255,255,255,0.25);
                transform: translateY(-2px);
            }

            /* Área de Mensagens */
            .try-messages {
                flex: 1;
                overflow-y: auto;
                padding: 1.25rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                background: var(--try-gradient-2);
            }

            .try-messages::-webkit-scrollbar {
                width: 6px;
            }

            .try-messages::-webkit-scrollbar-track {
                background: transparent;
            }

            .try-messages::-webkit-scrollbar-thumb {
                background: var(--try-primary);
                border-radius: 3px;
            }

            /* Welcome Card Premium */
            .try-welcome {
                text-align: center;
                padding: 2rem 1.5rem;
                background: linear-gradient(135deg, var(--try-surface) 0%, rgba(139, 92, 246, 0.1) 100%);
                border-radius: 16px;
                border: 1px solid var(--try-border);
            }

            .try-welcome-avatar {
                width: 80px;
                height: 80px;
                margin: 0 auto 1rem;
                background: var(--try-gradient-1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2.5rem;
                animation: tryFloat 3s ease-in-out infinite;
            }

            @keyframes tryFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }

            .try-welcome-title {
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--try-text);
                margin-bottom: 0.5rem;
                background: var(--try-gradient-3);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .try-welcome-subtitle {
                color: var(--try-text-muted);
                font-size: 0.9rem;
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }

            /* Sugestões Premium */
            .try-suggestions {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                justify-content: center;
            }

            .try-suggestion {
                background: var(--try-surface);
                border: 1px solid var(--try-border);
                color: var(--try-text);
                padding: 0.6rem 1rem;
                border-radius: 24px;
                font-size: 0.8rem;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .try-suggestion:hover {
                background: var(--try-primary);
                border-color: var(--try-primary);
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
            }

            /* Mensagens */
            .try-msg {
                max-width: 85%;
                padding: 0.875rem 1rem;
                border-radius: 16px;
                font-size: 0.9rem;
                line-height: 1.6;
                animation: tryMsgIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }

            @keyframes tryMsgIn {
                from { 
                    opacity: 0; 
                    transform: translateY(10px) scale(0.95);
                }
                to { 
                    opacity: 1; 
                    transform: translateY(0) scale(1);
                }
            }

            .try-msg.user {
                align-self: flex-end;
                background: var(--try-gradient-1);
                color: white;
                border-bottom-right-radius: 4px;
            }

            .try-msg.bot {
                align-self: flex-start;
                background: var(--try-surface);
                color: var(--try-text);
                border: 1px solid var(--try-border);
                border-bottom-left-radius: 4px;
            }

            .try-msg.bot .try-msg-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--try-border);
            }

            .try-msg.bot .try-msg-avatar {
                width: 24px;
                height: 24px;
                background: var(--try-gradient-1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
            }

            .try-msg.bot .try-msg-name {
                font-size: 0.75rem;
                font-weight: 600;
                color: var(--try-primary);
            }

            .try-msg.bot .try-msg-time {
                font-size: 0.7rem;
                color: var(--try-text-muted);
                margin-left: auto;
            }

            /* Valores Destacados */
            .try-value {
                font-size: 2rem;
                font-weight: 800;
                background: var(--try-gradient-1);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                margin: 0.5rem 0;
            }

            .try-label {
                font-size: 0.75rem;
                color: var(--try-text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .try-detail {
                font-size: 0.8rem;
                color: var(--try-text-muted);
                margin-top: 0.5rem;
            }

            /* Cards de Métricas */
            .try-metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.75rem;
                margin-top: 1rem;
            }

            .try-metric-card {
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid var(--try-border);
                border-radius: 12px;
                padding: 0.75rem;
                text-align: center;
            }

            .try-metric-value {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--try-primary);
            }

            .try-metric-label {
                font-size: 0.7rem;
                color: var(--try-text-muted);
                text-transform: uppercase;
            }

            /* Alertas */
            .try-alert {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                margin-top: 0.75rem;
                font-size: 0.85rem;
                color: var(--try-danger);
            }

            .try-success-alert {
                background: rgba(16, 185, 129, 0.1);
                border-color: rgba(16, 185, 129, 0.3);
                color: var(--try-success);
            }

            /* Typing Indicator Premium */
            .try-typing {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 1rem;
                align-self: flex-start;
            }

            .try-typing-avatar {
                width: 32px;
                height: 32px;
                background: var(--try-gradient-1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .try-typing-dots {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
                background: var(--try-surface);
                border-radius: 16px;
                border: 1px solid var(--try-border);
            }

            .try-typing-dots span {
                width: 8px;
                height: 8px;
                background: var(--try-primary);
                border-radius: 50%;
                animation: tryTypingBounce 1.4s ease-in-out infinite;
            }

            .try-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
            .try-typing-dots span:nth-child(3) { animation-delay: 0.4s; }

            @keyframes tryTypingBounce {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-8px); }
            }

            /* Input Area Premium */
            .try-input-area {
                display: flex;
                gap: 0.75rem;
                padding: 1rem 1.25rem;
                background: var(--try-surface);
                border-top: 1px solid var(--try-border);
            }

            .try-input-wrapper {
                flex: 1;
                position: relative;
            }

            .try-input {
                width: 100%;
                background: var(--try-bg);
                border: 1px solid var(--try-border);
                border-radius: 24px;
                padding: 0.875rem 1.25rem;
                color: var(--try-text);
                font-size: 0.95rem;
                outline: none;
                transition: all 0.3s;
            }

            .try-input:focus {
                border-color: var(--try-primary);
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
            }

            .try-input::placeholder {
                color: var(--try-text-muted);
            }

            .try-send {
                width: 48px;
                height: 48px;
                background: var(--try-gradient-1);
                border: none;
                border-radius: 50%;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
                flex-shrink: 0;
            }

            .try-send:hover {
                transform: scale(1.08);
                box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
            }

            .try-send:active {
                transform: scale(0.95);
            }

            .try-send svg {
                width: 22px;
                height: 22px;
            }

            /* Quick Actions */
            .try-quick-actions {
                display: flex;
                gap: 0.5rem;
                padding: 0.5rem 1.25rem;
                background: var(--try-surface);
                border-top: 1px solid var(--try-border);
                overflow-x: auto;
            }

            .try-quick-action {
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid var(--try-border);
                color: var(--try-text);
                padding: 0.4rem 0.75rem;
                border-radius: 16px;
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.2s;
                white-space: nowrap;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .try-quick-action:hover {
                background: var(--try-primary);
                border-color: var(--try-primary);
            }

            /* Settings Panel */
            .try-settings {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: var(--try-bg);
                z-index: 10;
                display: none;
                flex-direction: column;
                animation: tryFadeIn 0.3s;
            }

            .try-settings.active {
                display: flex;
            }

            @keyframes tryFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .try-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem 1.25rem;
                background: var(--try-surface);
                border-bottom: 1px solid var(--try-border);
            }

            .try-settings-title {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--try-text);
            }

            .try-settings-body {
                flex: 1;
                padding: 1.5rem;
                overflow-y: auto;
            }

            .try-setting-group {
                margin-bottom: 1.5rem;
            }

            .try-setting-label {
                font-size: 0.8rem;
                font-weight: 600;
                color: var(--try-text-muted);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 0.75rem;
            }

            .try-setting-input {
                width: 100%;
                background: var(--try-surface);
                border: 1px solid var(--try-border);
                border-radius: 12px;
                padding: 0.875rem 1rem;
                color: var(--try-text);
                font-size: 0.9rem;
                outline: none;
            }

            .try-setting-input:focus {
                border-color: var(--try-primary);
            }

            .try-setting-hint {
                font-size: 0.75rem;
                color: var(--try-text-muted);
                margin-top: 0.5rem;
            }

            /* Badge de IA */
            .try-ai-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: var(--try-gradient-1);
                color: white;
                font-size: 0.65rem;
                font-weight: 600;
                padding: 3px 8px;
                border-radius: 12px;
                margin-right: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .try-ai-badge.agent {
                background: var(--try-gradient-3);
            }

            /* Responsive */
            @media (max-width: 480px) {
                #tryvianoWindow {
                    width: calc(100vw - 20px);
                    height: calc(100vh - 120px);
                    bottom: 80px;
                    right: 10px;
                    border-radius: 16px;
                }
                
                #tryvianoButton {
                    width: 56px;
                    height: 56px;
                    bottom: 16px;
                    right: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    };

    // Módulo Premium do Tryviano
    const TryvianoPremium = {
        isOpen: false,
        messages: [],
        isTyping: false,
        notificationCount: 0,
        
        // Personalidade do Assistente
        personality: {
            name: 'Tryviano',
            greeting: 'Olá! 👋 Sou o Tryviano, seu assistente premium de BI.',
            avatar: 'tryvia.png',
            traits: ['proativo', 'analítico', 'amigável']
        },

        // Configuração de IA Premium
        aiConfig: {
            // Provedor primário selecionável
            primaryProvider: localStorage.getItem('chatbot_primary_provider') || 'gemini',
            
            // Ordem de fallback (configurável)
            fallbackOrder: ['gemini', 'openrouter', 'groq'],
            
            // API Keys
            geminiKey: localStorage.getItem('chatbot_gemini_key') || 'AIzaSyAf1Y_iJxafTDKIw_IpSrFdKYx7DQ3pVuc',
            groqKey: localStorage.getItem('chatbot_groq_key') || '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',
            openrouterKey: localStorage.getItem('chatbot_openrouter_key') || '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',
            
            // Modelos
            geminiModel: 'gemini-2.0-flash-exp',
            groqModel: 'llama-3.3-70b-versatile',
            openrouterModel: 'google/gemini-2.0-flash-exp:free', // Modelo gratuito no OpenRouter
            
            maxTokens: 800,
            temperature: 0.7,
            systemPersonality: localStorage.getItem('chatbot_personality') || 'conversacional'
        },

        // Contexto de conversa avançado
        context: {
            conversationHistory: [],
            lastIntent: null,
            lastEntity: null,
            lastMetric: null,
            userPreferences: {},
            sessionStart: new Date(),
            questionsAsked: 0
        },

        // Sugestões inteligentes baseadas em contexto
        smartSuggestions: {
            default: [
                { icon: '📊', text: 'Status rápido', query: 'Qual o status atual?' },
                { icon: '🚨', text: 'Alertas', query: 'Tem algum alerta?' },
                { icon: '🔮', text: 'Previsão', query: 'Previsão para próximos dias' },
                { icon: '🏆', text: 'Ranking', query: 'Quem mais resolveu?' }
            ],
            afterSLA: [
                { icon: '📉', text: 'Fora do SLA', query: 'Quais tickets estão fora do SLA?' },
                { icon: '👤', text: 'Por pessoa', query: 'SLA por pessoa' },
                { icon: '📈', text: 'Tendência', query: 'Tendência de SLA' }
            ],
            afterPerson: [
                { icon: '📊', text: 'Detalhes', query: 'Mais detalhes dessa pessoa' },
                { icon: '📅', text: 'Histórico', query: 'Histórico completo' },
                { icon: '⚖️', text: 'Comparar', query: 'Comparar com outros' }
            ],
            afterTicket: [
                { icon: '🔗', text: 'Similar', query: 'Tickets similares' },
                { icon: '📝', text: 'Histórico', query: 'Histórico do solicitante' },
                { icon: '💡', text: 'Solução', query: 'Sugestão de solução' }
            ]
        },

        init() {
            console.log('🤖 Inicializando Tryviano Premium...');
            injectPremiumStyles();
            this.createButton();
            this.createWindow();
            this.loadHistory();
            this.checkForAlerts();
            
            // Verificar se o Chatbot original existe e desativar visual
            if (window.Chatbot) {
                const oldBtn = document.getElementById('chatbotButton');
                const oldWin = document.getElementById('chatbotWindow');
                if (oldBtn) oldBtn.style.display = 'none';
                if (oldWin) oldWin.style.display = 'none';
            }
            
            console.log('✅ Tryviano Premium iniciado!');
        },

        createButton() {
            const btn = document.createElement('div');
            btn.id = 'tryvianoButton';
            btn.innerHTML = `
                <img src="${this.personality.avatar}" alt="Tryviano" onerror="this.innerHTML='🤖'">
                <div class="try-badge" style="display:none">0</div>
            `;
            btn.onclick = () => this.toggle();
            document.body.appendChild(btn);
        },

        createWindow() {
            const win = document.createElement('div');
            win.id = 'tryvianoWindow';
            win.innerHTML = `
                <div class="try-header">
                    <div class="try-header-info">
                        <div class="try-avatar">
                            <img src="${this.personality.avatar}" alt="Tryviano" onerror="this.innerHTML='🤖'">
                        </div>
                        <div>
                            <div class="try-name">IA ${this.personality.name}</div>
                            <div class="try-status">
                                <span class="try-status-dot"></span>
                                <span id="tryStatus">${this.getProviderStatusText()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="try-header-actions">
                        <button class="try-btn" onclick="TryvianoPremium.showSettings()" title="Configurações">⚙️</button>
                        <button class="try-btn" onclick="TryvianoPremium.clearChat()" title="Limpar">🗑️</button>
                        <button class="try-btn" onclick="TryvianoPremium.close()" title="Fechar">✕</button>
                    </div>
                </div>
                
                <div class="try-messages" id="tryMessages">
                    ${this.renderWelcome()}
                </div>
                
                <div class="try-quick-actions" id="tryQuickActions">
                    ${this.renderQuickActions()}
                </div>
                
                <div class="try-input-area">
                    <div class="try-input-wrapper">
                        <input type="text" class="try-input" id="tryInput" 
                            placeholder="Pergunte qualquer coisa..." 
                            onkeypress="if(event.key==='Enter')TryvianoPremium.send()">
                    </div>
                    <button class="try-send" onclick="TryvianoPremium.send()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
                
                <div class="try-settings" id="trySettings">
                    <div class="try-settings-header">
                        <span class="try-settings-title">⚙️ Configurações</span>
                        <button class="try-btn" onclick="TryvianoPremium.hideSettings()">✕</button>
                    </div>
                    <div class="try-settings-body">
                        <div class="try-setting-group">
                            <div class="try-setting-label">🎯 Provedor Primário</div>
                            <select class="try-setting-input" id="tryPrimaryProvider">
                                <option value="gemini" ${this.aiConfig.primaryProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                                <option value="openrouter" ${this.aiConfig.primaryProvider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
                                <option value="groq" ${this.aiConfig.primaryProvider === 'groq' ? 'selected' : ''}>Groq</option>
                            </select>
                            <div class="try-setting-hint">Se falhar, usará fallback automático</div>
                        </div>
                        <div class="try-setting-group">
                            <div class="try-setting-label">🔑 API Key Gemini</div>
                            <input type="password" class="try-setting-input" id="tryGeminiKey" 
                                value="${this.aiConfig.geminiKey || ''}" 
                                placeholder="Cole sua API key aqui">
                            <div class="try-setting-hint">Obtenha em aistudio.google.com</div>
                        </div>
                        <div class="try-setting-group">
                            <div class="try-setting-label">🔑 API Key OpenRouter</div>
                            <input type="password" class="try-setting-input" id="tryOpenRouterKey" 
                                value="${this.aiConfig.openrouterKey || ''}" 
                                placeholder="Cole sua API key aqui">
                            <div class="try-setting-hint">Obtenha em openrouter.ai</div>
                        </div>
                        <div class="try-setting-group">
                            <div class="try-setting-label">🔑 API Key Groq</div>
                            <input type="password" class="try-setting-input" id="tryGroqKey" 
                                value="${this.aiConfig.groqKey || ''}" 
                                placeholder="Cole sua API key aqui">
                            <div class="try-setting-hint">Obtenha em console.groq.com</div>
                        </div>
                        <div class="try-setting-group">
                            <div class="try-setting-label">🎭 Personalidade</div>
                            <select class="try-setting-input" id="tryPersonality" onchange="TryvianoPremium.changePersonality(this.value)">
                                <option value="conversacional" ${this.aiConfig.systemPersonality === 'conversacional' ? 'selected' : ''}>Conversacional</option>
                                <option value="formal" ${this.aiConfig.systemPersonality === 'formal' ? 'selected' : ''}>Formal</option>
                                <option value="tecnico" ${this.aiConfig.systemPersonality === 'tecnico' ? 'selected' : ''}>Técnico</option>
                            </select>
                        </div>
                        <button class="try-btn" style="width:100%;margin-top:1rem;background:var(--try-gradient-1);padding:0.75rem;border-radius:12px;" onclick="TryvianoPremium.saveSettings()">
                            💾 Salvar Configurações
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(win);
        },

        renderWelcome() {
            const suggestions = this.smartSuggestions.default;
            return `
                <div class="try-welcome">
                    <div class="try-welcome-avatar">🤖</div>
                    <div class="try-welcome-title">${this.personality.greeting}</div>
                    <div class="try-welcome-subtitle">
                        Posso ajudar com análises de tickets, métricas de SLA, 
                        previsões e muito mais. O que deseja saber?
                    </div>
                    <div class="try-suggestions">
                        ${suggestions.map(s => `
                            <button class="try-suggestion" onclick="TryvianoPremium.askSuggestion('${s.query}')">
                                ${s.icon} ${s.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        renderQuickActions() {
            const actions = this.getContextualActions();
            return actions.map(a => `
                <button class="try-quick-action" onclick="TryvianoPremium.askSuggestion('${a.query}')">
                    ${a.icon} ${a.text}
                </button>
            `).join('');
        },

        getContextualActions() {
            // Baseado no contexto da última pergunta
            if (this.context.lastIntent === 'sla') {
                return this.smartSuggestions.afterSLA;
            }
            if (this.context.lastEntity) {
                return this.smartSuggestions.afterPerson;
            }
            return this.smartSuggestions.default.slice(0, 4);
        },

        toggle() {
            this.isOpen ? this.close() : this.open();
        },

        open() {
            document.getElementById('tryvianoWindow').classList.add('active');
            document.getElementById('tryInput').focus();
            this.isOpen = true;
            this.notificationCount = 0;
            this.updateBadge();
        },

        close() {
            document.getElementById('tryvianoWindow').classList.remove('active');
            this.isOpen = false;
        },

        showSettings() {
            document.getElementById('trySettings').classList.add('active');
        },

        hideSettings() {
            document.getElementById('trySettings').classList.remove('active');
        },

        saveSettings() {
            const primaryProvider = document.getElementById('tryPrimaryProvider').value;
            const geminiKey = document.getElementById('tryGeminiKey').value.trim();
            const openrouterKey = document.getElementById('tryOpenRouterKey').value.trim();
            const groqKey = document.getElementById('tryGroqKey').value.trim();
            
            // Salvar provedor primário
            localStorage.setItem('chatbot_primary_provider', primaryProvider);
            this.aiConfig.primaryProvider = primaryProvider;
            
            // Salvar API keys
            if (geminiKey) {
                localStorage.setItem('chatbot_gemini_key', geminiKey);
                this.aiConfig.geminiKey = geminiKey;
            }
            if (openrouterKey) {
                localStorage.setItem('chatbot_openrouter_key', openrouterKey);
                this.aiConfig.openrouterKey = openrouterKey;
            }
            if (groqKey) {
                localStorage.setItem('chatbot_groq_key', groqKey);
                this.aiConfig.groqKey = groqKey;
            }
            
            // Atualizar status
            document.getElementById('tryStatus').textContent = this.getProviderStatusText();
            
            this.hideSettings();
            this.addMessage('✅ Configurações salvas com sucesso!', 'bot');
        },

        changePersonality(value) {
            this.aiConfig.systemPersonality = value;
            localStorage.setItem('tryviano_personality', value);
        },

        askSuggestion(text) {
            document.getElementById('tryInput').value = text;
            this.send();
        },

        async send() {
            const input = document.getElementById('tryInput');
            const text = input.value.trim();
            if (!text) return;

            // Adicionar mensagem do usuário
            this.addMessage(text, 'user');
            input.value = '';
            this.context.questionsAsked++;

            // Remover welcome
            const welcome = document.querySelector('.try-welcome');
            if (welcome) welcome.remove();

            // Mostrar typing
            this.showTyping();

            // Detectar intenção para contexto
            this.detectIntent(text);

            // Processar resposta
            let response;
            try {
                // Tentar usar o Chatbot original se disponível (para aproveitar ferramentas)
                if (window.Chatbot && window.Chatbot.agent) {
                    const agentResult = await window.Chatbot.agent.process(text, window.Chatbot);
                    
                    if (agentResult.response && !agentResult.useAI) {
                        response = agentResult.response;
                    } else {
                        // Usar IA com contexto enriquecido
                        response = await this.callAIPremium(text);
                    }
                } else {
                    response = await this.callAIPremium(text);
                }

                if (!response) {
                    response = this.processLocal(text);
                }
            } catch (error) {
                console.error('Erro:', error);
                response = this.processLocal(text);
            }

            this.hideTyping();
            this.addMessage(response, 'bot');
            
            // Atualizar ações contextuais
            this.updateQuickActions();
            
            // Salvar no histórico
            this.saveHistory();
        },

        detectIntent(text) {
            const lower = text.toLowerCase();
            
            if (/sla|tempo.*respo|prazo/i.test(lower)) {
                this.context.lastIntent = 'sla';
            } else if (/pessoa|tratativa|quem|colaborador/i.test(lower)) {
                this.context.lastIntent = 'person';
            } else if (/ticket|#\d+|chamado/i.test(lower)) {
                this.context.lastIntent = 'ticket';
            } else if (/ranking|melhor|pior|top/i.test(lower)) {
                this.context.lastIntent = 'ranking';
            } else if (/alert|urgente|crítico|problema/i.test(lower)) {
                this.context.lastIntent = 'alert';
            } else {
                this.context.lastIntent = 'general';
            }

            // Extrair entidade (nome de pessoa)
            const personMatch = lower.match(/(?:do|da|de|para)\s+([a-záéíóúãõâêîôûç]+(?:\s+[a-záéíóúãõâêîôûç]+)?)/i);
            if (personMatch) {
                this.context.lastEntity = personMatch[1];
            }
        },

        updateQuickActions() {
            const container = document.getElementById('tryQuickActions');
            if (container) {
                container.innerHTML = this.renderQuickActions();
            }
        },

        addMessage(content, type) {
            const container = document.getElementById('tryMessages');
            const msg = document.createElement('div');
            msg.className = `try-msg ${type}`;
            
            if (type === 'bot') {
                const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                msg.innerHTML = `
                    <div class="try-msg-header">
                        <div class="try-msg-avatar">🤖</div>
                        <span class="try-msg-name">Tryviano</span>
                        <span class="try-msg-time">${time}</span>
                    </div>
                    <div class="try-msg-content">${content}</div>
                `;
            } else {
                msg.innerHTML = content;
            }
            
            container.appendChild(msg);
            container.scrollTop = container.scrollHeight;

            this.messages.push({ content, type, time: Date.now() });
            this.context.conversationHistory.push({ type, content: content.replace(/<[^>]*>/g, '') });
            
            // Manter histórico limitado
            if (this.context.conversationHistory.length > 20) {
                this.context.conversationHistory = this.context.conversationHistory.slice(-20);
            }
        },

        showTyping() {
            const container = document.getElementById('tryMessages');
            const typing = document.createElement('div');
            typing.className = 'try-typing';
            typing.id = 'tryTyping';
            typing.innerHTML = `
                <div class="try-typing-avatar">🤖</div>
                <div class="try-typing-dots">
                    <span></span><span></span><span></span>
                </div>
            `;
            container.appendChild(typing);
            container.scrollTop = container.scrollHeight;
            this.isTyping = true;
        },

        hideTyping() {
            const typing = document.getElementById('tryTyping');
            if (typing) typing.remove();
            this.isTyping = false;
        },

        // Função auxiliar para obter nome do provedor
        getProviderName(provider) {
            const names = {
                gemini: 'Google Gemini',
                openrouter: 'OpenRouter',
                groq: 'Groq'
            };
            return names[provider] || provider;
        },

        // Obter texto de status do provedor
        getProviderStatusText() {
            const provider = this.aiConfig.primaryProvider;
            const icons = { gemini: '🔵', openrouter: '🟢', groq: '🟠' };
            return `${icons[provider] || '⚪'} ${this.getProviderName(provider)}`;
        },

        // Mostrar aviso de fallback no chat
        showFallbackWarning(failedProvider, fallbackProvider, errorMsg) {
            const warning = document.createElement('div');
            warning.className = 'try-fallback-warning';
            warning.innerHTML = `
                <div style="background: linear-gradient(135deg, #f59e0b20, #ef444420); 
                            border: 1px solid #f59e0b40; 
                            border-radius: 12px; 
                            padding: 0.75rem 1rem; 
                            margin: 0.5rem 0;
                            font-size: 0.85rem;">
                    <div style="color: #f59e0b; font-weight: 600; margin-bottom: 0.25rem;">
                        ⚠️ Fallback Ativado
                    </div>
                    <div style="color: #fbbf24; opacity: 0.9;">
                        ${this.getProviderName(failedProvider)} falhou${errorMsg ? `: ${errorMsg}` : ''}.
                        Usando ${this.getProviderName(fallbackProvider)} como alternativa.
                    </div>
                </div>
            `;
            document.getElementById('tryMessages').appendChild(warning);
            document.getElementById('tryMessages').scrollTop = document.getElementById('tryMessages').scrollHeight;
        },

        // Chamada principal com sistema de fallback
        async callAIPremium(userMessage) {
            const primaryProvider = this.aiConfig.primaryProvider;
            
            // Construir ordem de tentativas: primário primeiro, depois fallbacks
            const providers = [primaryProvider, ...this.aiConfig.fallbackOrder.filter(p => p !== primaryProvider)];
            
            let lastError = null;
            
            for (let i = 0; i < providers.length; i++) {
                const provider = providers[i];
                
                try {
                    console.log(`🤖 Tentando ${this.getProviderName(provider)}...`);
                    
                    let response = null;
                    
                    switch (provider) {
                        case 'gemini':
                            response = await this.callGemini(userMessage);
                            break;
                        case 'openrouter':
                            response = await this.callOpenRouter(userMessage);
                            break;
                        case 'groq':
                            response = await this.callGroq(userMessage);
                            break;
                    }
                    
                    if (response) {
                        // Se usou fallback (não é o primeiro), mostrar aviso
                        if (i > 0) {
                            this.showFallbackWarning(providers[i - 1], provider, lastError);
                        }
                        console.log(`✅ Resposta obtida via ${this.getProviderName(provider)}`);
                        return response;
                    }
                    
                    lastError = 'Sem resposta';
                } catch (error) {
                    console.error(`❌ Erro em ${this.getProviderName(provider)}:`, error);
                    lastError = error.message || 'Erro desconhecido';
                }
            }
            
            // Todos falharam
            console.error('❌ Todas as APIs falharam');
            return null;
        },

        // Chamada Google Gemini
        async callGemini(userMessage) {
            if (!this.aiConfig.geminiKey) return null;

            const systemPrompt = this.getEnhancedSystemPrompt();
            const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.aiConfig.geminiModel}:generateContent?key=${this.aiConfig.geminiKey}`;
            
            const contents = this.context.conversationHistory.slice(-6).map(h => ({
                role: h.type === 'user' ? 'user' : 'model',
                parts: [{ text: h.content }]
            }));
            
            contents.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: {
                        temperature: this.aiConfig.temperature,
                        maxOutputTokens: this.aiConfig.maxTokens
                    }
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            return aiResponse ? this.formatResponse(aiResponse) : null;
        },

        // Chamada OpenRouter
        async callOpenRouter(userMessage) {
            if (!this.aiConfig.openrouterKey) return null;

            const systemPrompt = this.getEnhancedSystemPrompt();
            const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.context.conversationHistory.slice(-6).map(h => ({
                    role: h.type === 'user' ? 'user' : 'assistant',
                    content: h.content
                })),
                { role: 'user', content: userMessage }
            ];

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.aiConfig.openrouterKey}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Tryviano BI Assistant'
                },
                body: JSON.stringify({
                    model: this.aiConfig.openrouterModel,
                    messages,
                    max_tokens: this.aiConfig.maxTokens,
                    temperature: this.aiConfig.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content;
            
            return aiResponse ? this.formatResponse(aiResponse) : null;
        },

        // Chamada Groq
        async callGroq(userMessage) {
            if (!this.aiConfig.groqKey) return null;

            const systemPrompt = this.getEnhancedSystemPrompt();
            const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
            
            const messages = [
                { role: 'system', content: systemPrompt },
                ...this.context.conversationHistory.slice(-6).map(h => ({
                    role: h.type === 'user' ? 'user' : 'assistant',
                    content: h.content
                })),
                { role: 'user', content: userMessage }
            ];

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.aiConfig.groqKey}`
                },
                body: JSON.stringify({
                    model: this.aiConfig.groqModel,
                    messages,
                    max_tokens: this.aiConfig.maxTokens,
                    temperature: this.aiConfig.temperature
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content;
            
            return aiResponse ? this.formatResponse(aiResponse) : null;
        },

        getEnhancedSystemPrompt() {
            const tickets = window.allTicketsCache || [];
            const context = this.generateDataContext(tickets);
            
            const personalityPrompts = {
                conversacional: 'Seja amigável, use emojis com moderação e linguagem acessível.',
                formal: 'Use linguagem profissional e formal, mantenha tom corporativo.',
                tecnico: 'Seja preciso e técnico, foque em métricas e dados objetivos.'
            };

            return `Você é o Tryviano, um assistente de BI premium integrado ao sistema de tickets.

PERSONALIDADE: ${personalityPrompts[this.aiConfig.systemPersonality]}

REGRAS:
1. Responda em português brasileiro
2. Baseie respostas nos dados REAIS fornecidos
3. Nunca invente dados
4. Formate números com separadores (1.234)
5. Destaque métricas importantes
6. Sugira próximas ações quando relevante

${context}`;
        },

        generateDataContext(tickets) {
            if (tickets.length === 0) return 'Nenhum dado carregado no momento.';
            
            // Usar o contexto do Chatbot original se disponível
            if (window.Chatbot && window.Chatbot.generateSystemContext) {
                return window.Chatbot.generateSystemContext();
            }

            // Contexto básico próprio
            const total = tickets.length;
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            const open = tickets.filter(t => t.status == 2).length;
            const urgent = tickets.filter(t => t.priority == 4 && t.status == 2).length;

            return `
DADOS REAIS DO SISTEMA:
- Total: ${total} tickets
- Resolvidos: ${resolved} (${((resolved/total)*100).toFixed(1)}%)
- Abertos: ${open}
- Urgentes abertos: ${urgent}
`;
        },

        formatResponse(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="background:#3f3f5a;padding:2px 6px;border-radius:4px;">$1</code>')
                .replace(/^• /gm, '• ')
                .replace(/^- /gm, '• ')
                .replace(/\n/g, '<br>');
        },

        processLocal(text) {
            // Usar processamento local do Chatbot original
            if (window.Chatbot && window.Chatbot.processQuestion) {
                return window.Chatbot.processQuestion(text);
            }

            const tickets = window.allTicketsCache || [];
            if (tickets.length === 0) {
                return `⚠️ Nenhum dado carregado.<br><br>
                    <span class="try-detail">Carregue os tickets primeiro para análises.</span>`;
            }

            // Resposta básica
            const total = tickets.length;
            const resolved = tickets.filter(t => [4, 5].includes(Number(t.status))).length;
            
            return `📊 <strong>Resumo Rápido</strong>
                <div class="try-metrics-grid">
                    <div class="try-metric-card">
                        <div class="try-metric-value">${total}</div>
                        <div class="try-metric-label">Total</div>
                    </div>
                    <div class="try-metric-card">
                        <div class="try-metric-value">${resolved}</div>
                        <div class="try-metric-label">Resolvidos</div>
                    </div>
                </div>
                <div class="try-detail">Para análises mais detalhadas, configure uma API key nas configurações.</div>`;
        },

        clearChat() {
            const container = document.getElementById('tryMessages');
            container.innerHTML = this.renderWelcome();
            this.messages = [];
            this.context.conversationHistory = [];
            this.context.lastIntent = null;
            this.context.lastEntity = null;
            localStorage.removeItem('tryviano_history');
        },

        loadHistory() {
            try {
                const saved = localStorage.getItem('tryviano_history');
                if (saved) {
                    const history = JSON.parse(saved);
                    if (history.length > 0) {
                        const welcome = document.querySelector('.try-welcome');
                        if (welcome) welcome.remove();
                        
                        history.slice(-10).forEach(msg => {
                            const container = document.getElementById('tryMessages');
                            const el = document.createElement('div');
                            el.className = `try-msg ${msg.type}`;
                            
                            if (msg.type === 'bot') {
                                el.innerHTML = `
                                    <div class="try-msg-header">
                                        <div class="try-msg-avatar">🤖</div>
                                        <span class="try-msg-name">Tryviano</span>
                                    </div>
                                    <div class="try-msg-content">${msg.content}</div>
                                `;
                            } else {
                                el.innerHTML = msg.content;
                            }
                            
                            container.appendChild(el);
                        });
                        
                        this.messages = history;
                    }
                }
            } catch (e) {
                console.error('Erro ao carregar histórico:', e);
            }
        },

        saveHistory() {
            try {
                const toSave = this.messages.slice(-30);
                localStorage.setItem('tryviano_history', JSON.stringify(toSave));
            } catch (e) {}
        },

        checkForAlerts() {
            const tickets = window.allTicketsCache || [];
            if (tickets.length === 0) return;

            const urgentOpen = tickets.filter(t => t.priority == 4 && t.status == 2).length;
            
            if (urgentOpen > 0) {
                this.notificationCount = urgentOpen;
                this.updateBadge();
            }
        },

        updateBadge() {
            const badge = document.querySelector('#tryvianoButton .try-badge');
            if (badge) {
                if (this.notificationCount > 0 && !this.isOpen) {
                    badge.textContent = this.notificationCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    };

    // Expor globalmente
    window.TryvianoPremium = TryvianoPremium;

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TryvianoPremium.init());
    } else {
        TryvianoPremium.init();
    }

})();
