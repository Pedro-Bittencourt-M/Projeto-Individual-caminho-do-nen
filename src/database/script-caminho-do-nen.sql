CREATE DATABASE IF NOT EXISTS hunter;
USE hunter;

-- Execute no mesmo MySQL usado pela API do Caminho do Nen.
-- As tabelas existentes e seus registros são preservados.
USE hunter;

CREATE USER 'hunter_user'@'localhost' identified by 'Urubu@100';

GRANT ALL privileges ON hunter.* TO 'hunter_user'@'localhost';

FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    motivo_cadastro VARCHAR(500),
    codigo_licenca VARCHAR(8) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS resultado_nen (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo_dominante VARCHAR(20) CHECK (tipo_dominante IN (
        'Intensificação', 'Transmutação', 'Materialização',
        'Especialização', 'Manipulação', 'Emissão'
    )),
    pontos_intensificacao INT,
    pontos_transmutacao INT,
    pontos_materializacao INT,
    pontos_especializacao INT,
    pontos_manipulacao INT,
    pontos_emissao INT,
    data_resultado DATE,
    fk_usuario INT NOT NULL UNIQUE,
    CONSTRAINT fkResultadoUsuario FOREIGN KEY (fk_usuario)
    REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS voto_restricao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meta VARCHAR(150),
    restricao VARCHAR(300),
    penalidade VARCHAR(300),
    severidade VARCHAR(20) CHECK (severidade IN ('Leve', 'Moderada', 'Severa')),
    fk_usuario INT NOT NULL UNIQUE,
    CONSTRAINT fkVotoUsuario FOREIGN KEY (fk_usuario)
    REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS criatura (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150),
    descricao TEXT,
    categoria VARCHAR(20),
    perigo VARCHAR(20),
    habitat VARCHAR(20),
    porte VARCHAR(20),
    comportamento VARCHAR(20),
    evolucao VARCHAR(20),
    tipo_nen VARCHAR(20),
    fk_usuario INT NOT NULL,
    CONSTRAINT fkCriaturaUsuario FOREIGN KEY (fk_usuario)
    REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS tentativa_quiz (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    quiz VARCHAR(20) NOT NULL,
    acertos SMALLINT UNSIGNED NOT NULL,
    total_perguntas SMALLINT UNSIGNED NOT NULL,
    concluido_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_tentativa_quiz_placar CHECK (total_perguntas > 0 AND acertos <= total_perguntas),
    CONSTRAINT fk_tentativa_quiz_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario(id)
);

-- Se uma tabela antiga estiver com outra estrutura, o SELECT mostra a coluna que falta.
SELECT id, nome, email, senha, motivo_cadastro, codigo_licenca FROM usuario LIMIT 0;
SELECT id, tipo_dominante, pontos_intensificacao, pontos_transmutacao, pontos_materializacao, pontos_especializacao, pontos_manipulacao, pontos_emissao, data_resultado, fk_usuario FROM resultado_nen LIMIT 0;
SELECT id, meta, restricao, penalidade, severidade, fk_usuario FROM voto_restricao LIMIT 0;
SELECT id, nome, descricao, categoria, perigo, habitat, porte, comportamento, evolucao, tipo_nen, fk_usuario FROM criatura LIMIT 0;
SELECT id, fk_usuario, quiz, acertos, total_perguntas, concluido_em FROM tentativa_quiz LIMIT 0;


