# Caminho do Nen

Caminho do Nen é um projeto individual inspirado em *Hunter × Hunter*. O site apresenta o Nen, o sistema de habilidades da obra, e reúne páginas temáticas sobre seus personagens, criaturas e conceitos.

## O que você encontra no site

- **Início** — introdução ao Nen e seções sobre o anime e o mangá.
- **Sobre mim** — apresentação pessoal do autor.
- **Cadastro e login** — formulários temáticos do Exame Hunter e da Licença Hunter.
- **Área Hunter** — telas de dashboard, perfil, quizzes, personagens, bestiário e Voto e Restrição.

O cadastro, o login, a edição de perfil, o resultado de Nen, as tentativas dos quizzes, os votos e as criaturas usam a API Node.js e o MySQL. Entre novamente após reiniciar o servidor. O modo de prévia usa dados de teste do navegador e as informações antigas do protótipo local não são enviadas automaticamente ao banco.

## Como executar localmente

Você precisa de Node.js e npm para servir as páginas. O MySQL é necessário para usar as rotas da API que consultam o banco.

1. Na raiz do repositório, instale as dependências.

   ```bash
   npm install
   ```

2. Com `app.js` no modo `desenvolvimento`, configure o arquivo `.env.dev` na raiz. Para abrir as páginas, use as variáveis abaixo. Se o arquivo já existir, ajuste apenas os valores necessários.

   ```dotenv
   AMBIENTE_PROCESSO=desenvolvimento
   APP_HOST=localhost
   APP_PORT=3333
   ```

3. Inicie o servidor.

   ```bash
   npm start
   ```

4. Acesse [http://localhost:3333](http://localhost:3333) ou o endereço exibido no terminal. Abra o cadastro por esse endereço para que o formulário possa enviar os dados à API.

### Banco de dados da API

Configure o banco `hunter` com o esquema de [`src/database/script-caminho-do-nen.sql`](src/database/script-caminho-do-nen.sql). Se o banco já estiver montado, confira se a tabela `usuario` tem as colunas `nome`, `email`, `senha`, `motivo_cadastro` e `codigo_licenca`. Acrescente as configurações abaixo ao `.env.dev` com os dados da sua instância.

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=hunter
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
```

## Tecnologias e estrutura

O frontend usa HTML, CSS e JavaScript. O servidor usa Node.js e Express para servir os arquivos estáticos e expor a API. A configuração vem do dotenv e o acesso ao MySQL usa o driver mysql2.

| Caminho | Conteúdo |
| --- | --- |
| [`app.js`](app.js) | Configuração e inicialização do servidor |
| [`public/`](public/) | Páginas, estilos e imagens do site |
| [`public/dashboard/`](public/dashboard/) | Telas da área Hunter e páginas de referência do AquaTech |
| [`src/routes/`](src/routes/), [`src/controllers/`](src/controllers/) e [`src/models/`](src/models/) | Rotas, tratamento de requisições e consultas da API |
| [`src/database/`](src/database/) | Configuração do MySQL e script de criação do banco |

## Créditos

A estrutura inicial do servidor e da API vem do Web Data Viz, projeto de referência da São Paulo Tech School.
