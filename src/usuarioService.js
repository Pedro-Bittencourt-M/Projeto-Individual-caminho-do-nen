var usuarioModel = require("./models/usuarioModel");
var criptografia = require("node:crypto");

function cadastrar(nome, email, senha, motivo) {
    function gravar(tentativa) {
        var codigoLicenca = criptografia.randomBytes(4).toString("hex").toUpperCase();
        return usuarioModel.cadastrar(nome, email, senha, motivo, codigoLicenca).then(function (resultado) {
            return { id: resultado.insertId, name: nome, email: email, reason: motivo, license: codigoLicenca };
        }).catch(function (erro) {
            var licencaDuplicada = erro.code === "ER_DUP_ENTRY" && /codigo_licenca/i.test(erro.sqlMessage || "");
            if (licencaDuplicada && tentativa < 5) return gravar(tentativa + 1);
            throw erro;
        });
    }
    return gravar(1);
}

function autenticar(email, senha) {
    return usuarioModel.autenticar(email).then(function (usuarios) {
        var usuario = usuarios[0];
        if (!usuario || usuario.senha !== senha) return null;

        return {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email,
            reason: usuario.motivo_cadastro,
            license: usuario.codigo_licenca
        };
    });
}

module.exports = {
    autenticar,
    cadastrar
};
