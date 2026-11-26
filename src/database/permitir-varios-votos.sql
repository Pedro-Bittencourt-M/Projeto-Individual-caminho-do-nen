-- Execute uma vez no banco existente criado pelo script original.
USE hunter;

-- Cria o índice comum que mantém o vínculo entre voto e usuário.
ALTER TABLE voto_restricao
    ADD INDEX idx_voto_usuario (fk_usuario),
    DROP INDEX fk_usuario;
