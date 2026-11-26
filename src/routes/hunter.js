var express = require("express");
var roteador = express.Router();
var hunterController = require("../controllers/hunterController");
var sessao = require("../sessaoHunter");

roteador.use(function (requisicao, resposta, proximo) {
    resposta.set("Cache-Control", "no-store");
    proximo();
});

roteador.post("/sair", function (requisicao, resposta) {
    sessao.sair(requisicao, resposta);
});
roteador.use(sessao.exigir);

roteador.get("/dashboard", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.buscarDashboard(requisicao, resposta)).catch(proximo);
});

roteador.get("/estado", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.estado(requisicao, resposta)).catch(proximo);
});

roteador.put("/perfil", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.editarPerfil(requisicao, resposta)).catch(proximo);
});

roteador.post("/nen", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.salvarNen(requisicao, resposta)).catch(proximo);
});

roteador.put("/voto", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.salvarVoto(requisicao, resposta)).catch(proximo);
});

roteador.post("/criaturas", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.registrarCriatura(requisicao, resposta)).catch(proximo);
});

roteador.post("/quizzes/:quiz/tentativas", function (requisicao, resposta, proximo) {
    return Promise.resolve(hunterController.salvarTentativa(requisicao, resposta)).catch(proximo);
});


roteador.use(function (erro, requisicao, resposta, proximo) {
    console.error("Erro na área Hunter:", erro.code || "ERRO_INTERNO");
    if (resposta.headersSent) {
        return proximo(erro);
    }
    var mensagem = "Não foi possível consultar os dados da Área Hunter. Confira o terminal do servidor.";
    if (erro.code === "ER_NO_SUCH_TABLE" || erro.code === "ER_BAD_FIELD_ERROR" || erro.code === "ER_BAD_DB_ERROR") {
        mensagem = "O esquema do banco está incompleto. Execute atualizar-estrutura-hunter.sql no MySQL usado pela API.";
        var mensagemSql = erro.sqlMessage || "";
        var tabelaAusente = mensagemSql.match(/Table '[\w]+\.(usuario|resultado_nen|voto_restricao|criatura|tentativa_quiz)'/i);
        var colunaAusente = mensagemSql.match(/Unknown column '(?:[\w]+\.)?([\w]+)'/i);
        if (tabelaAusente) {
            mensagem = "Falta a tabela " + tabelaAusente[1] + ". " + mensagem;
        } else if (colunaAusente) {
            mensagem = "Falta a coluna " + colunaAusente[1] + ". " + mensagem;
        }
    } else if (erro.code === "ER_ACCESS_DENIED_ERROR" || erro.code === "ER_DBACCESS_DENIED_ERROR") {
        mensagem = "O MySQL recusou o acesso. Confira as credenciais e permissões usadas pela API.";
    } else if (["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "EHOSTUNREACH"].includes(erro.code)) {
        mensagem = "A API não conseguiu conectar ao MySQL. Confira se o banco está ligado e o endereço está correto.";
    }

    resposta.status(503).json({ mensagem });
});

module.exports = roteador;
