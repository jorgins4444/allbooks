# Allbooks

Primeira versão do módulo editorial do portal de ebooks de Jorge. Organiza vários nichos, permite escrever e revisar materiais originais, exporta PDFs e prepara a publicação gratuita usando Vercel e Supabase.

## Funciona agora

- Editor responsivo com tema, público, objetivo, autoria, fontes, descrição e capítulos.
- Seis nichos iniciais e inclusão de novos nichos pelo editor.
- Três mini ebooks originais, identificados como rascunhos: IA na rotina, estudo organizado e estoque.
- Criação gratuita de estrutura sem API; instrução copiável para trabalhar o texto no ChatGPT.
- Salvamento local no navegador, importação/exportação de backup JSON e exportação real de PDF.
- Aprovação editorial; alterações invalidam a revisão. Backups importados retornam a rascunho.
- Biblioteca pública que exibe apenas versões efetivamente publicadas no banco.

## Integrações implementadas, aguardando configuração

- Vercel Functions com autenticação Supabase e verificação de editor no servidor.
- Supabase: rascunhos privados, aprovação, controle de versão, catálogo e PDFs em bucket privado.
- Download público somente de ebook publicado, por URL assinada com validade curta.
- Publicação com conferência atômica da versão no banco para impedir corrida com uma edição.
- Adaptador de geração de texto para provedor com API HTTPS de chat completions compatível.
- Limite diário de gerações por editor, reservado atomicamente no banco. Tentativas falhas também contam, pois podem ter consumido recursos do provedor.

Não há credenciais no projeto. O adaptador de IA não pesquisa tendências nem verifica automaticamente as fontes. Conteúdo e referências continuam sujeitos à revisão. Download gratuito para o leitor não significa geração ilimitada sem custo: as condições dependem do provedor conectado.

## Rodar localmente

Requer Node.js 22 ou superior. Não há dependências a instalar para esta versão.

```bash
npm test
npm run build
npm start
```

Abra `http://localhost:3000`. Sem variáveis de ambiente, o editor funciona em modo local e não faz chamadas a IA nem a banco externo. Os rascunhos locais só ficam neste navegador; use Exportar cópia. A sessão editorial, quando conectada, dura até a expiração do token ou encerramento local.

```bash
npm run samples
```

Gera os três PDFs de exemplo em `exports/`, todos marcados como rascunhos para revisão. PDFs usam fontes padrão com suporte aos acentos em português; emojis e caracteres não disponíveis são omitidos nesta versão.

## Conectar ao Supabase

1. Use um projeto dedicado à Allbooks. O arquivo `supabase/schema.sql` é uma configuração inicial, para executar uma vez no SQL Editor. Não é uma migração já aplicada.
2. Crie e confirme seu usuário pelo Supabase Auth.
3. Pelo SQL Editor, conceda acesso editorial, substituindo o endereço abaixo pelo seu e-mail real:

```sql
insert into public.ebook_admins(user_id)
select id from auth.users where email = 'SEU_EMAIL';
```

4. Cadastre `SUPABASE_URL` e `SUPABASE_SECRET_KEY` como variáveis somente de servidor na Vercel. Pode usar a chave secreta moderna do Supabase ou a chave legada service_role. Nunca coloque essas chaves em código público.
5. Publique a aplicação. Use Conectar conta editorial; salve os materiais locais na nuvem um a um, revise e publique.

As tabelas têm RLS habilitado e não concedem acesso direto a anon/authenticated. O backend usa a chave de servidor somente após validar o usuário e conferir sua presença em `ebook_admins`. O catálogo público tem uma rota de leitura limitada a título, autoria, tema e descrição. Nenhuma função usa `user_metadata` como autorização.

## Conectar ao Vercel pelo GitHub

Importe `jorgins4444/allbooks`. Escolha o preset **Other**, diretório raiz do repositório, comando `npm run build` e saída `dist`. O arquivo `vercel.json` já inclui essa configuração e a função de API. Use Node.js 22.

Configure as variáveis descritas em `.env.example`, usando projetos e dados separados para testes e produção. O plano comercial precisa ser adequado à operação; o Hobby da Vercel é destinado a uso pessoal não comercial. Não inclua tokens em commits.

No GitHub, o workflow verifica o projeto e gera os PDFs em cada push e pull request. A publicação pode ser feita pela integração Git da Vercel.

## Habilitar geração remota de texto

Configure no servidor `AI_CHAT_URL` (URL HTTPS completa), `AI_API_KEY` e `AI_MODEL`, conforme a documentação do provedor escolhido. Não existe provedor, assinatura ou cobrança ativada no código por padrão. `AI_DAILY_LIMIT` limita tentativas por editor e dia UTC; `AI_MAX_OUTPUT_TOKENS` limita a saída solicitada. Esses limites não substituem o controle de gastos da conta do provedor.

O endpoint deve aceitar `model`, `messages`, `temperature` e `max_tokens`, e retornar `choices[0].message.content`. A geração usa timeout e valida o JSON retornado. Provedores com contrato diferente exigem ajuste do adaptador. As fontes e notas inseridas no editor são enviadas ao provedor ao clicar em Gerar texto com IA.

## Estados e comportamento de publicação

`draft → reviewed → published`. Qualquer gravação na nuvem volta o rascunho para `draft`, mesmo se já havia uma versão publicada. A versão pública anterior permanece disponível até uma nova publicação. A aprovação exige confirmação do editor; o servidor valida a estrutura e a versão, mas não pode atestar sozinho a veracidade do texto ou a titularidade dos direitos.

Os arquivos de versões publicadas ficam preservados no bucket. Uma futura rotina de retenção poderá remover versões substituídas. PDFs já baixados não podem ser revogados. A publicação gratuita não concede automaticamente licença de revenda, adaptação ou redistribuição a terceiros.

## O restante do negócio

Comparador de ofertas afiliadas, checkout de ebooks pagos, comissões, e-mails e agenda de atualização são etapas seguintes do portal. Não estão ativados nesta versão editorial e dependem de parceiros, credenciais e contratos. O plano de negócio acompanha a entrega separadamente.

## Validação

`npm test` verifica PDF, campos, conteúdo dos exemplos, rejeição de chamadas administrativas sem token e catálogo sem dados fictícios. As integrações remotas precisam passar por teste real após a configuração: login, isolamento de acesso, revisão, edição concorrente, publicação e download. A migração e o provedor de IA não foram executados em produção nesta entrega.

Biblioteca incorporada: **pdf-lib 1.17.1**, distribuída sob MIT em `public/vendor/pdf-lib-LICENSE.md`. As demais partes foram escritas para este projeto.
