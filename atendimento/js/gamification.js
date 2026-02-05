/**
 * Módulo de Gamificação
 * Rankings, badges, conquistas e níveis para engajamento
 */

(function() {
    'use strict';

    const Gamification = {
        // Configurações
        config: {
            levelThresholds: [0, 50, 150, 300, 500, 800, 1200, 1800, 2500, 5000],
            levelNames: ['Novato', 'Iniciante', 'Aprendiz', 'Competente', 'Proficiente', 'Especialista', 'Mestre', 'Grão-Mestre', 'Lenda', 'Imortal'],
            levelColors: ['#6b7280', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#fbbf24']
        },

        // Definição de conquistas
        badges: [
            // Volume
            { id: 'first_ticket', name: 'Primeiro Passo', desc: 'Resolveu o primeiro ticket', icon: '🎯', condition: (s) => s.resolved >= 1 },
            { id: 'ten_tickets', name: 'Esquentando', desc: 'Resolveu 10 tickets', icon: '🔥', condition: (s) => s.resolved >= 10 },
            { id: 'fifty_tickets', name: 'Produtivo', desc: 'Resolveu 50 tickets', icon: '⚡', condition: (s) => s.resolved >= 50 },
            { id: 'hundred_tickets', name: 'Centurião', desc: 'Resolveu 100 tickets', icon: '💯', condition: (s) => s.resolved >= 100 },
            { id: 'five_hundred', name: 'Veterano', desc: 'Resolveu 500 tickets', icon: '🏅', condition: (s) => s.resolved >= 500 },
            { id: 'thousand', name: 'Lendário', desc: 'Resolveu 1000 tickets', icon: '👑', condition: (s) => s.resolved >= 1000 },
            
            // Velocidade
            { id: 'speed_demon', name: 'Velocista', desc: 'Tempo médio de resolução < 4h', icon: '🚀', condition: (s) => s.avgTime > 0 && s.avgTime < 4 },
            { id: 'quick_responder', name: 'Resposta Rápida', desc: 'Tempo médio de 1ª resposta < 1h', icon: '⏱️', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 1 },
            
            // SLA
            { id: 'sla_keeper', name: 'Guardião do SLA', desc: 'SLA acima de 90%', icon: '🛡️', condition: (s) => s.slaPercent >= 90 },
            { id: 'sla_master', name: 'Mestre do SLA', desc: 'SLA acima de 98%', icon: '💎', condition: (s) => s.slaPercent >= 98 },
            { id: 'perfect_sla', name: 'SLA Perfeito', desc: '100% de conformidade SLA', icon: '🏆', condition: (s) => s.slaPercent === 100 && s.resolved >= 10 },
            
            // Taxa de Resolução
            { id: 'resolver', name: 'Resolutor', desc: 'Taxa de resolução > 80%', icon: '✅', condition: (s) => s.resolutionRate >= 80 },
            { id: 'closer', name: 'Fechador', desc: 'Taxa de resolução > 95%', icon: '🎖️', condition: (s) => s.resolutionRate >= 95 },
            
            // Especiais
            { id: 'urgent_handler', name: 'Bombeiro', desc: 'Resolveu 20+ tickets urgentes', icon: '🧯', condition: (s) => s.urgentResolved >= 20 },
            { id: 'weekend_warrior', name: 'Guerreiro de Fim de Semana', desc: 'Resolveu tickets no fim de semana', icon: '🦸', condition: (s) => s.weekendResolved >= 5 },
            { id: 'night_owl', name: 'Coruja Noturna', desc: 'Resolveu tickets após 22h', icon: '🦉', condition: (s) => s.nightResolved >= 10 },
            { id: 'early_bird', name: 'Madrugador', desc: 'Resolveu tickets antes das 7h', icon: '🐦', condition: (s) => s.earlyResolved >= 10 },
            
            // Consistência
            { id: 'streak_7', name: 'Sequência de 7', desc: '7 dias seguidos resolvendo tickets', icon: '🔥', condition: (s) => s.maxStreak >= 7 },
            { id: 'streak_30', name: 'Sequência de 30', desc: '30 dias seguidos resolvendo tickets', icon: '💪', condition: (s) => s.maxStreak >= 30 },
            
            // Diversidade
            { id: 'jack_of_all', name: 'Pau pra Toda Obra', desc: 'Resolveu tickets de 5+ tipos', icon: '🎪', condition: (s) => s.uniqueTypes >= 5 },
            { id: 'team_player', name: 'Jogador de Equipe', desc: 'Trabalhou com 3+ times', icon: '🤝', condition: (s) => s.uniqueTeams >= 3 }
        ],

        colors: {
            bg: '#1e1e2e',
            surface: '#2a2a3e',
            border: '#3f3f46',
            primary: '#3b82f6',
            text: '#e4e4e7',
            textMuted: '#a1a1aa',
            gold: '#fbbf24',
            silver: '#94a3b8',
            bronze: '#d97706'
        },

        init() {
            // Carregar badges externos se disponíveis
            this.loadExternalBadges();
            this.createGamificationPanel();
            this.addSidebarButton();
            console.log('🎮 Gamification inicializado');
        },

        loadExternalBadges() {
            // Se os badges externos já estão carregados, usar eles
            if (window.ALL_GAMIFICATION_BADGES && window.ALL_GAMIFICATION_BADGES.length > 0) {
                this.badges = window.ALL_GAMIFICATION_BADGES;
                console.log(`🏆 ${this.badges.length} conquistas carregadas`);
                return;
            }

            // Aguardar evento de badges carregados
            document.addEventListener('badgesLoaded', (e) => {
                if (window.ALL_GAMIFICATION_BADGES && window.ALL_GAMIFICATION_BADGES.length > 0) {
                    this.badges = window.ALL_GAMIFICATION_BADGES;
                    console.log(`🏆 ${this.badges.length} conquistas carregadas via evento`);
                }
            });
        },

        addSidebarButton() {
            const sidebarContent = document.querySelector('.sidebar-content');
            if (!sidebarContent) return;

            // Verificar se já existe
            if (document.querySelector('[onclick="Gamification.open()"]')) return;

            const item = document.createElement('div');
            item.className = 'sidebar-item';
            item.setAttribute('onclick', 'Gamification.open()');
            item.innerHTML = `
                <span class="sidebar-item-icon">🎮</span>
                <span>Gamificação</span>
            `;

            // Adicionar antes do último item ou no final
            const sections = sidebarContent.querySelectorAll('.sidebar-section');
            if (sections.length > 0) {
                const lastSection = sections[sections.length - 1];
                lastSection.appendChild(item);
            }
        },

        createGamificationPanel() {
            const panel = document.createElement('div');
            panel.id = 'gamificationPanel';
            panel.innerHTML = `
                <div class="gf-overlay" onclick="Gamification.close()"></div>
                <div class="gf-container">
                    <div class="gf-header">
                        <h2>🎮 Gamificação</h2>
                        <button class="gf-close" onclick="Gamification.close()">✕</button>
                    </div>
                    <div class="gf-tabs">
                        <button class="gf-tab active" onclick="Gamification.showTab('ranking')">🏆 Ranking</button>
                        <button class="gf-tab" onclick="Gamification.showTab('badges')">🎖️ Conquistas</button>
                        <button class="gf-tab" onclick="Gamification.showTab('levels')">📊 Níveis</button>
                    </div>
                    <div class="gf-body" id="gfBody">
                        <!-- Conteúdo dinâmico -->
                    </div>
                </div>
            `;

            const style = document.createElement('style');
            style.textContent = `
                #gamificationPanel {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 100000;
                }
                #gamificationPanel.active {
                    display: block;
                }
                .gf-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                }
                .gf-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 95%;
                    max-width: 900px;
                    max-height: 90vh;
                    background: ${this.colors.bg};
                    border: 1px solid ${this.colors.border};
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: gfSlideIn 0.3s ease-out;
                }
                @keyframes gfSlideIn {
                    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .gf-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid ${this.colors.border};
                    background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%);
                }
                .gf-header h2 {
                    margin: 0;
                    color: ${this.colors.text};
                    font-size: 1.5rem;
                }
                .gf-close {
                    background: transparent;
                    border: none;
                    color: ${this.colors.textMuted};
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 8px;
                    transition: all 0.15s;
                }
                .gf-close:hover {
                    background: ${this.colors.surface};
                    color: ${this.colors.text};
                }
                .gf-tabs {
                    display: flex;
                    gap: 0.5rem;
                    padding: 1rem 2rem;
                    border-bottom: 1px solid ${this.colors.border};
                }
                .gf-tab {
                    background: transparent;
                    border: 1px solid ${this.colors.border};
                    color: ${this.colors.textMuted};
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.15s;
                }
                .gf-tab:hover {
                    background: ${this.colors.surface};
                    color: ${this.colors.text};
                }
                .gf-tab.active {
                    background: ${this.colors.primary};
                    border-color: ${this.colors.primary};
                    color: white;
                }
                .gf-body {
                    flex: 1;
                    overflow-y: auto;
                    padding: 2rem;
                }
                
                /* Ranking */
                .gf-ranking-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    border-radius: 12px;
                    margin-bottom: 0.75rem;
                    background: ${this.colors.surface};
                    transition: all 0.2s;
                }
                .gf-ranking-item:hover {
                    transform: translateX(5px);
                }
                .gf-ranking-item.gold {
                    background: linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.1) 100%);
                    border: 1px solid rgba(251,191,36,0.3);
                }
                .gf-ranking-item.silver {
                    background: linear-gradient(135deg, rgba(148,163,184,0.2) 0%, rgba(100,116,139,0.1) 100%);
                    border: 1px solid rgba(148,163,184,0.3);
                }
                .gf-ranking-item.bronze {
                    background: linear-gradient(135deg, rgba(217,119,6,0.2) 0%, rgba(180,83,9,0.1) 100%);
                    border: 1px solid rgba(217,119,6,0.3);
                }
                .gf-rank {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    font-weight: 700;
                    border-radius: 10px;
                    background: ${this.colors.border};
                }
                .gf-rank.gold { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1e1e2e; }
                .gf-rank.silver { background: linear-gradient(135deg, #94a3b8, #64748b); color: #1e1e2e; }
                .gf-rank.bronze { background: linear-gradient(135deg, #d97706, #b45309); color: #1e1e2e; }
                .gf-user-info {
                    flex: 1;
                }
                .gf-user-name {
                    font-weight: 600;
                    color: ${this.colors.text};
                    font-size: 1rem;
                }
                .gf-user-stats {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.25rem;
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                }
                .gf-user-level {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .gf-level-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .gf-score {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: ${this.colors.primary};
                }
                
                /* Badges */
                .gf-badges-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 1rem;
                }
                .gf-badge {
                    background: ${this.colors.surface};
                    border: 1px solid ${this.colors.border};
                    border-radius: 12px;
                    padding: 1.25rem;
                    text-align: center;
                    transition: all 0.2s;
                }
                .gf-badge:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }
                .gf-badge.locked {
                    opacity: 0.4;
                    filter: grayscale(1);
                }
                .gf-badge.unlocked {
                    border-color: ${this.colors.gold};
                    background: linear-gradient(135deg, rgba(251,191,36,0.1) 0%, transparent 100%);
                }
                .gf-badge-icon {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                }
                .gf-badge-name {
                    font-weight: 600;
                    color: ${this.colors.text};
                    margin-bottom: 0.25rem;
                }
                .gf-badge-desc {
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                }
                
                /* Levels */
                .gf-levels-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .gf-level-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: ${this.colors.surface};
                    border-radius: 12px;
                }
                .gf-level-item.current {
                    border: 2px solid ${this.colors.primary};
                    background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, transparent 100%);
                }
                .gf-level-icon {
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    font-size: 1.5rem;
                }
                .gf-level-info {
                    flex: 1;
                }
                .gf-level-name {
                    font-weight: 600;
                    color: ${this.colors.text};
                }
                .gf-level-range {
                    font-size: 0.8rem;
                    color: ${this.colors.textMuted};
                }
                .gf-progress-bar {
                    height: 8px;
                    background: ${this.colors.border};
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }
                .gf-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, ${this.colors.primary}, #8b5cf6);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
            `;

            document.head.appendChild(style);
            document.body.appendChild(panel);
        },

        open() {
            document.getElementById('gamificationPanel').classList.add('active');
            this.showTab('ranking');
        },

        close() {
            document.getElementById('gamificationPanel').classList.remove('active');
        },

        showTab(tab) {
            // Atualizar tabs
            document.querySelectorAll('.gf-tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.gf-tab[onclick*="${tab}"]`).classList.add('active');

            const body = document.getElementById('gfBody');
            
            switch(tab) {
                case 'ranking':
                    body.innerHTML = this.renderRanking();
                    break;
                case 'badges':
                    body.innerHTML = this.renderBadges();
                    break;
                case 'levels':
                    body.innerHTML = this.renderLevels();
                    break;
            }
        },

        // Calcular estatísticas de uma pessoa
        calculateStats(personName, tickets) {
            const personTickets = tickets.filter(t => 
                (t.cf_tratativa || '').toLowerCase().includes(personName.toLowerCase())
            );

            const resolved = personTickets.filter(t => [4,5].includes(Number(t.status)));
            const total = personTickets.length;

            // Calcular tempos
            let avgTime = 0;
            let avgFirstResponse = 0;
            const times = resolved.filter(t => t.stats_resolved_at && t.created_at)
                .map(t => (new Date(t.stats_resolved_at) - new Date(t.created_at)) / (1000*60*60));
            if (times.length) avgTime = times.reduce((a,b) => a+b, 0) / times.length;

            const firstResponses = personTickets.filter(t => t.stats_first_responded_at && t.created_at)
                .map(t => (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000*60*60));
            if (firstResponses.length) avgFirstResponse = firstResponses.reduce((a,b) => a+b, 0) / firstResponses.length;

            // SLA
            const withSLA = personTickets.filter(t => t.stats_first_responded_at && t.created_at);
            const withinSLA = withSLA.filter(t => {
                const responseTime = (new Date(t.stats_first_responded_at) - new Date(t.created_at)) / (1000*60*60);
                return responseTime <= 4;
            });
            const slaPercent = withSLA.length > 0 ? (withinSLA.length / withSLA.length) * 100 : 0;

            // Especiais
            const urgentResolved = resolved.filter(t => t.priority == 4).length;
            
            const weekendResolved = resolved.filter(t => {
                if (!t.stats_resolved_at) return false;
                const day = new Date(t.stats_resolved_at).getDay();
                return day === 0 || day === 6;
            }).length;

            const nightResolved = resolved.filter(t => {
                if (!t.stats_resolved_at) return false;
                const hour = new Date(t.stats_resolved_at).getHours();
                return hour >= 22 || hour < 6;
            }).length;

            const earlyResolved = resolved.filter(t => {
                if (!t.stats_resolved_at) return false;
                const hour = new Date(t.stats_resolved_at).getHours();
                return hour < 7;
            }).length;

            // Streak (dias consecutivos)
            const resolvedDates = [...new Set(resolved
                .filter(t => t.stats_resolved_at)
                .map(t => new Date(t.stats_resolved_at).toISOString().slice(0,10))
            )].sort();
            
            let maxStreak = 0, currentStreak = 1;
            for (let i = 1; i < resolvedDates.length; i++) {
                const diff = (new Date(resolvedDates[i]) - new Date(resolvedDates[i-1])) / (1000*60*60*24);
                if (diff === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);

            // Diversidade
            const uniqueTypes = new Set(personTickets.map(t => t.type).filter(Boolean)).size;
            const uniqueTeams = new Set(personTickets.map(t => t.cf_grupo_tratativa).filter(Boolean)).size;

            return {
                total,
                resolved: resolved.length,
                resolutionRate: total > 0 ? (resolved.length / total) * 100 : 0,
                avgTime,
                avgFirstResponse,
                slaPercent,
                urgentResolved,
                weekendResolved,
                nightResolved,
                earlyResolved,
                maxStreak,
                uniqueTypes,
                uniqueTeams
            };
        },

        // Calcular nível baseado em tickets resolvidos
        getLevel(resolved) {
            let level = 0;
            for (let i = 0; i < this.config.levelThresholds.length; i++) {
                if (resolved >= this.config.levelThresholds[i]) {
                    level = i;
                }
            }
            return {
                level,
                name: this.config.levelNames[level],
                color: this.config.levelColors[level],
                current: resolved,
                next: this.config.levelThresholds[level + 1] || null,
                previous: this.config.levelThresholds[level]
            };
        },

        // Calcular pontuação
        calculateScore(stats) {
            let score = stats.resolved * 10;  // 10 pontos por ticket resolvido
            score += (stats.slaPercent / 100) * stats.resolved * 5;  // Bonus por SLA
            score += stats.urgentResolved * 5;  // Bonus por urgentes
            score += stats.maxStreak * 2;  // Bonus por streak
            return Math.round(score);
        },

        renderRanking() {
            const tickets = window.allTicketsCache || window.ticketsData || [];
            
            if (tickets.length === 0) {
                return '<div style="text-align:center;padding:3rem;color:#a1a1aa;">Carregue os tickets primeiro</div>';
            }

            // Extrair pessoas únicas
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const name = p.trim();
                        if (name) people.add(name);
                    });
                }
            });

            // Calcular stats e ordenar
            const rankings = [...people].map(name => {
                const stats = this.calculateStats(name, tickets);
                const level = this.getLevel(stats.resolved);
                const score = this.calculateScore(stats);
                return { name, stats, level, score };
            }).sort((a, b) => b.score - a.score);

            return `
                <div class="gf-ranking-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;color:${this.colors.text};">🏆 Top Performers</h3>
                    <span style="color:${this.colors.textMuted};font-size:0.85rem;">${rankings.length} pessoas</span>
                </div>
                ${rankings.slice(0, 20).map((r, i) => {
                    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
                    const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
                    
                    return `
                        <div class="gf-ranking-item ${rankClass}">
                            <div class="gf-rank ${rankClass}">${rankIcon}</div>
                            <div class="gf-user-info">
                                <div class="gf-user-name">${this.escapeHtml(r.name)}</div>
                                <div class="gf-user-stats">
                                    <span>📋 ${r.stats.resolved} resolvidos</span>
                                    <span>✅ ${r.stats.resolutionRate.toFixed(0)}% taxa</span>
                                    <span>⏱️ ${r.stats.avgTime.toFixed(1)}h média</span>
                                </div>
                            </div>
                            <div class="gf-user-level">
                                <span class="gf-level-badge" style="background:${r.level.color}20;color:${r.level.color};">
                                    ${r.level.name}
                                </span>
                            </div>
                            <div class="gf-score">${r.score}</div>
                        </div>
                    `;
                }).join('')}
            `;
        },

        renderBadges() {
            const tickets = window.allTicketsCache || window.ticketsData || [];
            
            // Pegar primeiro usuário com mais tickets como exemplo
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const name = p.trim();
                        if (name) people.add(name);
                    });
                }
            });

            // Usar todas as pessoas para mostrar badges globais
            const allStats = [...people].map(name => this.calculateStats(name, tickets));
            
            // Consolidar stats
            const globalStats = {
                resolved: Math.max(...allStats.map(s => s.resolved), 0),
                avgTime: Math.min(...allStats.filter(s => s.avgTime > 0).map(s => s.avgTime), Infinity),
                avgFirstResponse: Math.min(...allStats.filter(s => s.avgFirstResponse > 0).map(s => s.avgFirstResponse), Infinity),
                slaPercent: Math.max(...allStats.map(s => s.slaPercent), 0),
                resolutionRate: Math.max(...allStats.map(s => s.resolutionRate), 0),
                urgentResolved: Math.max(...allStats.map(s => s.urgentResolved), 0),
                weekendResolved: Math.max(...allStats.map(s => s.weekendResolved), 0),
                nightResolved: Math.max(...allStats.map(s => s.nightResolved), 0),
                earlyResolved: Math.max(...allStats.map(s => s.earlyResolved), 0),
                maxStreak: Math.max(...allStats.map(s => s.maxStreak), 0),
                uniqueTypes: Math.max(...allStats.map(s => s.uniqueTypes), 0),
                uniqueTeams: Math.max(...allStats.map(s => s.uniqueTeams), 0)
            };

            const unlockedCount = this.badges.filter(b => b.condition(globalStats)).length;

            return `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
                    <h3 style="margin:0;color:${this.colors.text};">🎖️ Conquistas Disponíveis</h3>
                    <span style="color:${this.colors.textMuted};font-size:0.85rem;">${unlockedCount}/${this.badges.length} desbloqueadas</span>
                </div>
                <div class="gf-badges-grid">
                    ${this.badges.map(badge => {
                        const unlocked = badge.condition(globalStats);
                        return `
                            <div class="gf-badge ${unlocked ? 'unlocked' : 'locked'}">
                                <div class="gf-badge-icon">${badge.icon}</div>
                                <div class="gf-badge-name">${badge.name}</div>
                                <div class="gf-badge-desc">${badge.desc}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        renderLevels() {
            const tickets = window.allTicketsCache || window.ticketsData || [];
            
            // Calcular máximo de tickets resolvidos para referência
            const people = new Set();
            tickets.forEach(t => {
                if (t.cf_tratativa) {
                    t.cf_tratativa.split(/[,;\/]/).forEach(p => {
                        const name = p.trim();
                        if (name) people.add(name);
                    });
                }
            });

            const maxResolved = Math.max(...[...people].map(name => 
                this.calculateStats(name, tickets).resolved
            ), 0);

            const currentLevel = this.getLevel(maxResolved);

            return `
                <div style="text-align:center;margin-bottom:2rem;padding:1.5rem;background:${this.colors.surface};border-radius:16px;">
                    <div style="font-size:3rem;margin-bottom:0.5rem;">🏅</div>
                    <div style="font-size:1.25rem;font-weight:600;color:${this.colors.text};">Maior nível alcançado</div>
                    <div style="font-size:2rem;font-weight:700;color:${currentLevel.color};margin:0.5rem 0;">
                        ${currentLevel.name}
                    </div>
                    <div style="color:${this.colors.textMuted};">${maxResolved} tickets resolvidos</div>
                    ${currentLevel.next ? `
                        <div class="gf-progress-bar" style="margin-top:1rem;max-width:300px;margin-left:auto;margin-right:auto;">
                            <div class="gf-progress-fill" style="width:${((maxResolved - currentLevel.previous) / (currentLevel.next - currentLevel.previous)) * 100}%;"></div>
                        </div>
                        <div style="color:${this.colors.textMuted};font-size:0.8rem;margin-top:0.5rem;">
                            ${currentLevel.next - maxResolved} tickets para o próximo nível
                        </div>
                    ` : ''}
                </div>
                
                <h3 style="margin:0 0 1rem 0;color:${this.colors.text};">📊 Todos os Níveis</h3>
                <div class="gf-levels-list">
                    ${this.config.levelNames.map((name, i) => {
                        const threshold = this.config.levelThresholds[i];
                        const nextThreshold = this.config.levelThresholds[i + 1];
                        const isCurrent = i === currentLevel.level;
                        const isUnlocked = maxResolved >= threshold;
                        
                        return `
                            <div class="gf-level-item ${isCurrent ? 'current' : ''}" style="${!isUnlocked ? 'opacity:0.4;' : ''}">
                                <div class="gf-level-icon" style="background:${this.config.levelColors[i]}20;color:${this.config.levelColors[i]};">
                                    ${i + 1}
                                </div>
                                <div class="gf-level-info">
                                    <div class="gf-level-name">${name}</div>
                                    <div class="gf-level-range">
                                        ${threshold}${nextThreshold ? ` - ${nextThreshold - 1}` : '+'} tickets
                                    </div>
                                </div>
                                ${isUnlocked ? '<span style="color:#10b981;font-size:1.25rem;">✓</span>' : '<span style="color:#6b7280;">🔒</span>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text || '';
            return div.innerHTML;
        }
    };

    // Expor globalmente
    window.Gamification = Gamification;

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => Gamification.init());
    } else {
        Gamification.init();
    }
})();
