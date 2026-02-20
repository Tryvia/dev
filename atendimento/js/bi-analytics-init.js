// Inicialização do BI Analytics
// Este arquivo deve ser carregado após todos os outros módulos do BI Analytics

// Verificar se a classe existe
if (typeof BIAnalytics !== 'undefined') {
    // Criar instância global
    window.biAnalytics = new BIAnalytics();
    console.log('✅ BI Analytics inicializado com sucesso');
    
    // Verificar se todos os métodos foram carregados
    const requiredMethods = [
        'toggleEntity', 
        'selectAll', 
        'clearSelection',
        'switchView',
        'applyFilters',
        'syncSelections',
        'renderCharts',
        'renderStatusChart',
        'renderPriorityChart',
        'renderTimelineChart',
        'renderSLAChart'
    ];
    
    let allMethodsLoaded = true;
    const missingMethods = [];
    
    requiredMethods.forEach(method => {
        if (typeof window.biAnalytics[method] !== 'function') {
            allMethodsLoaded = false;
            missingMethods.push(method);
        }
    });
    
    if (allMethodsLoaded) {
        console.log('✅ Todos os métodos do BI Analytics foram carregados corretamente');
    } else {
        console.warn('⚠️ Alguns métodos do BI Analytics não foram carregados:', missingMethods);
    }
    
    // Debug: listar todos os métodos disponíveis
    const availableMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(window.biAnalytics))
        .filter(prop => typeof window.biAnalytics[prop] === 'function' && prop !== 'constructor');
    
    console.log('📋 Métodos disponíveis no BI Analytics:', availableMethods);
    
} else {
    console.error('❌ Classe BIAnalytics não encontrada. Verifique se os scripts foram carregados na ordem correta.');
}
