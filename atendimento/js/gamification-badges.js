/**
 * Sistema de Gamificação - 300+ Conquistas Unificadas
 * Consolidado em 2026-02-12T14:05:43.984Z
 */

(function() {
    'use strict';

    // 1. Definição de Categorias
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

    // 2. Lista Completa de Badges
    const allBadges = [
// =====================================
    // CATEGORIA 1: VOLUME DE TICKETS (1-45)
    // =====================================
    { id: 'vol_1', name: 'Primeiro Passo', desc: 'Resolveu o primeiro ticket', icon: '🎯', category: 'volume', condition: (s) => s.resolved >= 1 },
    { id: 'vol_2', name: 'Iniciando', desc: 'Resolveu 5 tickets', icon: '🌱', category: 'volume', condition: (s) => s.resolved >= 5 },
    { id: 'vol_3', name: 'Esquentando', desc: 'Resolveu 10 tickets', icon: '🔥', category: 'volume', condition: (s) => s.resolved >= 10 },
    { id: 'vol_4', name: 'Em Ritmo', desc: 'Resolveu 15 tickets', icon: '🎵', category: 'volume', condition: (s) => s.resolved >= 15 },
    { id: 'vol_5', name: 'Aquecido', desc: 'Resolveu 20 tickets', icon: '🌡️', category: 'volume', condition: (s) => s.resolved >= 20 },
    { id: 'vol_6', name: 'Vinte e Cinco', desc: 'Resolveu 25 tickets', icon: '🎲', category: 'volume', condition: (s) => s.resolved >= 25 },
    { id: 'vol_7', name: 'Trinta', desc: 'Resolveu 30 tickets', icon: '📊', category: 'volume', condition: (s) => s.resolved >= 30 },
    { id: 'vol_8', name: 'Acelerando', desc: 'Resolveu 40 tickets', icon: '🏃', category: 'volume', condition: (s) => s.resolved >= 40 },
    { id: 'vol_9', name: 'Produtivo', desc: 'Resolveu 50 tickets', icon: '⚡', category: 'volume', condition: (s) => s.resolved >= 50 },
    { id: 'vol_10', name: 'Sessenta', desc: 'Resolveu 60 tickets', icon: '6️⃣', category: 'volume', condition: (s) => s.resolved >= 60 },
    { id: 'vol_11', name: 'Setenta', desc: 'Resolveu 70 tickets', icon: '7️⃣', category: 'volume', condition: (s) => s.resolved >= 70 },
    { id: 'vol_12', name: 'Oitenta', desc: 'Resolveu 80 tickets', icon: '8️⃣', category: 'volume', condition: (s) => s.resolved >= 80 },
    { id: 'vol_13', name: 'Noventa', desc: 'Resolveu 90 tickets', icon: '9️⃣', category: 'volume', condition: (s) => s.resolved >= 90 },
    { id: 'vol_14', name: 'Centurião', desc: 'Resolveu 100 tickets', icon: '💯', category: 'volume', condition: (s) => s.resolved >= 100 },
    { id: 'vol_15', name: 'Cento e Vinte', desc: 'Resolveu 120 tickets', icon: '🔢', category: 'volume', condition: (s) => s.resolved >= 120 },
    { id: 'vol_16', name: 'Cento e Cinquenta', desc: 'Resolveu 150 tickets', icon: '📈', category: 'volume', condition: (s) => s.resolved >= 150 },
    { id: 'vol_17', name: 'Duzentos', desc: 'Resolveu 200 tickets', icon: '🎖️', category: 'volume', condition: (s) => s.resolved >= 200 },
    { id: 'vol_18', name: 'Duzentos e Cinquenta', desc: 'Resolveu 250 tickets', icon: '🏵️', category: 'volume', condition: (s) => s.resolved >= 250 },
    { id: 'vol_19', name: 'Trezentos', desc: 'Resolveu 300 tickets', icon: '⭐', category: 'volume', condition: (s) => s.resolved >= 300 },
    { id: 'vol_20', name: 'Trezentos e Cinquenta', desc: 'Resolveu 350 tickets', icon: '🌟', category: 'volume', condition: (s) => s.resolved >= 350 },
    { id: 'vol_21', name: 'Quatrocentos', desc: 'Resolveu 400 tickets', icon: '💫', category: 'volume', condition: (s) => s.resolved >= 400 },
    { id: 'vol_22', name: 'Quatrocentos e Cinquenta', desc: 'Resolveu 450 tickets', icon: '✨', category: 'volume', condition: (s) => s.resolved >= 450 },
    { id: 'vol_23', name: 'Veterano', desc: 'Resolveu 500 tickets', icon: '🏅', category: 'volume', condition: (s) => s.resolved >= 500 },
    { id: 'vol_24', name: 'Seiscentos', desc: 'Resolveu 600 tickets', icon: '🏆', category: 'volume', condition: (s) => s.resolved >= 600 },
    { id: 'vol_25', name: 'Setecentos', desc: 'Resolveu 700 tickets', icon: '🎊', category: 'volume', condition: (s) => s.resolved >= 700 },
    { id: 'vol_26', name: 'Oitocentos', desc: 'Resolveu 800 tickets', icon: '🎁', category: 'volume', condition: (s) => s.resolved >= 800 },
    { id: 'vol_27', name: 'Novecentos', desc: 'Resolveu 900 tickets', icon: '🏰', category: 'volume', condition: (s) => s.resolved >= 900 },
    { id: 'vol_28', name: 'Lendário', desc: 'Resolveu 1000 tickets', icon: '👑', category: 'volume', condition: (s) => s.resolved >= 1000 },
    { id: 'vol_29', name: 'Mil e Duzentos', desc: 'Resolveu 1200 tickets', icon: '💎', category: 'volume', condition: (s) => s.resolved >= 1200 },
    { id: 'vol_30', name: 'Mil e Quinhentos', desc: 'Resolveu 1500 tickets', icon: '⚜️', category: 'volume', condition: (s) => s.resolved >= 1500 },
    { id: 'vol_31', name: 'Duas Mil', desc: 'Resolveu 2000 tickets', icon: '🌠', category: 'volume', condition: (s) => s.resolved >= 2000 },
    { id: 'vol_32', name: 'Três Mil', desc: 'Resolveu 3000 tickets', icon: '🚀', category: 'volume', condition: (s) => s.resolved >= 3000 },
    { id: 'vol_33', name: 'Cinco Mil', desc: 'Resolveu 5000 tickets', icon: '🌍', category: 'volume', condition: (s) => s.resolved >= 5000 },
    { id: 'vol_34', name: 'Dez Mil', desc: 'Resolveu 10000 tickets', icon: '🌎', category: 'volume', condition: (s) => s.resolved >= 10000 },
    { id: 'vol_35', name: 'Imortal', desc: 'Resolveu 15000 tickets', icon: '👼', category: 'volume', condition: (s) => s.resolved >= 15000 },

    // VELOCIDADE (36-70)
    { id: 'speed_1', name: 'Resposta Rápida', desc: 'Tempo médio 1ª resposta < 4h', icon: '⏱️', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 4 },
    { id: 'speed_2', name: 'Ágil', desc: 'Tempo médio 1ª resposta < 3h', icon: '🏃', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 3 },
    { id: 'speed_3', name: 'Veloz', desc: 'Tempo médio 1ª resposta < 2h', icon: '💨', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 2 },
    { id: 'speed_4', name: 'Relâmpago', desc: 'Tempo médio 1ª resposta < 1h', icon: '⚡', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 1 },
    { id: 'speed_5', name: 'Flash', desc: 'Tempo médio 1ª resposta < 30min', icon: '🔴', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 0.5 },
    { id: 'speed_6', name: 'Instantâneo', desc: 'Tempo médio 1ª resposta < 15min', icon: '💥', category: 'velocidade', condition: (s) => s.avgFirstResponse > 0 && s.avgFirstResponse < 0.25 },
    { id: 'speed_7', name: 'Resolução Dia', desc: 'Tempo médio resolução < 24h', icon: '🗓️', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 24 },
    { id: 'speed_8', name: 'Resolução Rápida', desc: 'Tempo médio resolução < 12h', icon: '⏰', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 12 },
    { id: 'speed_9', name: 'Resolução Veloz', desc: 'Tempo médio resolução < 8h', icon: '🚄', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 8 },
    { id: 'speed_10', name: 'Velocista', desc: 'Tempo médio resolução < 4h', icon: '🚀', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 4 },
    { id: 'speed_11', name: 'Supersônico', desc: 'Tempo médio resolução < 2h', icon: '✈️', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 2 },
    { id: 'speed_12', name: 'Hipersônico', desc: 'Tempo médio resolução < 1h', icon: '🛫', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 1 },
    { id: 'speed_13', name: 'Tempo Real', desc: 'Tempo médio resolução < 30min', icon: '⌚', category: 'velocidade', condition: (s) => s.avgTime > 0 && s.avgTime < 0.5 },
    { id: 'speed_14', name: 'Dia Produtivo', desc: '5+ tickets em um dia', icon: '📈', category: 'velocidade', condition: (s) => s.maxTicketsInDay >= 5 },
    { id: 'speed_15', name: 'Dia Excepcional', desc: '10+ tickets em um dia', icon: '🌟', category: 'velocidade', condition: (s) => s.maxTicketsInDay >= 10 },
    { id: 'speed_16', name: 'Dia Lendário', desc: '15+ tickets em um dia', icon: '👑', category: 'velocidade', condition: (s) => s.maxTicketsInDay >= 15 },
    { id: 'speed_17', name: 'Dia Impossível', desc: '20+ tickets em um dia', icon: '🦄', category: 'velocidade', condition: (s) => s.maxTicketsInDay >= 20 },
    { id: 'speed_18', name: 'Dia Mítico', desc: '30+ tickets em um dia', icon: '🐉', category: 'velocidade', condition: (s) => s.maxTicketsInDay >= 30 },
    { id: 'speed_19', name: 'Eficiência Bronze', desc: 'Média < 8h e 25+ tickets', icon: '🥉', category: 'velocidade', condition: (s) => s.avgTime < 8 && s.resolved >= 25 },
    { id: 'speed_20', name: 'Eficiência Prata', desc: 'Média < 4h e 50+ tickets', icon: '🥈', category: 'velocidade', condition: (s) => s.avgTime < 4 && s.resolved >= 50 },
    { id: 'speed_21', name: 'Eficiência Ouro', desc: 'Média < 2h e 100+ tickets', icon: '🥇', category: 'velocidade', condition: (s) => s.avgTime < 2 && s.resolved >= 100 },
    { id: 'speed_22', name: 'Semana Veloz', desc: 'Média < 4h na semana', icon: '📅', category: 'velocidade', condition: (s) => s.weeklyAvgTime < 4 },
    { id: 'speed_23', name: 'Mês Veloz', desc: 'Média < 4h no mês', icon: '📆', category: 'velocidade', condition: (s) => s.monthlyAvgTime < 4 },
    { id: 'speed_24', name: 'Sprint Master', desc: '10+ tickets em 4 horas', icon: '🏃‍♂️', category: 'velocidade', condition: (s) => s.sprintMaster >= 1 },
    { id: 'speed_25', name: 'Turbo', desc: 'Dobrou velocidade em 1 mês', icon: '🔥', category: 'velocidade', condition: (s) => s.speedDoubled },
    { id: 'speed_26', name: 'Aceleração Total', desc: 'Top 3 mais rápidos', icon: '🏆', category: 'velocidade', condition: (s) => s.speedRank <= 3 },
    { id: 'speed_27', name: 'Raio', desc: 'Resolveu ticket em < 5min', icon: '⚡', category: 'velocidade', condition: (s) => s.ultraFastResolution >= 1 },
    { id: 'speed_28', name: 'Mestre Raio', desc: '10+ tickets em < 5min', icon: '🌩️', category: 'velocidade', condition: (s) => s.ultraFastResolution >= 10 },
    { id: 'speed_29', name: 'Sem Parar', desc: '50+ tickets sem atraso', icon: '🎯', category: 'velocidade', condition: (s) => s.noDelayStreak >= 50 },
    { id: 'speed_30', name: 'Máquina', desc: '100+ tickets sem atraso', icon: '🤖', category: 'velocidade', condition: (s) => s.noDelayStreak >= 100 },
    { id: 'speed_31', name: 'Imparável', desc: '200+ tickets sem atraso', icon: '🚂', category: 'velocidade', condition: (s) => s.noDelayStreak >= 200 },
    { id: 'speed_32', name: 'Pontualidade Bronze', desc: '90%+ no prazo', icon: '🥉', category: 'velocidade', condition: (s) => s.onTimePercent >= 90 },
    { id: 'speed_33', name: 'Pontualidade Prata', desc: '95%+ no prazo', icon: '🥈', category: 'velocidade', condition: (s) => s.onTimePercent >= 95 },
    { id: 'speed_34', name: 'Pontualidade Ouro', desc: '99%+ no prazo', icon: '🥇', category: 'velocidade', condition: (s) => s.onTimePercent >= 99 },
    { id: 'speed_35', name: 'Pontualidade Perfeita', desc: '100% no prazo', icon: '💯', category: 'velocidade', condition: (s) => s.onTimePercent === 100 && s.resolved >= 50 },

    // Badges serão continuados em window.GAMIFICATION_BADGES_PART2,
// SLA (71-105)
    { id: 'sla_1', name: 'Consciente SLA', desc: 'SLA acima de 50%', icon: '📋', category: 'sla', condition: (s) => s.slaPercent >= 50 },
    { id: 'sla_2', name: 'Respeitando SLA', desc: 'SLA acima de 60%', icon: '📝', category: 'sla', condition: (s) => s.slaPercent >= 60 },
    { id: 'sla_3', name: 'Bom SLA', desc: 'SLA acima de 70%', icon: '📑', category: 'sla', condition: (s) => s.slaPercent >= 70 },
    { id: 'sla_4', name: 'Ótimo SLA', desc: 'SLA acima de 80%', icon: '📰', category: 'sla', condition: (s) => s.slaPercent >= 80 },
    { id: 'sla_5', name: 'Excelente SLA', desc: 'SLA acima de 85%', icon: '📃', category: 'sla', condition: (s) => s.slaPercent >= 85 },
    { id: 'sla_6', name: 'Guardião SLA', desc: 'SLA acima de 90%', icon: '🛡️', category: 'sla', condition: (s) => s.slaPercent >= 90 },
    { id: 'sla_7', name: 'Protetor SLA', desc: 'SLA acima de 93%', icon: '🔰', category: 'sla', condition: (s) => s.slaPercent >= 93 },
    { id: 'sla_8', name: 'Campeão SLA', desc: 'SLA acima de 95%', icon: '🏆', category: 'sla', condition: (s) => s.slaPercent >= 95 },
    { id: 'sla_9', name: 'Elite SLA', desc: 'SLA acima de 97%', icon: '💎', category: 'sla', condition: (s) => s.slaPercent >= 97 },
    { id: 'sla_10', name: 'Mestre SLA', desc: 'SLA acima de 98%', icon: '👑', category: 'sla', condition: (s) => s.slaPercent >= 98 },
    { id: 'sla_11', name: 'Lenda SLA', desc: 'SLA acima de 99%', icon: '🌟', category: 'sla', condition: (s) => s.slaPercent >= 99 },
    { id: 'sla_12', name: 'SLA Perfeito', desc: '100% SLA', icon: '💯', category: 'sla', condition: (s) => s.slaPercent === 100 && s.resolved >= 10 },
    { id: 'sla_13', name: 'Perfeição Volume', desc: '100% SLA com 50+ tickets', icon: '⭐', category: 'sla', condition: (s) => s.slaPercent === 100 && s.resolved >= 50 },
    { id: 'sla_14', name: 'Perfeição Total', desc: '100% SLA com 100+ tickets', icon: '✨', category: 'sla', condition: (s) => s.slaPercent === 100 && s.resolved >= 100 },
    { id: 'sla_15', name: 'Semana SLA 90+', desc: 'SLA 90%+ por 7 dias', icon: '📅', category: 'sla', condition: (s) => s.slaStreak7Days >= 90 },
    { id: 'sla_16', name: 'Mês SLA 90+', desc: 'SLA 90%+ por 30 dias', icon: '📆', category: 'sla', condition: (s) => s.slaStreak30Days >= 90 },
    { id: 'sla_17', name: 'Trimestre SLA 90+', desc: 'SLA 90%+ por 90 dias', icon: '🏛️', category: 'sla', condition: (s) => s.slaStreak90Days >= 90 },
    { id: 'sla_18', name: 'SLA Volume Baixo', desc: 'SLA 95%+ com 25+ tickets', icon: '🥉', category: 'sla', condition: (s) => s.slaPercent >= 95 && s.resolved >= 25 },
    { id: 'sla_19', name: 'SLA Volume Médio', desc: 'SLA 95%+ com 75+ tickets', icon: '🥈', category: 'sla', condition: (s) => s.slaPercent >= 95 && s.resolved >= 75 },
    { id: 'sla_20', name: 'SLA Volume Alto', desc: 'SLA 95%+ com 150+ tickets', icon: '🥇', category: 'sla', condition: (s) => s.slaPercent >= 95 && s.resolved >= 150 },
    { id: 'sla_21', name: 'Recuperador SLA', desc: 'Melhorou SLA em 10 pontos', icon: '📈', category: 'sla', condition: (s) => s.slaImprovement >= 10 },
    { id: 'sla_22', name: 'Grande Recuperação', desc: 'Melhorou SLA em 20 pontos', icon: '📊', category: 'sla', condition: (s) => s.slaImprovement >= 20 },
    { id: 'sla_23', name: 'Reviravolta', desc: 'Melhorou SLA em 30 pontos', icon: '🔄', category: 'sla', condition: (s) => s.slaImprovement >= 30 },
    { id: 'sla_24', name: 'Anti-Vermelho', desc: '30 dias sem SLA vermelho', icon: '🟢', category: 'sla', condition: (s) => s.noRedSLA30Days },
    { id: 'sla_25', name: 'Sempre Verde', desc: '60 dias sem SLA vermelho', icon: '💚', category: 'sla', condition: (s) => s.noRedSLA60Days },
    { id: 'sla_26', name: 'Eternamente Verde', desc: '90 dias sem SLA vermelho', icon: '🌲', category: 'sla', condition: (s) => s.noRedSLA90Days },
    { id: 'sla_27', name: 'SLA de Ferro', desc: 'Nunca abaixo de 80%', icon: '🔩', category: 'sla', condition: (s) => s.minSLA >= 80 && s.resolved >= 30 },
    { id: 'sla_28', name: 'SLA de Aço', desc: 'Nunca abaixo de 90%', icon: '⚙️', category: 'sla', condition: (s) => s.minSLA >= 90 && s.resolved >= 30 },
    { id: 'sla_29', name: 'SLA Adamantium', desc: 'Nunca abaixo de 95%', icon: '🛠️', category: 'sla', condition: (s) => s.minSLA >= 95 && s.resolved >= 30 },
    { id: 'sla_30', name: 'Top SLA', desc: 'Top 10% em SLA', icon: '🏅', category: 'sla', condition: (s) => s.slaRankPercentile <= 10 },
    { id: 'sla_31', name: 'SLA Líder', desc: 'Melhor SLA da equipe', icon: '🎖️', category: 'sla', condition: (s) => s.slaRank === 1 },
    { id: 'sla_32', name: 'SLA Consistente', desc: 'Variação < 5% no mês', icon: '📐', category: 'sla', condition: (s) => s.slaVariation < 5 },
    { id: 'sla_33', name: 'Resgatador', desc: 'Resgatou 5+ tickets', icon: '🆘', category: 'sla', condition: (s) => s.rescuedTickets >= 5 },
    { id: 'sla_34', name: 'Herói Resgate', desc: 'Resgatou 20+ tickets', icon: '🦸‍♂️', category: 'sla', condition: (s) => s.rescuedTickets >= 20 },
    { id: 'sla_35', name: 'Lenda Resgate', desc: 'Resgatou 50+ tickets', icon: '🏆', category: 'sla', condition: (s) => s.rescuedTickets >= 50 },

    // TAXA DE RESOLUÇÃO (106-140)
    { id: 'res_1', name: 'Começando', desc: 'Taxa resolução > 30%', icon: '🌱', category: 'resolucao', condition: (s) => s.resolutionRate >= 30 },
    { id: 'res_2', name: 'Evoluindo', desc: 'Taxa resolução > 40%', icon: '🌿', category: 'resolucao', condition: (s) => s.resolutionRate >= 40 },
    { id: 'res_3', name: 'Metade', desc: 'Taxa resolução > 50%', icon: '🌳', category: 'resolucao', condition: (s) => s.resolutionRate >= 50 },
    { id: 'res_4', name: 'Maioria', desc: 'Taxa resolução > 60%', icon: '🌴', category: 'resolucao', condition: (s) => s.resolutionRate >= 60 },
    { id: 'res_5', name: 'Bom Resolvedor', desc: 'Taxa resolução > 70%', icon: '🌲', category: 'resolucao', condition: (s) => s.resolutionRate >= 70 },
    { id: 'res_6', name: 'Resolutor', desc: 'Taxa resolução > 80%', icon: '✅', category: 'resolucao', condition: (s) => s.resolutionRate >= 80 },
    { id: 'res_7', name: 'Grande Resolutor', desc: 'Taxa resolução > 85%', icon: '☑️', category: 'resolucao', condition: (s) => s.resolutionRate >= 85 },
    { id: 'res_8', name: 'Excelente Resolutor', desc: 'Taxa resolução > 90%', icon: '✔️', category: 'resolucao', condition: (s) => s.resolutionRate >= 90 },
    { id: 'res_9', name: 'Fechador', desc: 'Taxa resolução > 95%', icon: '🎖️', category: 'resolucao', condition: (s) => s.resolutionRate >= 95 },
    { id: 'res_10', name: 'Fechador Perfeito', desc: 'Taxa resolução = 100%', icon: '💯', category: 'resolucao', condition: (s) => s.resolutionRate === 100 && s.resolved >= 10 },
    { id: 'res_11', name: 'Zero Pendências', desc: 'Nenhum ticket aberto', icon: '🧹', category: 'resolucao', condition: (s) => s.currentOpen === 0 && s.resolved >= 20 },
    { id: 'res_12', name: 'Limpador Backlog', desc: 'Reduziu backlog 50%', icon: '🗑️', category: 'resolucao', condition: (s) => s.backlogReduction >= 50 },
    { id: 'res_13', name: 'Exterminador Backlog', desc: 'Reduziu backlog 80%', icon: '🔥', category: 'resolucao', condition: (s) => s.backlogReduction >= 80 },
    { id: 'res_14', name: 'Backlog Zero', desc: 'Zerou o backlog', icon: '🎯', category: 'resolucao', condition: (s) => s.backlogReduction === 100 },
    { id: 'res_15', name: 'Finalizador Semana', desc: 'Todos tickets da semana', icon: '📅', category: 'resolucao', condition: (s) => s.weeklyCleanup >= 1 },
    { id: 'res_16', name: 'Finalizador Mensal', desc: 'Todos tickets do mês', icon: '📆', category: 'resolucao', condition: (s) => s.monthlyCleanup >= 1 },
    { id: 'res_17', name: 'Consistente 30d', desc: 'Taxa 80%+ por 30 dias', icon: '📊', category: 'resolucao', condition: (s) => s.consistentResolution30Days },
    { id: 'res_18', name: 'Consistente 60d', desc: 'Taxa 80%+ por 60 dias', icon: '📈', category: 'resolucao', condition: (s) => s.consistentResolution60Days },
    { id: 'res_19', name: 'Consistente 90d', desc: 'Taxa 80%+ por 90 dias', icon: '🏛️', category: 'resolucao', condition: (s) => s.consistentResolution90Days },
    { id: 'res_20', name: 'Sem Reabertura', desc: '0% tickets reabertos', icon: '🔒', category: 'resolucao', condition: (s) => s.reopenRate === 0 && s.resolved >= 20 },
    { id: 'res_21', name: 'Baixa Reabertura', desc: '< 5% tickets reabertos', icon: '🔐', category: 'resolucao', condition: (s) => s.reopenRate < 5 && s.resolved >= 20 },
    { id: 'res_22', name: 'Resolução Definitiva', desc: '< 2% tickets reabertos', icon: '🔏', category: 'resolucao', condition: (s) => s.reopenRate < 2 && s.resolved >= 50 },
    { id: 'res_23', name: 'Primeira Tentativa', desc: '90%+ na 1ª tentativa', icon: '1️⃣', category: 'resolucao', condition: (s) => s.firstTryResolution >= 90 },
    { id: 'res_24', name: 'Especialista Difíceis', desc: '20+ tickets difíceis', icon: '🔨', category: 'resolucao', condition: (s) => s.hardTicketsResolved >= 20 },
    { id: 'res_25', name: 'Mago Difíceis', desc: '50+ tickets difíceis', icon: '🧙', category: 'resolucao', condition: (s) => s.hardTicketsResolved >= 50 },
    { id: 'res_26', name: 'Ticket Antigo', desc: 'Resolveu ticket 30+ dias', icon: '📜', category: 'resolucao', condition: (s) => s.ancientTickets >= 1 },
    { id: 'res_27', name: 'Arqueólogo', desc: '5+ tickets de 30+ dias', icon: '🏺', category: 'resolucao', condition: (s) => s.ancientTickets >= 5 },
    { id: 'res_28', name: 'Indiana Jones', desc: '10+ tickets de 30+ dias', icon: '🎒', category: 'resolucao', condition: (s) => s.ancientTickets >= 10 },
    { id: 'res_29', name: 'Ticket Relíquia', desc: 'Resolveu ticket 60+ dias', icon: '🏛️', category: 'resolucao', condition: (s) => s.relicTickets >= 1 },
    { id: 'res_30', name: 'Caçador Relíquias', desc: '5+ tickets de 60+ dias', icon: '🗿', category: 'resolucao', condition: (s) => s.relicTickets >= 5 },
    { id: 'res_31', name: 'Fechamento Lote', desc: '10+ tickets mesmo dia', icon: '📦', category: 'resolucao', condition: (s) => s.batchClose >= 1 },
    { id: 'res_32', name: 'Mega Lote', desc: '20+ tickets mesmo dia', icon: '📫', category: 'resolucao', condition: (s) => s.megaBatchClose >= 1 },
    { id: 'res_33', name: 'Giga Lote', desc: '30+ tickets mesmo dia', icon: '📪', category: 'resolucao', condition: (s) => s.gigaBatchClose >= 1 },
    { id: 'res_34', name: 'Top Resolutor', desc: 'Top 3 em resoluções', icon: '🏆', category: 'resolucao', condition: (s) => s.resolutionRank <= 3 },
    { id: 'res_35', name: 'Líder Resoluções', desc: '#1 em resoluções', icon: '👑', category: 'resolucao', condition: (s) => s.resolutionRank === 1 },
// PRIORIDADES (141-175)
    { id: 'pri_1', name: 'Primeiro Urgente', desc: 'Resolveu 1º ticket urgente', icon: '🚨', category: 'prioridade', condition: (s) => s.urgentResolved >= 1 },
    { id: 'pri_2', name: 'Lidando Urgência', desc: '5 tickets urgentes', icon: '🔴', category: 'prioridade', condition: (s) => s.urgentResolved >= 5 },
    { id: 'pri_3', name: 'Especialista Urgente', desc: '10 tickets urgentes', icon: '🆘', category: 'prioridade', condition: (s) => s.urgentResolved >= 10 },
    { id: 'pri_4', name: 'Bombeiro', desc: '20 tickets urgentes', icon: '🧯', category: 'prioridade', condition: (s) => s.urgentResolved >= 20 },
    { id: 'pri_5', name: 'Chefe Bombeiros', desc: '50 tickets urgentes', icon: '🚒', category: 'prioridade', condition: (s) => s.urgentResolved >= 50 },
    { id: 'pri_6', name: 'Herói Urgentes', desc: '100 tickets urgentes', icon: '🦸‍♀️', category: 'prioridade', condition: (s) => s.urgentResolved >= 100 },
    { id: 'pri_7', name: 'Lenda Urgentes', desc: '200 tickets urgentes', icon: '🏆', category: 'prioridade', condition: (s) => s.urgentResolved >= 200 },
    { id: 'pri_8', name: 'Urgente Rápido', desc: 'Urgente em < 2h', icon: '⚡', category: 'prioridade', condition: (s) => s.fastUrgent >= 1 },
    { id: 'pri_9', name: 'Urgente Veloz', desc: '5+ urgentes < 2h', icon: '💨', category: 'prioridade', condition: (s) => s.fastUrgent >= 5 },
    { id: 'pri_10', name: 'Urgente Relâmpago', desc: '20+ urgentes < 2h', icon: '⛈️', category: 'prioridade', condition: (s) => s.fastUrgent >= 20 },
    { id: 'pri_11', name: 'Alta Prioridade', desc: '10 tickets alta', icon: '🔶', category: 'prioridade', condition: (s) => s.highResolved >= 10 },
    { id: 'pri_12', name: 'Mestre Alta', desc: '50 tickets alta', icon: '🟠', category: 'prioridade', condition: (s) => s.highResolved >= 50 },
    { id: 'pri_13', name: 'Elite Alta', desc: '100 tickets alta', icon: '🟧', category: 'prioridade', condition: (s) => s.highResolved >= 100 },
    { id: 'pri_14', name: 'Média Prioridade', desc: '20 tickets média', icon: '🟡', category: 'prioridade', condition: (s) => s.mediumResolved >= 20 },
    { id: 'pri_15', name: 'Mestre Média', desc: '100 tickets média', icon: '🟨', category: 'prioridade', condition: (s) => s.mediumResolved >= 100 },
    { id: 'pri_16', name: 'Baixa Prioridade', desc: '20 tickets baixa', icon: '🟢', category: 'prioridade', condition: (s) => s.lowResolved >= 20 },
    { id: 'pri_17', name: 'Mestre Baixa', desc: '100 tickets baixa', icon: '🟩', category: 'prioridade', condition: (s) => s.lowResolved >= 100 },
    { id: 'pri_18', name: 'Balanceado', desc: 'Todas as prioridades', icon: '⚖️', category: 'prioridade', condition: (s) => s.urgentResolved >= 5 && s.highResolved >= 10 && s.mediumResolved >= 10 && s.lowResolved >= 10 },
    { id: 'pri_19', name: 'Zero Urgentes', desc: 'Sem urgentes pendentes', icon: '✨', category: 'prioridade', condition: (s) => s.noUrgentPending && s.urgentResolved >= 10 },
    { id: 'pri_20', name: 'Defensor Crítico', desc: 'Nunca urgente > 4h', icon: '🛡️', category: 'prioridade', condition: (s) => s.noUrgentOverdue && s.urgentResolved >= 20 },
    { id: 'pri_21', name: 'Cascata Urgente', desc: '3+ urgentes seguidos', icon: '🌊', category: 'prioridade', condition: (s) => s.urgentStreak >= 3 },
    { id: 'pri_22', name: 'Tsunami Urgente', desc: '5+ urgentes seguidos', icon: '🌀', category: 'prioridade', condition: (s) => s.urgentStreak >= 5 },
    { id: 'pri_23', name: 'Dia Urgências', desc: '5+ urgentes num dia', icon: '🔥', category: 'prioridade', condition: (s) => s.urgentInDay >= 5 },
    { id: 'pri_24', name: 'Semana Urgências', desc: '20+ urgentes semana', icon: '📅', category: 'prioridade', condition: (s) => s.urgentInWeek >= 20 },
    { id: 'pri_25', name: 'SLA Urgente 100%', desc: '100% SLA urgentes', icon: '💯', category: 'prioridade', condition: (s) => s.urgentSLA === 100 && s.urgentResolved >= 10 },
    { id: 'pri_26', name: 'VIP Handler', desc: '10+ tickets VIP', icon: '👔', category: 'prioridade', condition: (s) => s.vipResolved >= 10 },
    { id: 'pri_27', name: 'Concierge VIP', desc: '50+ tickets VIP', icon: '🎩', category: 'prioridade', condition: (s) => s.vipResolved >= 50 },
    { id: 'pri_28', name: 'Especialista VIP', desc: '100+ tickets VIP', icon: '👑', category: 'prioridade', condition: (s) => s.vipResolved >= 100 },
    { id: 'pri_29', name: 'Crítico Resolvido', desc: 'Incidente crítico', icon: '🚫', category: 'prioridade', condition: (s) => s.criticalResolved >= 1 },
    { id: 'pri_30', name: 'Mestre Crises', desc: '10+ críticos', icon: '🆘', category: 'prioridade', condition: (s) => s.criticalResolved >= 10 },
    { id: 'pri_31', name: 'Herói Crises', desc: '25+ críticos', icon: '🦸', category: 'prioridade', condition: (s) => s.criticalResolved >= 25 },
    { id: 'pri_32', name: 'Escalação Evitada', desc: 'Evitou 10 escalações', icon: '📉', category: 'prioridade', condition: (s) => s.escalationAvoided >= 10 },
    { id: 'pri_33', name: 'Anti-Escalação', desc: 'Evitou 50 escalações', icon: '🔽', category: 'prioridade', condition: (s) => s.escalationAvoided >= 50 },
    { id: 'pri_34', name: 'Baixa Escalação', desc: 'Taxa escalação < 5%', icon: '📊', category: 'prioridade', condition: (s) => s.escalationRate < 5 && s.resolved >= 50 },
    { id: 'pri_35', name: 'Zero Escalação', desc: 'Taxa escalação 0%', icon: '🎯', category: 'prioridade', condition: (s) => s.escalationRate === 0 && s.resolved >= 50 },

    // HORÁRIOS ESPECIAIS (176-210)
    { id: 'time_1', name: 'Coruja Noturna', desc: 'Ticket após 22h', icon: '🦉', category: 'horario', condition: (s) => s.nightResolved >= 1 },
    { id: 'time_2', name: 'Habitante Noite', desc: '10 tickets após 22h', icon: '🌙', category: 'horario', condition: (s) => s.nightResolved >= 10 },
    { id: 'time_3', name: 'Criatura Noite', desc: '25 tickets após 22h', icon: '🌑', category: 'horario', condition: (s) => s.nightResolved >= 25 },
    { id: 'time_4', name: 'Senhor Noite', desc: '50 tickets após 22h', icon: '🦇', category: 'horario', condition: (s) => s.nightResolved >= 50 },
    { id: 'time_5', name: 'Rei Noite', desc: '100 tickets após 22h', icon: '👑', category: 'horario', condition: (s) => s.nightResolved >= 100 },
    { id: 'time_6', name: 'Madrugador', desc: 'Ticket antes 7h', icon: '🐦', category: 'horario', condition: (s) => s.earlyResolved >= 1 },
    { id: 'time_7', name: 'Amanhecer Dourado', desc: '10 tickets antes 7h', icon: '🌅', category: 'horario', condition: (s) => s.earlyResolved >= 10 },
    { id: 'time_8', name: 'Príncipe Aurora', desc: '25 tickets antes 7h', icon: '🌄', category: 'horario', condition: (s) => s.earlyResolved >= 25 },
    { id: 'time_9', name: 'Rei Aurora', desc: '50 tickets antes 7h', icon: '☀️', category: 'horario', condition: (s) => s.earlyResolved >= 50 },
    { id: 'time_10', name: 'Guerreiro Weekend', desc: 'Ticket fim semana', icon: '🦸', category: 'horario', condition: (s) => s.weekendResolved >= 1 },
    { id: 'time_11', name: 'Dedicado Weekend', desc: '10 tickets fds', icon: '📅', category: 'horario', condition: (s) => s.weekendResolved >= 10 },
    { id: 'time_12', name: 'Herói Weekend', desc: '25 tickets fds', icon: '🦹', category: 'horario', condition: (s) => s.weekendResolved >= 25 },
    { id: 'time_13', name: 'Lenda Weekend', desc: '50 tickets fds', icon: '🏆', category: 'horario', condition: (s) => s.weekendResolved >= 50 },
    { id: 'time_14', name: 'Mito Weekend', desc: '100 tickets fds', icon: '👑', category: 'horario', condition: (s) => s.weekendResolved >= 100 },
    { id: 'time_15', name: 'Segunda Produtiva', desc: '10+ numa segunda', icon: '🗓️', category: 'horario', condition: (s) => s.mondayResolved >= 10 },
    { id: 'time_16', name: 'Sexta Limpa', desc: 'Zerou fila sexta', icon: '🎉', category: 'horario', condition: (s) => s.fridayCleanup },
    { id: 'time_17', name: 'Hora Almoço', desc: 'Ticket no almoço', icon: '🍽️', category: 'horario', condition: (s) => s.lunchResolved >= 1 },
    { id: 'time_18', name: 'Almoço Produtivo', desc: '20+ tickets almoço', icon: '🥗', category: 'horario', condition: (s) => s.lunchResolved >= 20 },
    { id: 'time_19', name: 'Feriado Trabalhado', desc: 'Ticket em feriado', icon: '🎊', category: 'horario', condition: (s) => s.holidayResolved >= 1 },
    { id: 'time_20', name: 'Herói Feriado', desc: '10+ em feriados', icon: '🎄', category: 'horario', condition: (s) => s.holidayResolved >= 10 },
    { id: 'time_21', name: 'Virada Ano', desc: 'Ticket na virada', icon: '🎆', category: 'horario', condition: (s) => s.newYearResolved >= 1 },
    { id: 'time_22', name: 'Natal Trabalhado', desc: 'Ticket no Natal', icon: '🎅', category: 'horario', condition: (s) => s.christmasResolved >= 1 },
    { id: 'time_23', name: 'Horário Pico', desc: '5+ entre 9-11h', icon: '⏰', category: 'horario', condition: (s) => s.peakHourResolved >= 5 },
    { id: 'time_24', name: 'Mestre Pico', desc: '50+ entre 9-11h', icon: '📈', category: 'horario', condition: (s) => s.peakHourResolved >= 50 },
    { id: 'time_25', name: 'Final Dia', desc: '5+ entre 17-19h', icon: '🌆', category: 'horario', condition: (s) => s.endDayResolved >= 5 },
    { id: 'time_26', name: 'Mestre Final Dia', desc: '50+ entre 17-19h', icon: '🌇', category: 'horario', condition: (s) => s.endDayResolved >= 50 },
    { id: 'time_27', name: 'Madrugada', desc: 'Ticket 0-5h', icon: '🌃', category: 'horario', condition: (s) => s.midnightResolved >= 1 },
    { id: 'time_28', name: 'Vigilante Noturno', desc: '10+ tickets 0-5h', icon: '🔦', category: 'horario', condition: (s) => s.midnightResolved >= 10 },
    { id: 'time_29', name: 'Insone', desc: '25+ tickets 0-5h', icon: '😵', category: 'horario', condition: (s) => s.midnightResolved >= 25 },
    { id: 'time_30', name: 'Vampiro', desc: '50+ tickets 0-5h', icon: '🧛', category: 'horario', condition: (s) => s.midnightResolved >= 50 },
    { id: 'time_31', name: 'Todos Dias Semana', desc: 'Tickets 7 dias', icon: '📆', category: 'horario', condition: (s) => s.allDaysWeek },
    { id: 'time_32', name: '24 Horas', desc: 'Tickets 24h seguidas', icon: '🕐', category: 'horario', condition: (s) => s.fullDayActive },
    { id: 'time_33', name: 'Cedo e Tarde', desc: 'Antes 7h e após 22h', icon: '🌓', category: 'horario', condition: (s) => s.earlyResolved >= 5 && s.nightResolved >= 5 },
    { id: 'time_34', name: 'Horário Flexível', desc: '6+ horários diferentes', icon: '⌛', category: 'horario', condition: (s) => s.uniqueHours >= 6 },
    { id: 'time_35', name: 'Onipresente', desc: 'Tickets em todas horas', icon: '♾️', category: 'horario', condition: (s) => s.uniqueHours >= 12 },
// CONSISTÊNCIA/STREAKS (211-245)
    { id: 'str_1', name: 'Streak Iniciante', desc: '3 dias seguidos', icon: '🔥', category: 'streak', condition: (s) => s.maxStreak >= 3 },
    { id: 'str_2', name: 'Streak Bronze', desc: '5 dias seguidos', icon: '🥉', category: 'streak', condition: (s) => s.maxStreak >= 5 },
    { id: 'str_3', name: 'Streak Prata', desc: '7 dias seguidos', icon: '🥈', category: 'streak', condition: (s) => s.maxStreak >= 7 },
    { id: 'str_4', name: 'Streak Ouro', desc: '10 dias seguidos', icon: '🥇', category: 'streak', condition: (s) => s.maxStreak >= 10 },
    { id: 'str_5', name: 'Streak Diamante', desc: '15 dias seguidos', icon: '💎', category: 'streak', condition: (s) => s.maxStreak >= 15 },
    { id: 'str_6', name: 'Streak Épico', desc: '20 dias seguidos', icon: '🏆', category: 'streak', condition: (s) => s.maxStreak >= 20 },
    { id: 'str_7', name: 'Streak Lendário', desc: '30 dias seguidos', icon: '👑', category: 'streak', condition: (s) => s.maxStreak >= 30 },
    { id: 'str_8', name: 'Streak Mítico', desc: '45 dias seguidos', icon: '🐉', category: 'streak', condition: (s) => s.maxStreak >= 45 },
    { id: 'str_9', name: 'Streak Imortal', desc: '60 dias seguidos', icon: '⚜️', category: 'streak', condition: (s) => s.maxStreak >= 60 },
    { id: 'str_10', name: 'Streak Divino', desc: '90 dias seguidos', icon: '🌟', category: 'streak', condition: (s) => s.maxStreak >= 90 },
    { id: 'str_11', name: 'Semana Completa', desc: '7 dias úteis seguidos', icon: '📅', category: 'streak', condition: (s) => s.weekdayStreak >= 5 },
    { id: 'str_12', name: 'Mês Completo', desc: 'Todos dias úteis do mês', icon: '📆', category: 'streak', condition: (s) => s.monthComplete },
    { id: 'str_13', name: 'Trimestre Ativo', desc: '90 dias ativos', icon: '📊', category: 'streak', condition: (s) => s.activeDays >= 90 },
    { id: 'str_14', name: 'Semestre Ativo', desc: '180 dias ativos', icon: '📈', category: 'streak', condition: (s) => s.activeDays >= 180 },
    { id: 'str_15', name: 'Ano Ativo', desc: '365 dias ativos', icon: '🎯', category: 'streak', condition: (s) => s.activeDays >= 365 },
    { id: 'str_16', name: 'Produtividade Diária', desc: '5+ por dia em 5 dias', icon: '📉', category: 'streak', condition: (s) => s.highProductivityStreak >= 5 },
    { id: 'str_17', name: 'Produtividade Semanal', desc: '5+ por dia em 7 dias', icon: '🗓️', category: 'streak', condition: (s) => s.highProductivityStreak >= 7 },
    { id: 'str_18', name: 'Produtividade Mensal', desc: '5+ por dia em 20 dias', icon: '📆', category: 'streak', condition: (s) => s.highProductivityStreak >= 20 },
    { id: 'str_19', name: 'Constância', desc: 'Mesmo volume 3 semanas', icon: '📐', category: 'streak', condition: (s) => s.volumeConsistency >= 3 },
    { id: 'str_20', name: 'Estabilidade', desc: 'Mesmo volume 4 semanas', icon: '📏', category: 'streak', condition: (s) => s.volumeConsistency >= 4 },
    { id: 'str_21', name: 'Regularidade', desc: 'Tickets todo dia útil', icon: '🔄', category: 'streak', condition: (s) => s.weekdayRegularity },
    { id: 'str_22', name: 'Comeback', desc: 'Voltou após 7+ dias', icon: '💪', category: 'streak', condition: (s) => s.comeback },
    { id: 'str_23', name: 'Grande Comeback', desc: 'Voltou após 30+ dias', icon: '🦸', category: 'streak', condition: (s) => s.bigComeback },
    { id: 'str_24', name: 'Manteve Ritmo', desc: 'Mesma média 30 dias', icon: '⚖️', category: 'streak', condition: (s) => s.keptPace30Days },
    { id: 'str_25', name: 'Acelerou Ritmo', desc: 'Aumentou média 20%', icon: '🚀', category: 'streak', condition: (s) => s.paceIncrease >= 20 },
    { id: 'str_26', name: 'Dobrou Ritmo', desc: 'Dobrou média mensal', icon: '⬆️', category: 'streak', condition: (s) => s.paceIncrease >= 100 },
    { id: 'str_27', name: 'Não Parou', desc: '0 dias sem ticket/mês', icon: '♾️', category: 'streak', condition: (s) => s.noZeroDaysMonth },
    { id: 'str_28', name: 'Infatigável', desc: '0 dias sem ticket/trimestre', icon: '🏋️', category: 'streak', condition: (s) => s.noZeroDaysQuarter },
    { id: 'str_29', name: 'Incansável', desc: '0 dias sem ticket/semestre', icon: '💫', category: 'streak', condition: (s) => s.noZeroDaysSemester },
    { id: 'str_30', name: 'Maratonista', desc: '100 dias ativos corridos', icon: '🏃‍♂️', category: 'streak', condition: (s) => s.marathonDays >= 100 },
    { id: 'str_31', name: 'Ultra Maratonista', desc: '200 dias ativos corridos', icon: '🏃‍♀️', category: 'streak', condition: (s) => s.marathonDays >= 200 },
    { id: 'str_32', name: 'Veterano Ativo', desc: '500+ dias no sistema', icon: '🎖️', category: 'streak', condition: (s) => s.totalDaysInSystem >= 500 },
    { id: 'str_33', name: 'Lenda Ativa', desc: '1000+ dias no sistema', icon: '🏛️', category: 'streak', condition: (s) => s.totalDaysInSystem >= 1000 },
    { id: 'str_34', name: 'Fundador', desc: 'Desde o início', icon: '🌟', category: 'streak', condition: (s) => s.isFounder },
    { id: 'str_35', name: 'Pioneiro', desc: 'Primeiro ano ativo', icon: '🚀', category: 'streak', condition: (s) => s.isPioneer },

    // DIVERSIDADE (246-280)
    { id: 'div_1', name: 'Explorador', desc: '2 tipos diferentes', icon: '🔍', category: 'diversidade', condition: (s) => s.uniqueTypes >= 2 },
    { id: 'div_2', name: 'Curioso', desc: '3 tipos diferentes', icon: '🧐', category: 'diversidade', condition: (s) => s.uniqueTypes >= 3 },
    { id: 'div_3', name: 'Versátil', desc: '5 tipos diferentes', icon: '🎭', category: 'diversidade', condition: (s) => s.uniqueTypes >= 5 },
    { id: 'div_4', name: 'Multi-Tarefas', desc: '7 tipos diferentes', icon: '🔄', category: 'diversidade', condition: (s) => s.uniqueTypes >= 7 },
    { id: 'div_5', name: 'Generalista', desc: '10 tipos diferentes', icon: '🌐', category: 'diversidade', condition: (s) => s.uniqueTypes >= 10 },
    { id: 'div_6', name: 'Expert All-Around', desc: '15 tipos diferentes', icon: '💫', category: 'diversidade', condition: (s) => s.uniqueTypes >= 15 },
    { id: 'div_7', name: 'Mestre Universal', desc: '20 tipos diferentes', icon: '👑', category: 'diversidade', condition: (s) => s.uniqueTypes >= 20 },
    { id: 'div_8', name: 'Colaborador', desc: '2 equipes diferentes', icon: '🤝', category: 'diversidade', condition: (s) => s.uniqueTeams >= 2 },
    { id: 'div_9', name: 'Ponte', desc: '3 equipes diferentes', icon: '🌉', category: 'diversidade', condition: (s) => s.uniqueTeams >= 3 },
    { id: 'div_10', name: 'Conector', desc: '5 equipes diferentes', icon: '🔗', category: 'diversidade', condition: (s) => s.uniqueTeams >= 5 },
    { id: 'div_11', name: 'Integrador', desc: '7 equipes diferentes', icon: '🧩', category: 'diversidade', condition: (s) => s.uniqueTeams >= 7 },
    { id: 'div_12', name: 'Embaixador', desc: '10 equipes diferentes', icon: '🏆', category: 'diversidade', condition: (s) => s.uniqueTeams >= 10 },
    { id: 'div_13', name: 'Especialista Único', desc: '100+ de 1 tipo', icon: '🎯', category: 'diversidade', condition: (s) => s.maxSingleType >= 100 },
    { id: 'div_14', name: 'Focado', desc: '50%+ de 1 tipo', icon: '🔬', category: 'diversidade', condition: (s) => s.focusPercentage >= 50 },
    { id: 'div_15', name: 'Multi-Cliente', desc: '5 clientes diferentes', icon: '🏢', category: 'diversidade', condition: (s) => s.uniqueClients >= 5 },
    { id: 'div_16', name: 'Carteira Grande', desc: '20 clientes diferentes', icon: '💼', category: 'diversidade', condition: (s) => s.uniqueClients >= 20 },
    { id: 'div_17', name: 'Mega Carteira', desc: '50 clientes diferentes', icon: '🏦', category: 'diversidade', condition: (s) => s.uniqueClients >= 50 },
    { id: 'div_18', name: 'Multi-Sistema', desc: '3 sistemas diferentes', icon: '💻', category: 'diversidade', condition: (s) => s.uniqueSystems >= 3 },
    { id: 'div_19', name: 'Poliglota Sistemas', desc: '7 sistemas diferentes', icon: '🖥️', category: 'diversidade', condition: (s) => s.uniqueSystems >= 7 },
    { id: 'div_20', name: 'Multi-Canal', desc: '3 canais diferentes', icon: '📱', category: 'diversidade', condition: (s) => s.uniqueChannels >= 3 },
    { id: 'div_21', name: 'Omnichannel', desc: '5 canais diferentes', icon: '📲', category: 'diversidade', condition: (s) => s.uniqueChannels >= 5 },
    { id: 'div_22', name: 'Multi-Produto', desc: '3 produtos diferentes', icon: '📦', category: 'diversidade', condition: (s) => s.uniqueProducts >= 3 },
    { id: 'div_23', name: 'Expert Produtos', desc: '10 produtos diferentes', icon: '🎁', category: 'diversidade', condition: (s) => s.uniqueProducts >= 10 },
    { id: 'div_24', name: 'Conhece Tudo', desc: 'Todos os produtos', icon: '🌟', category: 'diversidade', condition: (s) => s.allProducts },
    { id: 'div_25', name: 'Multi-Região', desc: '3 regiões diferentes', icon: '🌍', category: 'diversidade', condition: (s) => s.uniqueRegions >= 3 },
    { id: 'div_26', name: 'Global', desc: '5 regiões diferentes', icon: '🌎', category: 'diversidade', condition: (s) => s.uniqueRegions >= 5 },
    { id: 'div_27', name: 'Internacional', desc: '10 regiões diferentes', icon: '🌏', category: 'diversidade', condition: (s) => s.uniqueRegions >= 10 },
    { id: 'div_28', name: 'Variedade Tags', desc: '10 tags diferentes', icon: '🏷️', category: 'diversidade', condition: (s) => s.uniqueTags >= 10 },
    { id: 'div_29', name: 'Expert Tags', desc: '25 tags diferentes', icon: '📌', category: 'diversidade', condition: (s) => s.uniqueTags >= 25 },
    { id: 'div_30', name: 'Mestre Tags', desc: '50 tags diferentes', icon: '📍', category: 'diversidade', condition: (s) => s.uniqueTags >= 50 },
    { id: 'div_31', name: 'Cross-Funcional', desc: 'Tickets de 3 áreas', icon: '🔀', category: 'diversidade', condition: (s) => s.crossFunctional >= 3 },
    { id: 'div_32', name: 'Full-Stack Support', desc: 'Tickets de 5 áreas', icon: '🔁', category: 'diversidade', condition: (s) => s.crossFunctional >= 5 },
    { id: 'div_33', name: 'Sem Limites', desc: 'Todas as áreas', icon: '♾️', category: 'diversidade', condition: (s) => s.allAreas },
    { id: 'div_34', name: 'Adaptável', desc: 'Mudou foco com sucesso', icon: '🦎', category: 'diversidade', condition: (s) => s.successfulPivot },
    { id: 'div_35', name: 'Camaleão', desc: '3+ mudanças de foco', icon: '🎨', category: 'diversidade', condition: (s) => s.pivotCount >= 3 },

    // CONQUISTAS ESPECIAIS (281-300)
    { id: 'spec_1', name: 'Ticket #1', desc: 'Resolveu ticket ID 1', icon: '1️⃣', category: 'especial', condition: (s) => s.resolvedTicket1 },
    { id: 'spec_2', name: 'Ticket #100', desc: 'Resolveu ticket ID 100', icon: '💯', category: 'especial', condition: (s) => s.resolvedTicket100 },
    { id: 'spec_3', name: 'Ticket #1000', desc: 'Resolveu ticket ID 1000', icon: '🔢', category: 'especial', condition: (s) => s.resolvedTicket1000 },
    { id: 'spec_4', name: 'Palindromo', desc: 'Ticket com ID palíndromo', icon: '🪞', category: 'especial', condition: (s) => s.palindromeTicket },
    { id: 'spec_5', name: 'Número Redondo', desc: 'Ticket ID múltiplo de 1000', icon: '⭕', category: 'especial', condition: (s) => s.roundNumberTicket },
    { id: 'spec_6', name: 'Primeiro da Equipe', desc: '1º ticket da equipe', icon: '🥇', category: 'especial', condition: (s) => s.firstTeamTicket },
    { id: 'spec_7', name: 'Último do Dia', desc: 'Último ticket do dia', icon: '🌙', category: 'especial', condition: (s) => s.lastDayTicket >= 5 },
    { id: 'spec_8', name: 'Primeiro do Dia', desc: 'Primeiro ticket do dia', icon: '🌅', category: 'especial', condition: (s) => s.firstDayTicket >= 5 },
    { id: 'spec_9', name: 'Lucky 7', desc: '7 tickets em 7 horas', icon: '🍀', category: 'especial', condition: (s) => s.lucky7 },
    { id: 'spec_10', name: 'Triple 7', desc: '777º ticket resolvido', icon: '🎰', category: 'especial', condition: (s) => s.resolved >= 777 },
    { id: 'spec_11', name: 'Perfectionist', desc: '5 estrelas CSAT', icon: '⭐', category: 'especial', condition: (s) => s.perfectCsat >= 1 },
    { id: 'spec_12', name: 'Sempre 5 Estrelas', desc: '10+ avaliações 5⭐', icon: '🌟', category: 'especial', condition: (s) => s.perfectCsat >= 10 },
    { id: 'spec_13', name: 'Mestre CSAT', desc: '50+ avaliações 5⭐', icon: '💫', category: 'especial', condition: (s) => s.perfectCsat >= 50 },
    { id: 'spec_14', name: 'CSAT Médio 4.5+', desc: 'Média CSAT >= 4.5', icon: '📊', category: 'especial', condition: (s) => s.avgCsat >= 4.5 },
    { id: 'spec_15', name: 'CSAT Médio 4.8+', desc: 'Média CSAT >= 4.8', icon: '📈', category: 'especial', condition: (s) => s.avgCsat >= 4.8 },
    { id: 'spec_16', name: 'CSAT Perfeito', desc: 'Média CSAT = 5.0', icon: '💯', category: 'especial', condition: (s) => s.avgCsat === 5 && s.csatCount >= 10 },
    { id: 'spec_17', name: 'Feedback Positivo', desc: 'Elogiado pelo cliente', icon: '💬', category: 'especial', condition: (s) => s.positiveFeedback >= 1 },
    { id: 'spec_18', name: 'Influenciador', desc: '10+ elogios', icon: '🗣️', category: 'especial', condition: (s) => s.positiveFeedback >= 10 },
    { id: 'spec_19', name: 'Celebridade', desc: '50+ elogios', icon: '🌟', category: 'especial', condition: (s) => s.positiveFeedback >= 50 },
    { id: 'spec_20', name: 'Easter Egg', desc: 'Achou o segredo!', icon: '🥚', category: 'especial', condition: (s) => s.easterEgg }
    ];

    // 3. Limpeza e Exposição Global
    const ids = new Set();
    window.ALL_GAMIFICATION_BADGES = allBadges.filter(badge => {
        if (ids.has(badge.id)) {
            console.warn(`Badge duplicado detectado e removido: ${badge.id}`);
            return false;
        }
        ids.add(badge.id);
        return true;
    });

    // Retrocompatibilidade
    window.GAMIFICATION_BADGES = window.ALL_GAMIFICATION_BADGES;
    window.GAMIFICATION_BADGES_PART2 = [];
    window.GAMIFICATION_BADGES_PART3 = [];
    window.GAMIFICATION_BADGES_PART4 = [];

    // 4. Funções Auxiliares
    window.getBadgesByCategory = function(category) {
        if (!window.ALL_GAMIFICATION_BADGES) return [];
        return window.ALL_GAMIFICATION_BADGES.filter(b => b.category === category);
    };

    window.getBadgeStats = function() {
        if (!window.ALL_GAMIFICATION_BADGES) return null;
        const stats = {};
        Object.keys(window.BADGE_CATEGORIES).forEach(cat => {
            stats[cat] = window.ALL_GAMIFICATION_BADGES.filter(b => b.category === cat).length;
        });
        stats.total = window.ALL_GAMIFICATION_BADGES.length;
        return stats;
    };

    // 5. Inicialização
    function init() {
        console.log(`✅ ${window.ALL_GAMIFICATION_BADGES.length} conquistas unificadas carregadas`);
        
        if (window.GamificationModule) {
            window.GamificationModule.badges = window.ALL_GAMIFICATION_BADGES;
            console.log('✅ Badges atualizados no GamificationModule');
        }

        document.dispatchEvent(new CustomEvent('badgesLoaded', { 
            detail: { count: window.ALL_GAMIFICATION_BADGES.length } 
        }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();