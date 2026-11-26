var usuarioService = require("../usuarioService");
var sessaoHunter = require("../sessaoHunter");

function autenticar(requisicao, resposta) {
    var dados = requisicao.body || {};
    var emailVar = dados.emailServer;
    var senhaVar = dados.senhaServer;

    if (typeof emailVar !== "string" || emailVar == "") {
        resposta.status(400).json({ mensagem: "Informe seu e-mail." });
    } else if (typeof senhaVar !== "string" || senhaVar == "" || senhaVar.length > 128) {
        resposta.status(400).json({ mensagem: "Informe uma senha válida." });
    } else {
        return usuarioService.autenticar(emailVar, senhaVar)
            .then(function (usuario) {
                if (usuario) {
                    sessaoHunter.iniciar(requisicao, resposta, usuario.id);
                    resposta.json(usuario);
                } else {
                    resposta.status(401).json({ mensagem: "E-mail ou senha incorretos." });
                }
            })
            .catch(function (erro) {
                console.error("Falha no login Hunter:", erro.code || "ERRO_INTERNO");
                resposta.status(503).json({ mensagem: "Não foi possível consultar o banco. Tente novamente." });
            });
    }
}

function cadastrar(requisicao, resposta) {
    var dados = requisicao.body || {};
    var nomeVar = dados.nomeServer;
    var emailVar = dados.emailServer;
    var senhaVar = dados.senhaServer;
    var motivoVar = dados.motivoServer;
    var aceiteVar = dados.aceiteServer;

    if (typeof nomeVar !== "string" || nomeVar == "" || nomeVar.length > 100) {
        resposta.status(400).json({ mensagem: "Informe um nome de até 100 caracteres." });
    } else if (typeof emailVar !== "string" || emailVar.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVar)) {
        resposta.status(400).json({ mensagem: "Informe um e-mail válido." });
    } else if (typeof senhaVar !== "string" || senhaVar.length < 8 || senhaVar.length > 70) {
        resposta.status(400).json({ mensagem: "A senha deve ter entre 8 e 70 caracteres." });
    } else if (!/[a-zà-öø-ÿ]/.test(senhaVar) || !/[A-ZÀ-ÖØ-Þ]/.test(senhaVar) ||
        !/[0-9]/.test(senhaVar) || !/[^a-zà-öø-ÿA-ZÀ-ÖØ-Þ0-9\s]/.test(senhaVar)) {
        resposta.status(400).json({ mensagem: "A senha deve ter letra maiúscula, minúscula, número e símbolo." });
    } else if (typeof motivoVar !== "string" || motivoVar.length > 500) {
        resposta.status(400).json({ mensagem: "A motivação deve ter até 500 caracteres." });
    } else if (aceiteVar !== true) {
        resposta.status(400).json({ mensagem: "Aceite os termos do Exame para continuar." });
    } else {
        return usuarioService.cadastrar(nomeVar, emailVar, senhaVar, motivoVar)
            .then(function (usuario) {
                sessaoHunter.iniciar(requisicao, resposta, usuario.id);
                resposta.status(201).json(usuario);
            })
            .catch(function (erro) {
                if (erro.code === "ER_DUP_ENTRY" && !/codigo_licenca/i.test(erro.sqlMessage || "")) {
                    resposta.status(409).json({ mensagem: "Já existe uma conta com esse e-mail." });
                } else {
                    console.error("Falha no cadastro Hunter:", erro.code || "ERRO_INTERNO");
                    resposta.status(503).json({ mensagem: "Não foi possível gravar o cadastro no banco. Tente novamente." });
                }
            });
    }
}

module.exports = {
    autenticar,
    cadastrar
};
