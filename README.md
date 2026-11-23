# Caminho do Nen

Caminho do Nen é um projeto individual inspirado em *Hunter × Hunter*. O site apresenta o Nen, o sistema de habilidades da obra, e reúne páginas temáticas sobre seus personagens, criaturas e conceitos.

## O que você encontra no site

- **Início** — introdução ao Nen e seções sobre o anime e o mangá.
- **Sobre mim** — apresentação pessoal do autor.
- **Cadastro e login** — formulários temáticos do Exame Hunter e da Licença Hunter.
- **Área Hunter** — telas de dashboard, perfil, quizzes, personagens, bestiário e Voto e Restrição.

O projeto está em desenvolvimento. Cadastro, sessão, resultados, votos e criaturas ficam no armazenamento local do navegador. A área Hunter é um protótipo local e a sessão não oferece autenticação de servidor. Para obter armazenamento compartilhado entre as páginas, abra o site pelo servidor local. A API e o script SQL ainda usam a estrutura do projeto-base AquaTech.

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

4. Acesse [http://localhost:3333](http://localhost:3333) ou o endereço exibido no terminal.

### Banco de dados da API

Para executar as rotas do projeto-base, rode [`src/database/script-tabelas.sql`](src/database/script-tabelas.sql) em uma instância MySQL local onde o banco `aquatech` ainda não exista. O script cria o banco, as tabelas e os dados iniciais do AquaTech. Acrescente as configurações abaixo ao `.env.dev` e use as credenciais da sua instância.

```dotenv
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=aquatech
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
