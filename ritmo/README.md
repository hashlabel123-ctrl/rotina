# 🌱 Ritmo

App para organizar a rotina: tarefas, 3 prioridades, hábitos, rotinas guiadas, foco (Pomodoro), metas, diário, revisão semanal, estatísticas, uma planta que cresce com você e **notificações no celular**.

Tudo roda de graça: Vercel (plano Hobby), Upstash Redis (plano gratuito) e cron-job.org.

---

## Passo a passo (uns 30 minutos, sem programar)

### 1. Subir no GitHub
1. Descompacte o zip no computador.
2. No GitHub, clique em **New repository**. Dê o nome `ritmo` e marque **Private**.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Arraste **o conteúdo** da pasta `ritmo` (as pastas `api`, `lib`, `public` e os arquivos `package.json`, `package-lock.json`, `vercel.json`, `README.md`, `.gitignore`). Não arraste a pasta `node_modules` se ela existir.
5. Clique em **Commit changes**.

### 2. Publicar na Vercel
1. Entre em vercel.com com a sua conta do GitHub.
2. **Add New → Project**, escolha o repositório `ritmo` e clique em **Import**.
3. Em *Framework Preset*, deixe **Other**. Não mude mais nada e clique em **Deploy**.
4. Quando terminar, anote o endereço do app (algo como `https://ritmo-xxxx.vercel.app`).

### 3. Conectar o banco de dados
1. No projeto da Vercel, abra a aba **Storage** (ou **Marketplace**).
2. Escolha **Upstash → Redis**, crie um banco no plano gratuito (região mais próxima: São Paulo, se houver) e conecte ao projeto `ritmo`.
3. A Vercel cria sozinha as variáveis do banco.

### 4. Gerar as chaves de notificação
1. Abra no navegador: `https://SEU-APP.vercel.app/api/setup`
2. A página mostra uma tabela com **VAPID_PUBLIC_KEY**, **VAPID_PRIVATE_KEY**, **VAPID_SUBJECT** e **CRON_SECRET**. Guarde a página aberta: os valores mudam se você recarregar.
3. Na Vercel: **Settings → Environment Variables**. Crie uma variável para cada linha (nome e valor). Em VAPID_SUBJECT, coloque `mailto:` seguido do seu e-mail.
4. Vá em **Deployments**, clique nos três pontinhos do último deploy e em **Redeploy**.
5. Abra `/api/setup` de novo: os três itens devem aparecer com ✓ pronto.

> Guarde o valor de **CRON_SECRET**: você vai usar no próximo passo.

### 5. Ligar o "relógio" que envia os avisos
O agendador gratuito da Vercel só roda uma vez por dia, então usamos o cron-job.org (grátis):
1. Crie uma conta em cron-job.org e clique em **Create cronjob**.
2. URL: `https://SEU-APP.vercel.app/api/tick?key=SEU_CRON_SECRET`
3. Execução: **a cada 5 minutos**. Salve.
4. Use **Test run**: a resposta deve começar com `{"ok":true`.

### 6. Instalar no celular
**Antes:** no Ritmo antigo (o do Claude), vá em **Mais → Ajustes → Fazer backup** e salve o arquivo.

**iPhone (iOS 16.4 ou mais novo):**
1. Abra o endereço do app no **Safari**.
2. Toque em **Compartilhar → Adicionar à Tela de Início**.
3. Abra o Ritmo **pelo ícone novo** (não pelo Safari).
4. **Ajustes → Restaurar backup** e escolha o arquivo.
5. **Ajustes → Ativar notificações → Permitir**.
6. Toque em **Enviar teste**.

**Android:**
1. Abra o endereço no **Chrome** e toque em **Instalar app** (ou ⋮ → **Adicionar à tela inicial**).
2. Abra pelo ícone, restaure o backup e ative as notificações em Ajustes.
3. Toque em **Enviar teste**.

---

## Que avisos o Ritmo manda
Tudo é configurável em **Ajustes → Notificações**:
- **Tarefas com horário**: na hora, 10 ou 30 minutos antes.
- **Cobrança do dia** (padrão 20h): lista as tarefas pendentes e os hábitos que faltam. Se estiver tudo feito, não manda nada.
- **Check-in da manhã** (padrão 8h): só se você ainda não fez o check-in.
- **Revisão de domingo** (padrão 18h): só se a revisão da semana ainda não foi feita.

Os avisos chegam com até 5 minutos de diferença, por causa do intervalo do cron-job.org.

## Bom saber
- **Seus dados ficam no celular.** O servidor só recebe o necessário para avisar: o título e o horário dos lembretes dos próximos 14 dias. Faça backup de vez em quando em Ajustes.
- **Abra o app pelo menos a cada duas semanas**, para ele renovar a agenda de lembretes (ele atualiza sozinho sempre que você usa).
- No iPhone, o app instalado e o Safari guardam dados separados. Use sempre o ícone da tela de início.

## Se algo não funcionar
| Problema | O que fazer |
|---|---|
| Ajustes diz "servidor não configurado" | Abra `/api/setup` e veja o que está com ✗. Depois de criar variáveis, sempre faça **Redeploy**. |
| Não aparece a seção Notificações | Abra pelo endereço `https://...vercel.app` (não funciona dentro do Claude). |
| No iPhone o botão não ativa | Confira se abriu pelo ícone da tela de início e se o iOS é 16.4 ou mais novo. |
| "Permissão negada" | Ajustes do celular → Notificações → Ritmo → permitir. |
| O teste chega, mas os lembretes não | Confira o cron-job.org: a URL precisa ter `?key=` com o CRON_SECRET exato, rodando a cada 5 minutos. |

## Estrutura do projeto
```
public/          o app (index.html, service worker, manifesto e ícones)
api/config       diz ao app se o servidor está pronto
api/setup        página de configuração (gera as chaves)
api/subscribe    registra o celular para receber avisos
api/reminders    recebe a agenda de lembretes do app
api/tick         envia os lembretes vencidos (chamado pelo cron-job.org)
api/test         envia uma notificação de teste
api/unsubscribe  desliga as notificações do aparelho
lib/server.js    conexão com o banco e com o serviço de notificações
```
