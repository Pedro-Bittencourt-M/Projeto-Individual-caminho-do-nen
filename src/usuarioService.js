var usuarioModel = require("./models/usuarioModel");
var crypto = require("node:crypto");
var derivarHash = require("node:util").promisify(crypto.scrypt);

async function cadastrar(nome, email, senha, motivo) {
    var sal = crypto.randomBytes(16).toString("hex");
    var hash = await derivarHash(senha, sal, 64);
    var senhaHash = sal + ":" + hash.toString("hex");

    for (var tentativa = 1; tentativa <= 5; tentativa++) {
        var codigoLicenca = crypto.randomBytes(4).toString("hex").toUpperCase();

        try {
            var resultado = await usuarioModel.cadastrar(nome, email, senhaHash, motivo, codigoLicenca);
            return { id: resultado.insertId, name: nome, email: email, reason: motivo, license: codigoLicenca };
        } catch (erro) {
            var licencaDuplicada = erro.code === "ER_DUP_ENTRY" && /codigo_licenca/i.test(erro.sqlMessage || "");
            if (!licencaDuplicada || tentativa === 5) throw erro;
        }
    }
}

async function autenticar(email, senha) {
    var usuarios = await usuarioModel.autenticar(email);
    var usuario = usuarios[0];
    if (!usuario || typeof usuario.senha !== "string" || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(usuario.senha)) {
        return null;
    }

    var [sal, hashSalvo] = usuario.senha.split(":");
    var hash = await derivarHash(senha, sal, 64);
    if (!crypto.timingSafeEqual(hash, Buffer.from(hashSalvo, "hex"))) return null;

    return {
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        reason: usuario.motivo_cadastro,
        license: usuario.codigo_licenca
    };
}

module.exports = {
    autenticar,
    cadastrar
};
