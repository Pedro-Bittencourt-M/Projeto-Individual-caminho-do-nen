<h1 align="center">Caminho do Nen</h1>

<p align="center"><strong>Descubra o seu Nen</strong></p>

<p align="center">
  Projeto individual inspirado em <em>Hunter × Hunter</em>.
  Faça o Exame Hunter, descubra sua afinidade e explore o universo da obra.
</p>

<p align="center">
  <img alt="HTML" src="https://img.shields.io/badge/HTML-E34F26?style=flat-square&logo=html5&logoColor=white">
  <img alt="CSS" src="https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white">
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white">
  <img alt="Chart.js" src="https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white">
</p>

---

## 📑 Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Dashboard](#dashboard)
- [ODS 4 pela visão do visitante](#ods-4-pela-visão-do-visitante)
- [Tecnologias e arquitetura](#tecnologias-e-arquitetura)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Como executar](#como-executar)
- [Cronograma](#cronograma)
- [Créditos](#créditos)

<a id="sobre-o-projeto"></a>

## 🌿 Sobre o projeto

O **Caminho do Nen** é um projeto acadêmico da São Paulo Tech School. Conheci *Hunter × Hunter* durante a pandemia, quando acompanhar as viagens e amizades dos personagens me dava um pouco da sensação de liberdade que eu sentia falta. A obra se tornou meu anime favorito e inspirou a criação do site.

Na página inicial, o visitante conhece os quatro princípios do Nen e explora suas seis categorias em um hexágono interativo. Após se inscrever no **Exame Hunter**, ele recebe uma licença fictícia e pode descobrir sua afinidade de Nen, responder a quizzes e registrar criaturas no Bestiário.

<a id="funcionalidades"></a>

## ✨ Funcionalidades

| Funcionalidade | O que o usuário pode fazer |
| --- | --- |
| 🌐 **Página inicial** | Conhecer o anime, o mangá e os princípios do Nen. |
| 🪪 **Cadastro e login** | Fazer a inscrição no Exame Hunter, receber uma licença e entrar na Área Hunter. |
| 💧 **Teste de Nen** | Responder a 14 perguntas e descobrir sua categoria dominante. O resultado fica salvo no perfil e o teste é feito uma vez por conta. |
| 📝 **Quizzes de personagens** | Testar seus conhecimentos sobre Gon, Killua, Leorio e Kurapika. Cada quiz tem 15 perguntas com quatro alternativas e limite de quatro minutos. |
| 👤 **Perfil Hunter** | Consultar a licença, ver o hexágono de afinidades e editar o nome e a motivação. |
| 🐾 **Bestiário** | Registrar criaturas fictícias, filtrar por tipo ou perigo e ver qual Hunter fez cada registro. |
| ⚖️ **Voto e Restrição** | Definir uma meta, uma restrição, uma penalidade e o nível de severidade. |
| 📊 **Dashboard Hunter** | Consultar indicadores e gráficos preenchidos com dados do MySQL. |

O teste de Nen libera os quizzes de personagens. Ao terminar um quiz, a pessoa vê quantas perguntas acertou e pode repetir aquele mesmo quiz após três horas.

<a id="dashboard"></a>

## 📊 Dashboard

O painel reúne quatro indicadores e três gráficos.

| Indicadores | Gráficos |
| --- | --- |
| Hunters cadastrados | Distribuição dos seis tipos de Nen |
| Testes de Nen concluídos | Média de acertos por quiz, de 0 a 15 |
| Tentativas de quiz | Perigo das criaturas em gráfico de rosca |
| Criaturas registradas | |

<a id="ods-4-pela-visão-do-visitante"></a>

## 🎓 ODS 4 pela visão do visitante

O projeto se relaciona com o **ODS 4 — Educação de Qualidade** por incentivar a aprendizagem informal. O visitante explora um assunto de que gosta no próprio ritmo, lê sobre os tipos de Nen e os personagens e depois testa seus conhecimentos nos quizzes. O placar mostra quantas perguntas ele acertou e ajuda a decidir quais conteúdos revisar. [ONU Brasil — ODS 4](https://brasil.un.org/pt-br/sdgs/4)

<a id="tecnologias-e-arquitetura"></a>

## 🛠️ Tecnologias e arquitetura

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Gráficos | Chart.js |
| Servidor e API | Node.js e Express |
| Banco de dados | MySQL |
| Conexão com o banco | mysql2 |

O navegador chama a API com `fetch`. As rotas encaminham as requisições aos controllers, e os models executam as consultas no MySQL. A API devolve os dados em JSON, e o JavaScript preenche a página.

<a id="estrutura-de-pastas"></a>

## 📁 Estrutura de pastas

```text
Caminho do Nen/
├── public/               Páginas e arquivos exibidos no navegador
│   ├── assets/           Imagens do site
│   ├── css/              Estilos das páginas
│   ├── dashboard/        Páginas da Área Hunter
│   └── js/               Scripts da interface e dos quizzes
├── src/
│   ├── controllers/      Validação e respostas da API
│   ├── database/         Configuração do MySQL e scripts SQL
│   ├── models/           Consultas ao banco
│   └── routes/           Endereços da API
├── app.js                Inicialização do servidor
└── README.md             Documentação do projeto
```

<a id="como-executar"></a>

## ▶️ Como executar

Você precisa de **Node.js**, **npm** e acesso a uma instância do **MySQL**.

1. Na raiz do projeto, instale as dependências.

   ```bash
   npm install
   ```

2. No MySQL, execute o [script de criação do banco](src/database/script-caminho-do-nen.sql). Ele cria o banco `hunter` e as tabelas `usuario`, `resultado_nen`, `voto_restricao`, `criatura` e `tentativa_quiz`.

3. Configure o `.env.dev` na raiz com os dados da sua instância do MySQL.

   ```dotenv
   AMBIENTE_PROCESSO=desenvolvimento
   APP_HOST=localhost
   APP_PORT=3333

   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=hunter
   DB_USER=seu_usuario
   DB_PASSWORD=sua_senha
   ```

4. Inicie o servidor.

   ```bash
   npm start
   ```

5. Abra [http://localhost:3333](http://localhost:3333) ou o endereço indicado no terminal. Faça o cadastro para acessar a Área Hunter.

Para testar a dashboard com dados de exemplo, execute primeiro o [script de usuários fictícios](src/database/inserts-usuarios-hunter.sql) e depois o [script de dados extras](src/database/inserts-extras-hunter.sql).

<a id="cronograma"></a>

## 📅 Cronograma

| Etapa | Entrega |
| --- | --- |
| 1 | Definição do tema, do público e da proposta do site. |
| 2 | Documentação e planejamento das funcionalidades. |
| 3 | Página inicial, conteúdo sobre Nen e página Sobre mim. |
| 4 | Cadastro, login e primeiras telas da Área Hunter. |
| 5 | Integração com o MySQL, quizzes, Bestiário e Dashboard Hunter. |
| 6 | Testes, ajustes e preparação da apresentação. |

<a id="créditos"></a>

## 🏷️ Créditos

**Autor:** Pedro Henrique de Mendonça Bittencourt  
**Instituição:** São Paulo Tech School  
**Base do projeto:** Web Data Viz / AquaTech

Projeto acadêmico de fã, sem fins lucrativos e sem vínculo oficial com a franquia. *Hunter × Hunter* é uma obra de Yoshihiro Togashi publicada pela Shueisha.
