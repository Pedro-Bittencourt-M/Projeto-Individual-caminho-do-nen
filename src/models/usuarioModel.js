const { randomBytes } = require("node:crypto");
const database = require("../database/config");

async function cadastrar(nome, email, senhaHash, motivo) {
    for (let tentativa = 0; tentativa < 5; tentativa++) {
        const codigoLicenca = randomBytes(4).toString("hex").toUpperCase();

        try {
            const resultado = await database.executar(
                "INSERT INTO usuario (nome, email, senha, motivo_cadastro, codigo_licenca) VALUES (?, ?, ?, ?, ?)",
                [nome, email, senhaHash, motivo, codigoLicenca]
            );
            return {
                id: resultado.insertId,
                name: nome,
                email,
                reason: motivo,
                license: codigoLicenca
            };
        } catch (erro) {
            const licencaDuplicada = erro.code === "ER_DUP_ENTRY" && /codigo_licenca/i.test(erro.sqlMessage || "");
            if (!licencaDuplicada || tentativa === 4) throw erro;
        }
    }
}

async function buscarPorEmail(email) {
    const [usuario] = await database.executar(
        "SELECT id, nome AS name, email, senha AS senhaHash, motivo_cadastro AS reason, codigo_licenca AS license FROM usuario WHERE email = ?",
        [email]
    );
    return usuario;
}

module.exports = { cadastrar, buscarPorEmail };
