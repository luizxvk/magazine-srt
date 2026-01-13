# Configuração Discord OAuth - Passo a Passo

## ⚠️ Problema Atual
Você está recebendo erro porque as variáveis de ambiente do Discord não estão configuradas no Vercel.

## 🔧 Solução Rápida

### 1. Criar Aplicação Discord

1. Acesse: https://discord.com/developers/applications
2. Clique em **"New Application"**
3. Dê um nome: **"Magazine SRT"** (ou outro nome)
4. Aceite os termos e clique em **Create**

### 2. Configurar OAuth2

1. Na sidebar, clique em **"OAuth2"**
2. Em **"Redirects"**, clique em **"Add Redirect"**
3. Cole exatamente esta URL:
   ```
   https://magazine-srt.vercel.app/api/social/discord/callback
   ```
4. Clique em **"Save Changes"**

### 3. Copiar Credenciais

1. Na mesma página (OAuth2 → General)
2. Copie o **CLIENT ID**
3. Clique em **"Reset Secret"** e copie o **CLIENT SECRET** (guarde em lugar seguro!)

### 4. Adicionar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto **magazine-srt**
3. Vá em **Settings** → **Environment Variables**
4. Adicione **3 variáveis**:

| Nome | Valor |
|------|-------|
| `DISCORD_CLIENT_ID` | Cole o CLIENT ID que você copiou |
| `DISCORD_CLIENT_SECRET` | Cole o CLIENT SECRET que você copiou |
| `DISCORD_REDIRECT_URI` | `https://magazine-srt.vercel.app/api/social/discord/callback` |

5. Clique em **"Save"** para cada uma

### 5. Redeploy

1. No Vercel, vá em **Deployments**
2. Clique nos **"..."** do último deployment
3. Clique em **"Redeploy"**
4. Aguarde o deploy terminar (~2 minutos)

### 6. Testar

1. Acesse: https://magazine-srt.vercel.app
2. Vá para a página de Feed
3. No card do Discord, clique em **"Connect Discord"**
4. Autorize a aplicação
5. Você será redirecionado de volta e verá seus amigos!

## 🐛 Se ainda der erro

Verifique os logs no Vercel:
1. No projeto, vá em **Deployments**
2. Clique no deployment ativo
3. Vá em **Functions**
4. Veja os logs em tempo real

Os logs agora mostrarão mensagens detalhadas como:
- `Missing userId in state parameter`
- `Missing authorization code`
- `Discord credentials not configured`

## ✅ Como saber se funcionou

Após conectar, você verá:
- ✅ Lista de amigos do Discord
- ✅ Status online/offline/idle/dnd
- ✅ Avatares coloridos
- ✅ Quantidade de amigos online

## 📝 Notas Importantes

- **Não compartilhe o CLIENT SECRET** - é como uma senha
- As variáveis de ambiente só são aplicadas após redeploy
- O callback URL **deve ser exatamente** o que está no Discord
- O Discord pode levar alguns minutos para propagar mudanças no OAuth2
