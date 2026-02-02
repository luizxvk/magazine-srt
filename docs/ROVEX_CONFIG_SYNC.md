# 📋 Rovex → Magazine: Sincronização de Configurações

## Data: 02/02/2026

---

## 🔍 Problema Identificado

A tela de login das comunidades criadas está mostrando os **valores padrão** (Magazine MGT, logo MGZN) ao invés das configurações personalizadas definidas na Rovex.

**Causa:** O config não está sendo salvo no banco de dados da comunidade durante o provisioning.

---

## ✅ Solução

A Rovex precisa chamar o endpoint **`POST /api/rovex/config`** para salvar as configurações no banco da comunidade.

### Endpoint

```
POST https://{subdomain}.vercel.app/api/rovex/config
```

### Headers

```http
Content-Type: application/json
x-rovex-secret: {ROVEX_API_SECRET da comunidade}
```

### Payload Completo

```json
{
  "communityId": "uuid-da-comunidade",
  "subdomain": "street-runner-team",
  
  "name": "Street Runner Team",
  "slogan": "Velocidade e Poder",
  
  "logoUrl": "https://cdn.rovex.app/communities/srt/logo.png",
  "logoIconUrl": "https://cdn.rovex.app/communities/srt/icon.png",
  "faviconUrl": "https://cdn.rovex.app/communities/srt/favicon.ico",
  
  "primaryColor": "#ef4444",
  "secondaryColor": "#dc2626",
  "accentColor": "#f59e0b",
  "backgroundColor": "#ef4444",
  
  "tierVipName": "MAGAZINE",
  "tierVipColor": "#d4af37",
  "tierVipSlogan": "A Elite do Sucesso",
  
  "tierStdName": "Street Runners",
  "tierStdSlogan": "Velocidade e Poder",
  
  "currencyName": "Zions",
  "currencySymbol": "Z$",
  
  "plan": "ENTERPRISE"
}
```

### Resposta Esperada

```json
{
  "success": true,
  "message": "Configuration synced successfully",
  "config": { ... }
}
```

---

## 🔄 Quando Chamar

| Momento | Ação |
|---------|------|
| **Após provisioning** | Chamar imediatamente após criar a comunidade |
| **Botão "Sincronizar Dados"** | Chamar quando admin clicar no dashboard Rovex |
| **Após edição de branding** | Chamar quando admin alterar logo/cores/nomes |

---

## 📡 Endpoint Público para Verificação

O frontend busca as configurações via:

```
GET https://{subdomain}.vercel.app/api/rovex/public/config
```

**Sem autenticação** - Use para verificar se o config foi salvo corretamente.

### Exemplo de Resposta (config salvo):

```json
{
  "success": true,
  "config": {
    "name": "Street Runner Team",
    "tierStdName": "Street Runners",
    "logoUrl": "https://cdn.rovex.app/...",
    ...
  }
}
```

### Exemplo de Resposta (config NÃO salvo - usando defaults):

```json
{
  "success": true,
  "config": {
    "name": "Magazine MGT",
    "tierStdName": "MGT",
    "logoUrl": null,
    ...
  }
}
```

---

## 🧪 Teste Rápido

```bash
# 1. Verificar config atual (deve estar com defaults)
curl https://street-runner-team.vercel.app/api/rovex/public/config

# 2. Enviar config personalizado
curl -X POST https://street-runner-team.vercel.app/api/rovex/config \
  -H "Content-Type: application/json" \
  -H "x-rovex-secret: SEU_SECRET_AQUI" \
  -d '{
    "name": "Street Runner Team",
    "tierStdName": "Street Runners",
    "tierStdSlogan": "Velocidade e Poder",
    "logoUrl": "https://...",
    "primaryColor": "#ef4444"
  }'

# 3. Verificar novamente (agora deve mostrar valores personalizados)
curl https://street-runner-team.vercel.app/api/rovex/public/config

# 4. Recarregar a página de login - deve mostrar as novas configs
```

---

## 📊 Campos Importantes

| Campo | Onde Aparece | Fallback |
|-------|--------------|----------|
| `name` | Título da aba do browser | "Magazine MGT" |
| `faviconUrl` | Ícone da aba | Logo padrão |
| `logoUrl` | Logo lado esquerdo (MAGAZINE) | Logo MGZN |
| `logoIconUrl` | Logo lado direito (Member) | Logo MGT |
| `tierVipName` | Texto lado esquerdo | "MAGAZINE" |
| `tierVipSlogan` | Subtítulo lado esquerdo | "A Elite do Sucesso" |
| `tierStdName` | Texto lado direito | "MGT" |
| `tierStdSlogan` | Subtítulo lado direito | "Velocidade e Poder" |
| `backgroundColor` | Cor do card direito | Verde (#10b981) |
| `primaryColor` | Cor de botões/links | Dourado (#d4af37) |

---

## ⚠️ Observação sobre Admin

O modo `ADMIN_ONLY_MODE` está ativo. Para que um admin consiga logar em uma comunidade, ele precisa:

1. **Existir no banco de dados dessa comunidade** com `role: 'ADMIN'`
2. Ser criado via endpoint de provisioning:

```json
POST /api/rovex/provision
{
  ...outras configs...,
  "adminUser": {
    "email": "admin@streetrunner.com",
    "password": "senha-segura",
    "name": "Admin SRT"
  }
}
```

Cada comunidade tem banco separado. O `admin@magazine.com` só existe no Magazine SRT original.

---

## 📞 Contato

Dúvidas sobre a integração: Luiz (Magazine)

---

**Status:** Aguardando Rovex enviar POST /api/rovex/config para as comunidades criadas
