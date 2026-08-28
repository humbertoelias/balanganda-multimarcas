# Balangandã Multimarcas — site oficial

Site institucional e vitrine da **Balangandã Multimarcas**, loja de rua no centro de
Bambuí (MG). Calçados, bolsas, roupas e infantil, com atendimento e venda pelo WhatsApp
e envio para todo o Brasil.

🔗 Instagram: [@balanganda_bambui](https://www.instagram.com/balanganda_bambui/)
📍 Av. Emanuel Dias, 82 — Centro, Bambuí / MG · 38900-000

---

## Como é feito

Site **100% estático** — HTML, CSS e JavaScript puro, sem build, sem dependências e sem
framework. Carrega rápido, é fácil de manter e publica direto na Vercel.

```
index.html          página única com todas as seções
css/style.css       sistema visual (tokens, componentes, responsivo)
js/main.js          interações (preloader, cursor, reveals, filtros, lightbox, parallax)
img/brand/          logotipos, favicon e imagem de compartilhamento
img/produtos/       fotos do acervo da loja, organizadas por categoria
vercel.json         cache e cabeçalhos de segurança
```

## Identidade

- **Cor:** preto profundo + prata líquida, com acento dourado (as ferragens das bolsas)
- **Tipografia:** Cormorant Garamond (títulos) + Jost (texto)
- **Logo:** SVG vetorial inline no hero, com gradiente prata animado

## Como atualizar as fotos

As fotos ficam em `img/produtos/`, nomeadas por categoria:

| Categoria  | Arquivos              |
|------------|-----------------------|
| Tênis      | `tenis-01…09.jpg`     |
| Bolsas     | `bolsas-01…18.jpg`    |
| Rasteiras  | `rasteiras-01…09.jpg` |
| Sandálias  | `sandalias-01…06.jpg` |
| Chinelos   | `chinelos-01…12.jpg`  |
| Roupas     | `roupas-01…09.jpg`    |
| Infantil   | `infantil-01…09.jpg`  |

Para trocar uma foto, basta substituir o arquivo mantendo o nome. Para adicionar peças
novas, duplique um bloco `<button class="tile" …>` no `index.html` (dentro de `#grid`) e
ajuste `data-src`, `data-name`, `data-wa` e `data-cat`.

Recomendado: JPEG com no máximo 1000 px no lado maior (~100 KB).

## Rodar localmente

```bash
python3 -m http.server 5173
```

Depois abra <http://localhost:5173>.

## Publicar

O deploy é automático na Vercel a cada push na branch `main`.
