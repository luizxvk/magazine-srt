# 📋 TODO - Features & Fixes

## 🚀 Features Planejadas

### 🎠 Carrossel Mobile (Feed - Acima do "Bem-vindo")
**Status:** Pendente  
**Prioridade:** Alta  

Implementar um carrossel horizontal no modo responsivo/mobile que aparecerá **acima** do espaço "Bem-vindo, usuário" no feed.

#### Cards que devem aparecer no carrossel:
1. **Bônus Diário** - DailyLoginCard
2. **Catálogo de Fotos** - PhotoCatalogCard
3. **Eventos Exclusivos** - EventsCard
4. **Membros Novos** - NewMembersCard (modal)
5. **Destaques da Semana** - (criar novo componente)
6. **Feedback** - FeedbackFormCard

#### Requisitos:
- [ ] Criar componente `MobileCarousel.tsx`
- [ ] Mostrar apenas em telas mobile (< 768px ou < 1024px)
- [ ] Swipe horizontal nativo
- [ ] Indicadores de posição (dots)
- [ ] Auto-play opcional
- [ ] Cards adaptados para formato carrossel (mais compactos)

#### Notas:
- NÃO incluir outros cards além dos listados
- O carrossel substitui a sidebar no mobile
- Deve ser suave e performático

---

## 🐛 Bugs Corrigidos

### ✅ [v0.3.25] Erro 500 ao deletar produto
**Data:** 12/01/2026  
**Problema:** DELETE /api/products/admin/:id retornava 500  
**Causa:** Foreign key constraint com Orders e ProductKeys  
**Solução:** Implementado transaction para deletar keys e orders antes do produto  

---

## 📝 Notas Gerais

- Versão Atual: **0.3.25**
- Branch: **beta**
- Deploy: Vercel (client) + Vercel (server)

---

*Última atualização: 12/01/2026*
