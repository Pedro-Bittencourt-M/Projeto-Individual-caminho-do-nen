# Plano de Implementação

Este documento descreve o plano de implementação resultante do modelo de especificação lido em
`modelos/modelo-especificacao.md`. É um plano de alto nível com arquivos esperados, componentes,
fluxo, regras de negócio, decisões técnicas e etapas numeradas com a forma de validar cada uma.

1. Visão Geral

- Objetivo: transformar a especificação em um conjunto organizado de entregas que cubram backend,
  frontend, persistência, integrações e testes. Não implementa nada; apenas descreve o trabalho.

2. Arquivos a serem criados ou alterados

Observação: caminhos relativos sugeridos; ajuste conforme repositório/projeto.

- Documentação e especificação
  - `docs/plano-implementacao.md` (esta cópia)
  - `docs/README.md` (referência para o time)

- Backend
  - `api/src/index.(ts|js)` - ponto de entrada da API
  - `api/src/routes/*.ts` - arquivos de rotas / controllers por recurso
  - `api/src/services/*.ts` - lógica de domínio
  - `api/src/models/*.ts` - modelos / mapeamento para DB
  - `api/src/validators/*.ts` - validações de entrada
  - `api/test/*.spec.ts` - testes unitários e integração

- Frontend
  - `frontend/src/pages/*.tsx` - telas principais (lista, detalhe, formulário)
  - `frontend/src/components/*.tsx` - componentes reutilizáveis
  - `frontend/src/services/api.ts` - cliente HTTP para a API
  - `frontend/src/styles/*` - estilos e temas
  - `frontend/test/*` - testes de componentes

- Infra / DevOps
  - `infra/docker-compose.yml` - composição de desenvolvimento (app + db)
  - `infra/Dockerfile.*` - imagens para serviço(s)
  - `infra/ci.yml` - pipeline CI (build, lint, test)
  - `infra/migrations/*` - scripts de migração de banco

3. Componentes

- API (Backend)
  - Expondo endpoints REST (ou GraphQL) que atendam às funcionalidades do escopo.
  - Responsável por autenticação, validação, regras de negócio e persistência.

- Banco de Dados
  - Modelo relacional (Postgres) ou NoSQL conforme regra de dados.
  - Migrações e seeders para ambiente de desenvolvimento.

- Frontend (Single Page App)
  - Telas para CRUD, filtros, buscas, e mensagens de erro/validação.

- Autenticação/Autorização
  - Mecanismo JWT ou session-based conforme decisão técnica abaixo.

- Infraestrutura / CI
  - Build, teste automático, lint, deploy em staging e produção.

4. Fluxo (end-to-end)

1. Usuário interage com a interface (formulário/lista).
2. Frontend valida entradas básicas e chama a API.
3. API valida regras de negócio e chama serviços de persistência.
4. Banco persiste ou atualiza os registros.
5. API retorna status e dados; frontend apresenta feedback (sucesso/erro).

5. Regras de negócio (genéricas, derivadas do modelo)

- Campos obrigatórios: qualquer campo marcado como obrigatório na especificação deverá ser
  validado no frontend (UX) e no backend (segurança).
- Unicidade: evitar dados duplicados (por exemplo, campos que precisem ser únicos devem
  ter restrição no DB e checagem anterior no serviço).
- Validações de edição/exclusão: somente permitir editar/excluir quando condições específicas
  forem atendidas (ex.: status, relacionamentos dependentes).

6. Decisões técnicas (propostas)

- Linguagens e frameworks
  - Backend: Node.js + TypeScript com framework leve (Express, Fastify ou NestJS dependendo do
    tamanho do projeto). Recomendo Express/Fastify para simplicidade; NestJS se for projetar uma
    API grande e com modularidade desde o início.
  - Frontend: React + TypeScript (Vite ou Create React App). Uso de component library depende do
    design system disponível; caso contrário, usar TailwindCSS para produtividade.

- Banco de dados
  - Preferir Postgres para garantias relacionais e facilidade de migração. Se o domínio for
    document-oriented, considerar MongoDB.

- Autenticação
  - JWT com refresh tokens para APIs REST; usar HTTPS e armazenar refresh tokens de forma segura.

- Testes
  - Unitários para serviços e componentes.
  - Testes de integração para endpoints principais.

