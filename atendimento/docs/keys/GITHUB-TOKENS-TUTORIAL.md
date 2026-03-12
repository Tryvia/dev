# 🔐 TUTORIAL: Tokens de Acesso do GitHub

Este documento explica como criar e configurar tokens de acesso pessoal (PAT) do GitHub para fazer push em repositórios.

---

## 📋 O que é um Token de Acesso Pessoal (PAT)?

Um PAT é uma alternativa à senha que permite autenticar em repositórios do GitHub via linha de comando ou API. É necessário para:
- Push em repositórios privados
- Push em repositórios de outras contas/organizações
- Automações via scripts

---

## 🔗 Link Direto para Criar Token

**Acesse:** https://github.com/settings/tokens

Ou navegue manualmente:
1. GitHub.com → Seu avatar (canto superior direito)
2. **Settings** → **Developer settings** (no final da barra lateral)
3. **Personal access tokens** → **Tokens (classic)**

---

## 📝 Passo a Passo para Criar um Token

### 1. Acessar a página de tokens
- Vá em: https://github.com/settings/tokens
- Clique em **"Generate new token"** → **"Generate new token (classic)"**

### 2. Configurar o token
| Campo | O que preencher |
|-------|-----------------|
| **Note** | Nome descritivo (ex: "Push Atendimento") |
| **Expiration** | Escolha a validade (30 dias, 90 dias, 1 ano ou sem expiração) |
| **Scopes** | Marque **repo** (acesso total a repositórios) |

### 3. Gerar e copiar
- Clique em **"Generate token"**
- ⚠️ **COPIE O TOKEN IMEDIATAMENTE** - Ele só aparece uma vez!
- Guarde em local seguro

---

## ⚙️ Configurar Token no Git Local

### Adicionar novo repositório remoto com token:
```bash
git remote add NOME_REMOTE https://SEU_TOKEN@github.com/USUARIO/REPOSITORIO.git
```

### Atualizar repositório existente com token:
```bash
git remote set-url NOME_REMOTE https://SEU_TOKEN@github.com/USUARIO/REPOSITORIO.git
```

### Exemplo real:
```bash
git remote set-url onjoao https://ghp_xxxx@github.com/OnJoaoclosed/atendimento.git
```

---

## 📁 Repositórios Configurados Neste Projeto

| Remote | Repositório | Status |
|--------|-------------|--------|
| **origin** | supabasedas/atendimento | ✅ Configurado |
| **onjoao** | OnJoaoclosed/atendimento | ✅ Configurado com token |
| **dash** | Onclosedzx/dash | ✅ Configurado com token |

### Verificar remotes configurados:
```bash
git remote -v
```

### Push para repositório específico:
```bash
git push origin main    # Push para supabasedas
git push onjoao main    # Push para OnJoaoclosed
```

### Push para TODOS os repositórios:
```bash
# Use o script criado:
tools\git-push-all.bat
```

---

## 🛡️ Segurança

### ⚠️ IMPORTANTE:
- **Nunca** compartilhe seu token publicamente
- **Nunca** faça commit de arquivos contendo tokens
- Tokens podem ser revogados a qualquer momento em: https://github.com/settings/tokens
- Use tokens com **menor permissão necessária**
- Defina **data de expiração** quando possível

### Se o token vazar:
1. Acesse https://github.com/settings/tokens
2. Clique no token comprometido
3. Clique em **"Delete"**
4. Gere um novo token

---

## 🔄 Renovar Token Expirado

1. Acesse https://github.com/settings/tokens
2. Clique no token expirado
3. Clique em **"Regenerate token"**
4. Copie o novo token
5. Atualize no Git:
```bash
git remote set-url NOME_REMOTE https://NOVO_TOKEN@github.com/USUARIO/REPO.git
```

---

## 🛠️ Ferramentas Disponíveis

Este projeto inclui ferramentas para facilitar o gerenciamento:

| Ferramenta | Localização | Função |
|------------|-------------|--------|
| **Git Manager** | `tools\git-manager.bat` | Menu interativo completo |
| **Push All** | `tools\git-push-all.bat` | Push para todos os remotes |

---

## 📞 Links Úteis

| Recurso | URL |
|---------|-----|
| Criar tokens | https://github.com/settings/tokens |
| Documentação oficial | https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token |
| Gerenciar SSH keys | https://github.com/settings/keys |
| Aplicações OAuth | https://github.com/settings/applications |

---

*Última atualização: Fevereiro 2026*
