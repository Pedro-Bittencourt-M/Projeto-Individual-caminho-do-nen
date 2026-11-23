var hunterModel = require("../models/hunterModel");
var quizzes = require("../../public/js/quizzes-personagens");

function campo(valor, maximo, obrigatorio = true) {
    if (typeof valor !== "string") return null;
    var texto = valor.trim();
    return texto.length <= maximo && (!obrigatorio || texto.length) ? texto : null;
}

function invalido(res, mensagem) {
    return res.status(400).json({ mensagem });
}

function estado(req, res) {
    return hunterModel.estado(req.usuarioHunterId, req.query.pagina)
        .then(function (dados) {
            if (!dados.hunter) {
                return res.status(401).json({ mensagem: "Conta Hunter não encontrada." });
            }
            return res.json(dados);
        });
}

function editarPerfil(req, res) {
    var nomeVar = campo(req.body?.name, 100);
    var motivoVar = campo(req.body?.reason, 500, false);
    if (!nomeVar || motivoVar === null) return invalido(res, "Confira o nome e a motivação.");
    return hunterModel.editarPerfil(req.usuarioHunterId, nomeVar, motivoVar)
        .then(function (resultado) {
            return res.json(resultado);
        });
}

function salvarNen(req, res) {
    var pontuacoes = req.body?.scores;
    if (!Array.isArray(pontuacoes) || pontuacoes.length !== 6 || !pontuacoes.every(function (pontos) { return Number.isInteger(pontos) && pontos >= 0 && pontos <= 14; }) ||
        pontuacoes.reduce(function (total, pontos) { return total + pontos; }, 0) !== 14) {
        return invalido(res, "Conclua as 14 perguntas para salvar seu Nen.");
    }
    return hunterModel.salvarNen(req.usuarioHunterId, pontuacoes)
        .then(function (resultado) {
            return res.status(201).json(resultado);
        })
        .catch(function (erro) {
            if (erro.code !== "ER_DUP_ENTRY") throw erro;
            return res.status(409).json({ mensagem: "Seu teste de Nen já foi concluído." });
        });
}

function salvarVoto(req, res) {
    var metaVar = campo(req.body?.goal, 150);
    var restricaoVar = campo(req.body?.restriction, 300);
    var penalidadeVar = campo(req.body?.penalty, 300);
    var severidadeVar = req.body?.severity;
    if (!metaVar || !restricaoVar || !penalidadeVar || !["Leve", "Moderada", "Severa"].includes(severidadeVar)) {
        return invalido(res, "Confira os campos do voto.");
    }
    return hunterModel.salvarVoto(req.usuarioHunterId, { goal: metaVar, restriction: restricaoVar, penalty: penalidadeVar, severity: severidadeVar })
        .then(function (resultado) {
            return res.json(resultado);
        });
}

var categorias = {
    bp: ["Baixo", "Moderado", "Alto", "Extremo"], bev: ["Baixo", "Moderado", "Alto"],
    bt: ["Animal", "Besta mágica", "Quimera", "Outro"], bh: ["Floresta", "Montanha", "Água", "Deserto", "Outro"],
    bo: ["Pequeno", "Médio", "Grande"], bc: ["Dócil", "Territorial", "Agressivo", "Desconhecido"],
    bnn: ["Desconhecida", ...hunterModel.tiposNen]
};

function registrarCriatura(req, res) {
    var dados = req.body || {};
    var nomeVar = campo(dados.name, 150, false);
    var descricaoVar = campo(dados.description, 600);
    if (nomeVar === null || !descricaoVar || !Object.entries(categorias).every(function ([chave, opcoes]) { return opcoes.includes(dados[chave]); })) {
        return invalido(res, "Confira os dados da criatura.");
    }
    var selecoes = Object.fromEntries(Object.keys(categorias).map(function (chave) { return [chave, dados[chave]]; }));
    return hunterModel.registrarCriatura(req.usuarioHunterId, { name: nomeVar || "Criatura sem nome", description: descricaoVar, ...selecoes })
        .then(function (resultado) {
            return res.status(201).json(resultado);
        });
}

function salvarTentativa(req, res) {
    var quiz = quizzes.find(function (item) { return item.id === req.params.quiz; });
    var respostas = req.body?.respostas;
    if (!quiz || !Array.isArray(respostas) || respostas.length > quiz.questions.length ||
        !respostas.every(function (resposta, indice) {
            return Number.isInteger(resposta) && resposta >= 0 && resposta < quiz.questions[indice][1].length;
        })) {
        return invalido(res, "Respostas inválidas para esse quiz.");
    }
    var acertos = respostas.filter(function (resposta) { return resposta === 0; }).length;
    return hunterModel.salvarTentativa(req.usuarioHunterId, quiz.id, acertos, quiz.questions.length)
        .then(function (tentativa) {
            if (tentativa.bloqueio === "nen") {
                return res.status(403).json({ mensagem: "Conclua o teste de Nen primeiro." });
            } else if (tentativa.bloqueio === "tempo") {
                return res.status(409).json({
                    mensagem: "Espere três horas entre tentativas do mesmo quiz.",
                    completedAt: tentativa.completedAt
                });
            }
            return res.status(201).json(tentativa);
        });
}

module.exports = {
    estado,
    editarPerfil,
    salvarNen,
    salvarVoto,
    registrarCriatura,
    salvarTentativa
};
