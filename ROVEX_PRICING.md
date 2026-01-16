# 💰 Rovex Platform - Pricing & Cost Structure

> **Documento para alinhamento entre projetos Magazine SRT ↔ Rovex Platform**  
> **Atualizado**: Janeiro 2026

---

## 📊 Custos Operacionais por Comunidade (Mensal)

Estes são os custos estimados que a Rovex terá para manter cada comunidade rodando:

| Serviço | STARTER (500 users) | GROWTH (2000 users) | ENTERPRISE (unlimited) |
|---------|---------------------|---------------------|------------------------|
| **PostgreSQL (Neon/Supabase)** | R$ 25 | R$ 80 | R$ 200+ |
| **Hosting (Vercel/Railway)** | R$ 35 | R$ 80 | R$ 150 |
| **Storage (Cloudflare R2)** | R$ 15 | R$ 50 | R$ 120 |
| **Images (Cloudinary)** | R$ 20 | R$ 60 | R$ 150 |
| **Email (Resend/Sendgrid)** | R$ 10 | R$ 30 | R$ 80 |
| **DNS + SSL** | R$ 5 | R$ 5 | R$ 10 |
| **Backup + Monitoring** | R$ 10 | R$ 25 | R$ 50 |
| **Suporte (proporcional)** | R$ 20 | R$ 50 | R$ 100 |
| **CUSTO TOTAL** | **~R$ 140** | **~R$ 380** | **~R$ 860** |
| **Margem de Lucro (~40-50%)** | +R$ 107 | +R$ 217 | +R$ 637 |
| **PREÇO FINAL** | **R$ 247/mês** | **R$ 597/mês** | **R$ 1.497/mês** |

---

## 🎯 Planos e Preços Finais

| Plano | Usuários | Preço Mensal | Custo | Margem |
|-------|----------|--------------|-------|--------|
| **STARTER** | Até 500 | **R$ 247/mês** | ~R$ 140 | 43% |
| **GROWTH** | Até 2.000 | **R$ 597/mês** | ~R$ 380 | 36% |
| **ENTERPRISE** | Ilimitado | **R$ 1.497/mês** | ~R$ 860 | 42% |

---

## ✨ Comparativo de Features por Plano

| Feature | STARTER | GROWTH | ENTERPRISE |
|---------|---------|--------|------------|
| **Máximo de Usuários** | 500 | 2,000 | Ilimitado |
| **Storage (R2)** | 5 GB | 25 GB | 100 GB |
| **Cloudinary Uploads** | 10 GB/mês | 50 GB/mês | 200 GB/mês |
| **Cota de Emails** | 1,000/mês | 10,000/mês | 50,000/mês |
| **Domínio Customizado** | ❌ | ✅ | ✅ |
| **White-label (sem marca Rovex)** | ❌ | ❌ | ✅ |
| **Suporte Prioritário** | ❌ | ✅ | ✅ (dedicado) |
| **SLA Uptime** | 99% | 99.5% | 99.9% |
| **Integrações Sociais** | 1 | 3 | Ilimitado |
| **Dashboard Analytics** | Básico | Avançado | Full + API |
| **Backup Diário** | 7 dias | 30 dias | 90 dias |

---

## 📅 Desconto Anual (15% off)

| Plano | Mensal | Anual (15% off) | Economia |
|-------|--------|-----------------|----------|
| STARTER | R$ 247/mês | R$ 2.519/ano (~R$ 210/mês) | R$ 445/ano |
| GROWTH | R$ 597/mês | R$ 6.089/ano (~R$ 507/mês) | R$ 1.075/ano |
| ENTERPRISE | R$ 1.497/mês | R$ 15.269/ano (~R$ 1.272/mês) | R$ 2.695/ano |

---

## ➕ Add-ons (Uso Extra)

| Add-on | Preço |
|--------|-------|
| +1,000 usuários | R$ 50/mês |
| +10 GB storage (R2) | R$ 25/mês |
| +10 GB Cloudinary | R$ 30/mês |
| +5,000 emails | R$ 15/mês |
| Subdomínio extra | R$ 30/mês |
| Pack de temas premium | R$ 97 (único) |

---

## 🗄️ Prisma Schema - Enum Plan

```prisma
enum Plan {
  STARTER           // Até 500 usuários, R$ 247/mês
  GROWTH            // Até 2000 usuários, R$ 597/mês
  ENTERPRISE        // Usuários ilimitados, R$ 1.497/mês
}

enum BillingCycle {
  MONTHLY
  YEARLY            // 15% desconto
}
```

---

## 💳 Notas para Implementação (Stripe)

1. **Stripe Products**: Criar 3 products (STARTER, GROWTH, ENTERPRISE)
2. **Stripe Prices**: Criar price_id mensal e anual para cada plano
3. **Metered Billing**: Usar para add-ons baseados em uso
4. **Moeda**: BRL (Real Brasileiro) - configurar no Stripe
5. **Trial Period**: Considerar 14 dias grátis no STARTER
6. **Upgrade/Downgrade**: Usar proration automática do Stripe
7. **Webhooks**: 
   - `invoice.payment_succeeded` → Ativar/renovar comunidade
   - `invoice.payment_failed` → Marcar como PENDING_PAYMENT
   - `customer.subscription.deleted` → Suspender após grace period

---

## 📈 Projeção de Receita

| Cenário | Comunidades | Mix de Planos | MRR | Anual |
|---------|-------------|---------------|-----|-------|
| **Early Stage** | 10 | 80% STARTER, 20% GROWTH | ~R$ 3.200 | ~R$ 38.400 |
| **Growth** | 50 | 60% STARTER, 30% GROWTH, 10% ENT | ~R$ 21.000 | ~R$ 252.000 |
| **Mature** | 200 | 50% STARTER, 35% GROWTH, 15% ENT | ~R$ 100.000+ | ~R$ 1.2M+ |

---

## 🔗 Arquivos Relacionados

- Magazine: `.github/copilot-instructions.md` (seção Rovex Platform)
- Magazine: `ROVEX_COPILOT_INSTRUCTIONS.md`
- Rovex Platform: `ROVEX_COPILOT_INSTRUCTIONS.md` (sincronizar)

---

> **Última atualização**: 16 de Janeiro de 2026
