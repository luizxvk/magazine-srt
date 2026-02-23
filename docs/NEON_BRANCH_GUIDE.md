# 🌿 Guia: Criar Branch Neon para Nova Comunidade

## Via Console Neon (Recomendado)

1. Acesse https://console.neon.tech
2. Selecione o projeto **rovex-magazine**
3. Clique em **Branches** no menu lateral
4. Clique em **Create branch**
5. Configure:
   - **Name:** `teste-mt-001` (ou o subdomain da comunidade)
   - **Parent branch:** `main` (ou o branch atual de produção)
   - **Include data:** Marque se quiser copiar dados, desmarque para começar limpo
6. Clique em **Create branch**
7. Copie a **Connection string** gerada

## Após Criar o Branch

1. No Vercel, vá em **Settings > Environment Variables** do projeto `teste-mt-001`
2. Adicione/atualize a variável:
   ```
   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
   ```
3. Faça redeploy do projeto

## Via Script (Requer API Key)

```bash
# Defina as variáveis
export NEON_API_KEY="seu_api_key_aqui"
export NEON_PROJECT_ID="ID_do_projeto_rovex-magazine"

# Execute o script
cd magazine-srt-react/server
npx tsx scripts/create-neon-branch.ts teste-mt-001
```

## Estrutura de Branches Recomendada

```
main (produção Magazine MGT)
├── teste-mt-001 (comunidade de teste)
├── comunidade-xyz (futura comunidade)
└── comunidade-abc (futura comunidade)
```

## Notas Importantes

- Cada branch tem sua própria connection string
- Branches compartilham o mesmo compute (mais econômico)
- Branches podem ser deletados sem afetar o main
- Para trial/starter, prefira branches ao invés de projects separados

## URLs do Neon

- Console: https://console.neon.tech
- API Docs: https://api-docs.neon.tech/reference/getting-started-with-neon-api
