# Integração Social - Discord, Steam e Twitch

## Visão Geral

O Magazine SRT agora possui integração com Discord, Steam e Twitch para exibir atividades sociais dos usuários em tempo real.

### Features Implementadas

1. **Discord**: Mostra amigos online e seus status
2. **Steam**: Exibe amigos jogando e seus jogos atuais
3. **Twitch**: Preview de livestreams ao vivo

---

## Configuração

### 1. Discord OAuth

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Crie uma nova aplicação
3. Na seção OAuth2, adicione a redirect URI: `https://magazine-srt.vercel.app/api/social/discord/callback`
4. Copie o **Client ID** e **Client Secret**
5. Em OAuth2 > URL Generator, selecione os scopes:
   - `identify`
   - `guilds`
   - `relationships.read`

**Variáveis de ambiente:**
```env
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://magazine-srt.vercel.app/api/social/discord/callback
```

### 2. Steam API

1. Acesse [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Registre um domínio (pode usar localhost para desenvolvimento)
3. Copie sua **API Key**

**Variáveis de ambiente:**
```env
STEAM_API_KEY=sua_api_key
STEAM_REALM=http://localhost:5000
```

### 3. Twitch API

1. Acesse [Twitch Developers Console](https://dev.twitch.tv/console)
2. Registre uma aplicação
3. Copie o **Client ID** e **Client Secret**
4. Gere um **App Access Token** usando:
```bash
curl -X POST 'https://id.twitch.tv/oauth2/token' \
-H 'Content-Type: application/x-www-form-urlencoded' \
-d 'client_id=SEU_CLIENT_ID&client_secret=SEU_CLIENT_SECRET&grant_type=client_credentials'
```

**Variáveis de ambiente:**
```env
TWITCH_CLIENT_ID=seu_client_id
TWITCH_CLIENT_SECRET=seu_client_secret
TWITCH_ACCESS_TOKEN=seu_app_access_token
```

---

## Uso

### Backend

As rotas estão disponíveis em `/api/social`:

#### Discord
- `GET /api/social/discord/auth` - Inicia autenticação OAuth
- `GET /api/social/discord/callback` - Callback OAuth
- `GET /api/social/discord/friends` - Lista amigos online

#### Steam
- `GET /api/social/steam/auth` - Inicia autenticação OpenID
- `GET /api/social/steam/callback` - Callback OpenID
- `GET /api/social/steam/activities` - Lista amigos jogando

#### Twitch
- `GET /api/social/twitch/streams?usernames=user1,user2` - Busca streams ao vivo

#### Geral
- `GET /api/social/connections` - Lista todas as conexões do usuário
- `DELETE /api/social/disconnect/:platform` - Desconecta uma plataforma

### Frontend

Os componentes estão prontos para uso:

```tsx
import DiscordCard from '../components/DiscordCard';
import SteamCard from '../components/SteamCard';
import TwitchCard from '../components/TwitchCard';

// Uso básico
<DiscordCard />
<SteamCard />
<TwitchCard usernames={['gaules', 'alanzoka']} />
```

---

## Banco de Dados

Execute as migrações do Prisma:

```bash
cd server
npx prisma migrate dev --name add_social_connections
npx prisma generate
```

### Modelos Criados

**SocialConnection**: Armazena tokens OAuth e metadados
```prisma
model SocialConnection {
  id               String         @id @default(uuid())
  userId           String
  platform         SocialPlatform // DISCORD | STEAM | TWITCH
  platformId       String
  platformUsername String?
  accessToken      String?
  refreshToken     String?
  expiresAt        DateTime?
  isActive         Boolean        @default(true)
  lastSynced       DateTime?
  metadata         Json?
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
}
```

**SocialActivity**: Registra atividades dos usuários
```prisma
model SocialActivity {
  id            String         @id @default(uuid())
  userId        String
  platform      SocialPlatform
  activityType  String        // "playing", "streaming", "online"
  gameName      String?
  gameId        String?
  status        String?
  startedAt     DateTime       @default(now())
  endedAt       DateTime?
  isLive        Boolean        @default(false)
  streamUrl     String?
  thumbnailUrl  String?
  metadata      Json?
}
```

---

## Segurança

### Tokens
- Tokens OAuth são armazenados no banco de dados
- **IMPORTANTE**: Em produção, considere criptografar os tokens antes de salvar
- Tokens expirados são tratados automaticamente (retorna erro 401)

### Permissões
- Usuários precisam estar autenticados para conectar contas
- Cada usuário só pode ver suas próprias conexões
- OAuth callback valida o `state` parameter para segurança

---

## Limitações

### Discord
- A API `relationships.read` requer permissões especiais
- Pode exigir verificação da aplicação Discord para uso público

### Steam
- Limite de 100 amigos por requisição na API
- OpenID não fornece email ou dados sensíveis

### Twitch
- App Access Token expira e precisa ser renovado
- Máximo de 100 streams por requisição

---

## Próximos Passos

1. **Criptografia de Tokens**: Implementar criptografia para tokens no banco
2. **Refresh Token**: Adicionar lógica para renovar tokens expirados automaticamente
3. **Webhooks**: Implementar webhooks para atualizações em tempo real
4. **Cache**: Adicionar Redis para cachear resultados de API
5. **Rate Limiting**: Implementar rate limiting nas rotas da API
6. **UI Settings**: Criar página de configurações para gerenciar conexões sociais

---

## Troubleshooting

### Discord: "Invalid OAuth2 redirect_uri"
- Verifique se a URI está exatamente igual no Discord Developer Portal
- Certifique-se de que está usando HTTP (não HTTPS) em desenvolvimento

### Steam: "Invalid OpenID response"
- Verifique se o `STEAM_REALM` está correto
- Certifique-se de que a API Key está ativa

### Twitch: "Invalid Client ID"
- Verifique se o Client ID está correto
- Certifique-se de que o App Access Token não expirou

### Tokens Expirados
- Se receber erro 401, o usuário precisa reconectar a conta
- Frontend automaticamente redireciona para página de configurações

---

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs do servidor
2. Confira se todas as variáveis de ambiente estão configuradas
3. Teste as APIs diretamente usando Postman/Insomnia
4. Consulte a documentação oficial de cada plataforma
