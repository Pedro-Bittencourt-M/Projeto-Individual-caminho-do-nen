const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const usuarioModel = require("../models/usuarioModel");

const derivarHash = promisify(scrypt);

function lerTexto(valor) {
    return typeof valor === "string" ? valor.trim() : "";
}

async function cadastrar(req, res) {
    const { nomeServer, emailServer, senhaServer, motivoServer, aceiteServer } = req.body || {};
    const nome = lerTexto(nomeServer);
    const email = lerTexto(emailServer).toLowerCase();
    const motivo = lerTexto(motivoServer);

    if (!nome || nome.length > 100 || email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof senhaServer !== "string" || senhaServer.length < 8 || senhaServer.length > 128 ||
        motivo.length > 500 || aceiteServer !== true) {
        return res.status(400).json({ mensagem: "Confira os campos do cadastro e aceite os termos do Exame." });
    }

    try {
        const sal = randomBytes(16).toString("hex");
        const hash = await derivarHash(senhaServer, sal, 64);
        const usuario = await usuarioModel.cadastrar(nome, email, sal + ":" + hash.toString("hex"), motivo);
        return res.status(201).json(usuario);
    } catch (erro) {
        if (erro.code === "ER_DUP_ENTRY" && !/codigo_licenca/i.test(erro.sqlMessage || "")) {
            return res.status(409).json({ mensagem: "Já existe uma conta com esse e-mail." });
        }
        console.error("Falha no cadastro Hunter:", erro.code || "ERRO_INTERNO");
        return res.status(503).json({ mensagem: "Não foi possível gravar o cadastro no banco. Tente novamente." });
    }
}

async function autenticar(req, res) {
    const { emailServer, senhaServer } = req.body || {};
    const email = lerTexto(emailServer).toLowerCase();
    if (!email || email.length > 254 || typeof senhaServer !== "string" || !senhaServer || senhaServer.length > 128) {
        return res.status(400).json({ mensagem: "Informe seu e-mail e senha." });
    }

    try {
        const usuario = await usuarioModel.buscarPorEmail(email);
        const senha = usuario?.senhaHash;
        if (typeof senha !== "string" || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(senha)) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }
        const [sal, hashSalvo] = senha.split(":");
        const hash = await derivarHash(senhaServer, sal, 64);
        if (!timingSafeEqual(hash, Buffer.from(hashSalvo, "hex"))) {
            return res.status(401).json({ mensagem: "E-mail ou senha incorretos." });
        }
        const { senhaHash, ...perfil } = usuario;
        return res.json(perfil);
    } catch (erro) {
        console.error("Falha no login Hunter:", erro.code || "ERRO_INTERNO");
        return res.status(503).json({ mensagem: "Não foi possível consultar o banco. Tente novamente." });
    }
}

module.exports = { cadastrar, autenticar };