- Observabilidade
  - Logs estruturados no backend; métricas e health-checks.

- CI/CD
  - Pipeline que roda lint, testes, build e deploy em staging; aprovação manual para produção.

7. Etapas numeradas com validação

1. Iniciar repositório e estrutura do projeto
   - Ações: criar diretórios `api/`, `frontend/`, `infra/`, `docs/` e arquivos base (`package.json`,
     README).
   - Validação: rodar `npm install` em cada workspace, executar `npm run build` (ou `tsc`) para
     garantir que a estrutura compila sem código de domínio.

2. Definir e aplicar modelo de dados
   - Ações: desenhar o esquema de banco (ERD) e criar scripts de migração iniciais.
   - Validação: aplicar migração em um DB local (docker-compose) e checar tabelas/constraints com
     `psql` ou cliente; adicionar testes de integração que inserem/recuperam dados.

3. Implementar API básica (endpoints CRUD)
   - Ações: criar rotas, controllers e serviços mínimos para os recursos do escopo.
   - Validação: testes de integração que cobrem status 200/201/400/404 e assertions no corpo da
     resposta; usar Postman/Insomnia para validar manualmente.

4. Implementar validações e regras de negócio
   - Ações: adicionar validações no backend e mensagens de erro coerentes; impor unicidade no DB.
   - Validação: testes unitários das regras e tentativa de criar duplicatas no DB (espera-se erro
     controlado). Validar mensagens retornadas pelos endpoints.

5. Implementar autenticação e autorização
   - Ações: endpoints de login, middleware de proteção e verificação de roles/permissions.
   - Validação: casos de uso com token válido e inválido; bloqueio de endpoints sem token; testes
     automatizados que simulam fluxos com diferentes permissões.

6. Implementar frontend (telas principais)
   - Ações: páginas de listagem, detalhe e formulário com validação UX.
   - Validação: testes de componente; e2e simples (Cypress/Playwright) cobrindo criar/editar/remover
     do recurso e verificando mensagens exibidas.

7. Integração completa e testes end-to-end
   - Ações: configurar ambiente integrado (docker-compose) com app + DB; rodar suite e2e.
   - Validação: executar e2e; todos os fluxos do escopo devem passar sem falhas; executar
     testes de carga básicos se aplicável.

8. Infra e CI
   - Ações: criar pipelines que rodem lint, testes, build; preparar imagens Docker e deploy em
     ambiente de staging.
   - Validação: pipeline executa com sucesso; imagem sobe em staging e o healthcheck retorna OK.

9. Documentação e aceitação
   - Ações: preencher `docs/` com instruções de setup, fluxo, exemplos de requests e critérios de
     aceitação mapeados.
   - Validação: checklist de aceitação preenchido; review do time e aprovação do product owner.

10. Preparação para produção
    - Ações: hardening de segurança (CORS, rate-limit, HTTPS), backups, monitoramento e runbooks.
    - Validação: testes de segurança básicos (scans), backup/restore testado e runbook revisado.

8. Critérios de aceitação (exemplos mapeados)

- Critério A: Endpoints principais funcionam conforme especificação — verificado por testes de
  integração e e2e.
- Critério B: Regras de negócio (obrigatoriedade, unicidade, restrições de edição/exclusão)
  implementadas — verificado por testes unitários+integração e casos manuais.
- Critério C: Usuário consegue completar fluxos essenciais na UI — verificado por testes e2e e
  validação manual pelo PO.

9. Riscos e mitigação

- Risco: requisitos incompletos ou ambíguos.
  - Mitigação: workshop de refinamento com stakeholders antes da implementação e prototipagem
    de telas essenciais.
- Risco: escolha de tecnologia desalinhada com a equipe.
  - Mitigação: validar stack com time e prototipar um pequeno POC (1 dia) antes de fixar.

10. Próximos passos imediatos

1. Validar e aprovar este plano com stakeholders.
2. Marcar workshop de refinamento para esclarecer regras de negócio pendentes.
3. Criar tasks/estórias no tracker com as etapas numeradas deste plano.

---

Se desejar, adapto o plano para um formato de checklist no seu tracker (ex.: issues CSV), ou gero
uma versão em inglês. Não vou implementar nada até receber instruções explícitas.
