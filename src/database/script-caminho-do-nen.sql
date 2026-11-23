CREATE DATABASE IF NOT EXISTS caminho_do_nen;
USE caminho_do_nen;

/* Cadastro dos Hunters */

CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    idade INT,
    motivo_cadastro VARCHAR(500),
    codigo_licenca VARCHAR(8) NOT NULL UNIQUE
);

/* Resultado do quiz de afinidade */

CREATE TABLE resultado_nen (
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

/* Voto e Restrição */

CREATE TABLE voto_restricao (
    id INT PRIMARY KEY AUTO_INCREMENT,
    meta VARCHAR(150),
    restricao VARCHAR(300),
    penalidade VARCHAR(300),
    severidade VARCHAR(20) CHECK (severidade IN ('Leve', 'Moderada', 'Severa')),
    fk_usuario INT NOT NULL UNIQUE,
    CONSTRAINT fkVotoUsuario FOREIGN KEY (fk_usuario)
    REFERENCES usuario(id)
);

/* Registros do bestiário */

CREATE TABLE criatura (
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

/* Consultas para conferir as tabelas */

SELECT id, nome, email, codigo_licenca FROM usuario;
SELECT * FROM resultado_nen;
SELECT * FROM voto_restricao;
SELECT * FROM criatura;

SELECT c.nome AS criatura, c.perigo, u.nome AS hunter
FROM criatura AS c JOIN usuario AS u ON c.fk_usuario = u.id;
