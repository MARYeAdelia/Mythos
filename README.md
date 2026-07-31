# Escrivaninha

Um estúdio de escrita para romance longo: a **bible** fica fixa à esquerda
(personagens, cenário, calendário e regras de estilo) e o **manuscrito** à
direita. A cada capítulo, o app monta sozinho o prompt — enquadrando o texto
como ficção literária adulta, injetando a bible, respeitando suas palavras
proibidas / nomes / regras de pronome, e deixando um marcador nas cenas
íntimas para você escrever.

O modelo roda na **OpenRouter** (nuvem, nada instalado na sua máquina). A chave
fica guardada no servidor, numa função serverless da Vercel — nunca no navegador.

---

## O que você precisa

- Uma conta no **GitHub** (mesma que você já usa nos painéis).
- Uma conta na **Vercel**.
- Uma chave da **OpenRouter**: https://openrouter.ai/keys
  (adicione alguns dólares de crédito em https://openrouter.ai/credits)

## Passo a passo (sem terminal)

1. No GitHub, em *Add file → Upload files*, selecione TODOS os arquivos soltos
   E a pasta `api` juntos e arraste de uma vez. A pasta `api` precisa continuar
   sendo uma pasta (ela guarda a função que fala com a IA).
2. Na Vercel: **Add New → Project → Import** o repositório.
3. A Vercel detecta Vite sozinha. Antes de clicar em *Deploy*, abra
   **Environment Variables** e adicione:
   - Nome: `OPENROUTER_API_KEY`
   - Valor: sua chave `sk-or-...`
4. Clique em **Deploy**. Em ~1 minuto o app está no ar.

Sempre que você editar e der *push* no GitHub, a Vercel re-publica sozinha.

## Escolhendo o modelo

No topo do app tem o campo **modelo**. Cole ali o *slug* exato do modelo, como
ele aparece na OpenRouter (confira em https://openrouter.ai/models). Sugestões
que já vêm na lista:

- `thedrummer/cydonia-24b-v4.1` — escrita criativa sem censura, bom para as
  cenas sombrias que costumam travar em outras ferramentas.
- um modelo forte de prosa geral para o resto do capítulo.

> Os slugs mudam com o tempo. Se der erro de "modelo não encontrado", é só
> conferir o nome atual na página de modelos da OpenRouter e colar de novo.

O desenho recomendado é híbrido: um modelo forte para a prosa geral e um
permissivo só para as cenas que emperram.

## Como seus dados são guardados

Projetos, bible e capítulos ficam no **seu navegador** (localStorage) — não vão
para servidor nenhum. Isso é ótimo para privacidade, mas significa que os dados
são daquele navegador/computador. Exporte o que for importante copiando o texto.
Se um dia quiser sincronizar entre máquinas, dá para plugar um banco depois.

## Rodar localmente (opcional)

Precisa do Node instalado e do `vercel dev` para a função `/api` funcionar:

```bash
npm install
npm i -g vercel
vercel dev
```

Crie um `.env.local` a partir do `.env.example` com sua chave.
