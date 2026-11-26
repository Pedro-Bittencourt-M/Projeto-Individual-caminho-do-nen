-- Caminho do Nen | Instalação local com dados fictícios.
-- Execute uma vez em um banco hunter novo.
CREATE DATABASE IF NOT EXISTS hunter CHARACTER SET utf8mb4;
USE hunter;

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