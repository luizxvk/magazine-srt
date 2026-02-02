# Magazine SRT - Relatório de Modularização White-Label

> **Data:** 02/02/2026  
> **Branch:** `beta`  
> **Commit:** `5b547d7`  
> **Status:** ✅ Implementado

---

## 📋 Resumo Executivo

Implementamos a modularização do Magazine SRT para suportar white-label via Rovex Platform. A regra principal é:

| Elemento | Comportamento | Origem |
|----------|---------------|--------|
| **MAGAZINE** | 🔒 **FIXO** - Nunca muda | Hardcoded no código |
| **MGT** | 🔄 **DINÂMICO** - Muda por comunidade | `config.tierStdName` |
| **Logo MGT** | 🔄 **DINÂMICO** - Muda por comunidade | `config.logoIconUrl` |

---

## 🔧 Alterações Técnicas Realizadas

### 1. Header.tsx
**Caminho:** `client/src/components/Header.tsx`

**Antes:**
```tsx
<span className="text-xl font-bold">{config.tierVipName}</span>
```

**Depois:**
```tsx
<span className="text-xl font-bold">MAGAZINE</span>
```

**Motivo:** O nome "MAGAZINE" é a marca principal e deve permanecer fixo em todas as comunidades white-label que usam este template.

---

### 2. ModernLogin.tsx (Página de Login)
**Caminho:** `client/src/pages/ModernLogin.tsx`

**Alterações:**

#### 2.1 Import do Logo
```tsx
// ANTES
import logoMgt from '../assets/logo-mgt-full.png';

// DEPOIS
import logoMgtFallback from '../assets/logo-mgt-full.png';
// + dentro do componente:
const logoMgt = config.logoIconUrl || logoMgtFallback;
```

#### 2.2 Textos MGT Dinâmicos
```tsx
// ANTES
alt="MGT"
<h2>MGT</h2>
<button>Acessar MGT</button>

// DEPOIS
alt={config.tierStdName}
<h2>{config.tierStdName}</h2>
<button>Acessar {config.tierStdName}</button>
```

**Locais atualizados:**
- Painel direito (desktop) - logo e título
- Overlay MGT INVITE - logo, título e botão
- Botão mobile "Acessar MGT"

---

### 3. Register.tsx (Página de Cadastro)
**Caminho:** `client/src/pages/Register.tsx`

**Alterações idênticas ao ModernLogin.tsx:**

```tsx
// Import
import logoMgtFallback from '../assets/logo-mgt-full.png';
import { useCommunity } from '../context/CommunityContext';

// Dentro do componente
const { config } = useCommunity();
const logoMgt = config.logoIconUrl || logoMgtFallback;

// No JSX
<img src={isMGT ? logoMgt : logo} alt={isMGT ? config.tierStdName : "MAGAZINE"} />
```

---

### 4. useDynamicHead.ts (Novo Hook)
**Caminho:** `client/src/hooks/useDynamicHead.ts`

**Funcionalidade:** Hook que atualiza dinamicamente:
- `document.title` (título da aba)
- `<link rel="icon">` (favicon)
- Meta tags OpenGraph (`og:title`, `og:image`, `og:description`)

**Uso:**
```tsx
import { useDynamicHead } from '../hooks/useDynamicHead';

function App() {
  useDynamicHead(); // Atualiza head automaticamente
  return <Router>...</Router>;
}
```

**Fonte dos dados:** `CommunityContext` → `config.name`, `config.faviconUrl`, `config.ogImageUrl`, etc.

---

## 📡 O que a Rovex Precisa Enviar

Para que a modularização funcione, o payload de **provisioning** deve incluir:

### Campos Obrigatórios para White-Label

```typescript
interface RovexProvisioningPayload {
  // ... campos existentes ...
  
  // ✅ CRÍTICOS para modularização
  tierStdName: string;      // Ex: "MEMBER", "Recruta", "VIP" (substitui "MGT")
  tierStdColor: string;     // Ex: "#10b981" (cor do tier padrão)
  
  logoIconUrl?: string;     // URL do logo quadrado (substitui logo-mgt-full.png)
  faviconUrl?: string;      // Favicon 32x32
  
  // Mantidos como referência (não usados para modularização)
  tierVipName: string;      // Ignorado no frontend (MAGAZINE é fixo)
  tierVipColor: string;     // "#d4af37" (usado para estilo)
}
```

