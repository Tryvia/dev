/**
 * Loader das 300 Conquistas de Gamificação
 * Este arquivo combina todas as partes dos badges
 */

(function() {
    'use strict';

    // Aguardar todas as partes serem carregadas
    function waitForBadges() {
        return new Promise((resolve) => {
            const checkParts = () => {
                if (window.GAMIFICATION_BADGES && 
                    window.GAMIFICATION_BADGES_PART2 && 
                    window.GAMIFICATION_BADGES_PART3 && 
                    window.GAMIFICATION_BADGES_PART4) {
                    resolve();
                } else {
                    setTimeout(checkParts, 50);
                }
            };
            checkParts();
        });
    }

    // Combinar todos os badges
    async function loadAllBadges() {
        await waitForBadges();
        
        const allBadges = [
            ...window.GAMIFICATION_BADGES,
            ...window.GAMIFICATION_BADGES_PART2,
            ...window.GAMIFICATION_BADGES_PART3,
            ...window.GAMIFICATION_BADGES_PART4
        ];

        // Verificar unicidade dos IDs
        const ids = new Set();
        const uniqueBadges = allBadges.filter(badge => {
            if (ids.has(badge.id)) {
                console.warn(`Badge duplicado: ${badge.id}`);
                return false;
            }
            ids.add(badge.id);
            return true;
        });

        // Expor globalmente
        window.ALL_GAMIFICATION_BADGES = uniqueBadges;
        
        console.log(`✅ ${uniqueBadges.length} conquistas carregadas`);
        
        // Atualizar o módulo de gamificação se existir
        if (window.GamificationModule) {
            window.GamificationModule.badges = uniqueBadges;
            console.log('✅ Badges atualizados no GamificationModule');
        }

        // Disparar evento de badges carregados
        document.dispatchEvent(new CustomEvent('badgesLoaded', { 
            detail: { count: uniqueBadges.length } 
        }));

        return uniqueBadges;
    }

    // Categorias disponíveis
    window.BADGE_CATEGORIES = {
        volume: { name: 'Volume de Tickets', icon: '📊', color: '#3b82f6' },
        velocidade: { name: 'Velocidade', icon: '⚡', color: '#f59e0b' },
        sla: { name: 'SLA', icon: '🛡️', color: '#10b981' },
        resolucao: { name: 'Taxa de Resolução', icon: '✅', color: '#8b5cf6' },
        prioridade: { name: 'Prioridades', icon: '🔴', color: '#ef4444' },
        horario: { name: 'Horários Especiais', icon: '🌙', color: '#6366f1' },
        streak: { name: 'Consistência', icon: '🔥', color: '#f97316' },
        diversidade: { name: 'Diversidade', icon: '🌐', color: '#06b6d4' },
        especial: { name: 'Especiais', icon: '🏆', color: '#ec4899' }
    };

    // Função para obter badges por categoria
    window.getBadgesByCategory = function(category) {
        if (!window.ALL_GAMIFICATION_BADGES) return [];
        return window.ALL_GAMIFICATION_BADGES.filter(b => b.category === category);
    };

    // Função para obter estatísticas de badges
    window.getBadgeStats = function() {
        if (!window.ALL_GAMIFICATION_BADGES) return null;
        
        const stats = {};
        Object.keys(window.BADGE_CATEGORIES).forEach(cat => {
            stats[cat] = window.ALL_GAMIFICATION_BADGES.filter(b => b.category === cat).length;
        });
        stats.total = window.ALL_GAMIFICATION_BADGES.length;
        return stats;
    };

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllBadges);
    } else {
        loadAllBadges();
    }

})();
