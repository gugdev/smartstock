import { writeFile } from 'node:fs/promises'
import { openapi } from '../server/openapi.js'
const json = JSON.stringify(openapi, null, 2)
await writeFile(new URL('../docs/dia-3/openapi.json', import.meta.url), json + '\n')
// Uma cópia legível do Swagger para consulta sem iniciar a API.
// Os arquivos do Swagger UI são carregados da distribuição pública, em versão fixa.
await writeFile(new URL('../docs/dia-3/swagger.html', import.meta.url), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SmartStock — Documentação da API — Dia 3</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.36.0/swagger-ui.css">
<style>body{margin:0;background:#fafafa}header{padding:24px;font:16px/1.6 system-ui;background:#211b29;color:white}header a{color:#ff8cbd}</style></head>
<body><header><strong>SmartStock / Dia 3 — Aula 8</strong><br>Esta cópia permite consultar as rotas e os modelos sem iniciar o projeto. É necessário acesso à internet para carregar o Swagger UI.<br>Para executar requisições, inicie API e PostgreSQL e abra <a href="http://127.0.0.1:3001/api/docs/">o Swagger local</a>. Esta cópia de consulta não envia requisições.</header>
<div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5.36.0/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({dom_id:'#swagger-ui',spec:${json.replaceAll('<','\\u003c')},supportedSubmitMethods:[],validatorUrl:null});</script></body></html>`)
console.log('OpenAPI e Swagger de consulta exportados em docs/dia-3/.')