### Exemplo de Payload

```json
{
  "subdomain": "gamerhub",
  "name": "GamerHub",
  "plan": "GROWTH",
  
  "tierVipName": "ELITE",
  "tierVipColor": "#d4af37",
  
  "tierStdName": "GAMER",
  "tierStdColor": "#3b82f6",
  
  "logoIconUrl": "https://cdn.rovex.app/gamerhub/logo-icon.png",
  "faviconUrl": "https://cdn.rovex.app/gamerhub/favicon.ico",
  
  "currencyName": "Coins",
  "currencySymbol": "🪙"
}
```

### Resultado Visual

Com o payload acima:
- Página de login mostrará "**GAMER**" no painel direito (ao invés de "MGT")
- Logo será a URL customizada do `logoIconUrl`
- Favicon será atualizado dinamicamente
- "**MAGAZINE**" permanece fixo no painel esquerdo

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                      ROVEX PLATFORM                              │
│  POST /api/rovex/config { tierStdName: "GAMER", logoIconUrl }   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAGAZINE BACKEND                              │
│  Salva em SystemConfig → key: "community_config"                │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MAGAZINE FRONTEND                             │
│  CommunityContext.refreshConfig() → GET /api/rovex/config       │
│                              │                                   │
│                              ▼                                   │
│  config.tierStdName = "GAMER"                                   │
│  config.logoIconUrl = "https://..."                             │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │  ModernLogin    │  │    Register     │  │  useDynamicHead│  │
│  │  {tierStdName}  │  │  {tierStdName}  │  │  (favicon)     │  │
│  └─────────────────┘  └─────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Pontos de Atenção

### 1. MAGAZINE é Imutável
O nome "MAGAZINE" **nunca** deve vir do `config.tierVipName`. Está hardcoded propositalmente para manter a identidade da marca.

### 2. Fallback de Logo
Se `config.logoIconUrl` não for fornecido ou estiver vazio, o sistema usa a logo padrão do Magazine (`logo-mgt-full.png`).

```tsx
const logoMgt = config.logoIconUrl || logoMgtFallback;
```

### 3. Cores Dinâmicas
As cores do tier padrão (MGT/GAMER/etc) ainda usam classes Tailwind fixas (`emerald-500`). Para cores 100% dinâmicas, seria necessário usar CSS variables:

```tsx
// Futuro: Usar CSS variables para cores dinâmicas
style={{ color: config.tierStdColor }}
```

**Sugestão:** Se a Rovex precisar de cores dinâmicas por comunidade, podemos implementar via CSS variables no próximo sprint.

---

## 📁 Arquivos Modificados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `client/src/components/Header.tsx` | Modificado | MAGAZINE fixo (3 ocorrências) |
| `client/src/pages/ModernLogin.tsx` | Modificado | MGT dinâmico + logo dinâmica |
| `client/src/pages/Register.tsx` | Modificado | MGT dinâmico + logo dinâmica |
| `client/src/hooks/useDynamicHead.ts` | **Novo** | Hook para favicon/title dinâmico |

---

## ✅ Checklist de Integração

Para a Rovex validar:

- [ ] Endpoint `/api/rovex/config` retorna `tierStdName` corretamente
- [ ] `logoIconUrl` é uma URL válida e acessível (CORS liberado)
- [ ] `faviconUrl` é um arquivo .ico ou .png válido
- [ ] Testar provisioning com payload customizado
- [ ] Verificar que "MAGAZINE" permanece fixo após provisioning

---

## 📞 Próximos Passos

1. **Rovex confirmar** payload de provisioning com novos campos
2. **Magazine testar** com payload real de uma comunidade white-label
3. **Opcional:** Implementar cores dinâmicas via CSS variables se necessário

---

**Desenvolvido por:** Magazine SRT Team  
**Contato técnico:** dev@magazinesrt.com
