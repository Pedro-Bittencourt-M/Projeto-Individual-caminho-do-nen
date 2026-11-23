var express = require("express");
var router = express.Router();
var hunterController = require("../controllers/hunterController");
var sessao = require("../sessaoHunter");

router.use(function (req, res, next) {
    res.set("Cache-Control", "no-store");
    next();
});

router.post("/sair", function (req, res) {
    sessao.sair(req, res);
});
router.use(sessao.exigir);

router.get("/estado", function (req, res, next) {
    Promise.resolve(hunterController.estado(req, res)).catch(next);
});

router.put("/perfil", function (req, res, next) {
    Promise.resolve(hunterController.editarPerfil(req, res)).catch(next);
});

router.post("/nen", function (req, res, next) {
    Promise.resolve(hunterController.salvarNen(req, res)).catch(next);
});

router.put("/voto", function (req, res, next) {
    Promise.resolve(hunterController.salvarVoto(req, res)).catch(next);
});

router.post("/criaturas", function (req, res, next) {
    Promise.resolve(hunterController.registrarCriatura(req, res)).catch(next);
});

router.post("/quizzes/:quiz/tentativas", function (req, res, next) {
    Promise.resolve(hunterController.salvarTentativa(req, res)).catch(next);
});


router.use(function (erro, req, res, next) {
    console.error("Erro na área Hunter:", erro.code || "ERRO_INTERNO");
    if (res.headersSent) {
        return next(erro);
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

    res.status(503).json({ mensagem });
});

module.exports = router;
