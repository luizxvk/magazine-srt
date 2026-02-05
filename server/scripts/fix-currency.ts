/**
 * Script para corrigir o campo currency nos registros antigos de ZionHistory
 * Executa inferência baseada na reason e atualiza para CASH onde apropriado
 */

import prisma from '../src/utils/prisma';

function inferCurrency(reason: string): 'CASH' | 'POINTS' {
    const lower = reason.toLowerCase();
    
    // Zions CASH - transações com dinheiro real
    if (
        lower.includes('cash') ||
        lower.includes('recarga') ||
        lower.includes('compra de zions') ||
        lower.includes('r$') ||
        lower.includes('reais') ||
        lower.includes('pix') ||
        lower.includes('mercado pago') ||
        lower.includes('saque') ||
        lower.includes('withdraw') ||
        lower.includes('produto') ||
        lower.includes('key') ||
        lower.includes('gift card')
    ) {
        return 'CASH';
    }
    
    return 'POINTS';
}

async function main() {
    console.log('=== Corrigindo campo currency em ZionHistory ===\n');
    
    // Buscar todos os registros
    const allHistory = await prisma.zionHistory.findMany({
        select: {
            id: true,
            reason: true,
            currency: true
        }
    });
    
    console.log(`Total de registros: ${allHistory.length}`);
    
    // Identificar registros que precisam ser atualizados
    const toUpdate: { id: string; newCurrency: 'CASH' | 'POINTS' }[] = [];
    
    for (const record of allHistory) {
        const inferred = inferCurrency(record.reason);
        if (record.currency !== inferred) {
            toUpdate.push({ id: record.id, newCurrency: inferred });
        }
    }
    
    console.log(`Registros a atualizar: ${toUpdate.length}`);
    
    if (toUpdate.length === 0) {
        console.log('Nenhum registro precisa ser atualizado.');
        await prisma.$disconnect();
        return;
    }
    
    // Mostrar preview
    console.log('\nPreview das mudanças:');
    for (const item of toUpdate.slice(0, 10)) {
        const record = allHistory.find(r => r.id === item.id);
        console.log(`  ${record?.currency} → ${item.newCurrency}: ${record?.reason.substring(0, 50)}...`);
    }
    
    if (toUpdate.length > 10) {
        console.log(`  ... e mais ${toUpdate.length - 10} registros`);
    }
    
    // Executar atualizações
    console.log('\nAtualizando registros...');
    
    let updated = 0;
    for (const item of toUpdate) {
        await prisma.zionHistory.update({
            where: { id: item.id },
            data: { currency: item.newCurrency }
        });
        updated++;
        if (updated % 50 === 0) {
            console.log(`  Atualizados: ${updated}/${toUpdate.length}`);
        }
    }
    
    console.log(`\n✅ ${updated} registros atualizados com sucesso!`);
    
    // Verificar resultado
    const cashCount = await prisma.zionHistory.count({ where: { currency: 'CASH' } });
    const pointsCount = await prisma.zionHistory.count({ where: { currency: 'POINTS' } });
    
    console.log(`\nResultado:`);
    console.log(`  CASH: ${cashCount} registros`);
    console.log(`  POINTS: ${pointsCount} registros`);
    
    await prisma.$disconnect();
}

main().catch(console.error);
