var bancoDados = require("../database/config");

function autenticar(email) {
    var instrucaoSql = `
        SELECT id, nome, email, senha, motivo_cadastro, codigo_licenca
        FROM usuario
        WHERE email = ?;
    `;

    return bancoDados.executar(instrucaoSql, [email]);
}

function cadastrar(nome, email, senha, motivo, codigoLicenca) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, email, senha, motivo_cadastro, codigo_licenca)
        VALUES (?, ?, ?, ?, ?);
    `;

    return bancoDados.executar(instrucaoSql, [nome, email, senha, motivo, codigoLicenca]);
}

module.exports = {
    autenticar,
    cadastrar
};
