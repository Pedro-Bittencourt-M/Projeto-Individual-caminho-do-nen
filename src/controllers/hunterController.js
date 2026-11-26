var hunterModel = require("../models/hunterModel");
var quizzes = require("../../public/js/quizzes-personagens");

function campo(valor, maximo, obrigatorio = true) {
    if (typeof valor !== "string") return null;
    var texto = valor.trim();
    return texto.length <= maximo && (!obrigatorio || texto.length) ? texto : null;
}

function invalido(resposta2, mensagem) {
    return resposta2.status(400).json({ mensagem });
}

function estado(requisicao, resposta2) {
    return hunterModel.estado(requisicao.usuarioHunterId, requisicao.query.pagina)
        .then(function (dados) {
            if (!dados.hunter) {
                return resposta2.status(401).json({ mensagem: "Conta Hunter não encontrada." });
            }
            return resposta2.json(dados);
        });
}

function editarPerfil(requisicao, resposta2) {
    var dados = requisicao.body || {};
    var nomeVar = campo(dados.name, 100);
    var motivoVar = campo(dados.reason, 500, false);
    if (!nomeVar || motivoVar === null) return invalido(resposta2, "Confira o nome e a motivação.");
    return hunterModel.editarPerfil(requisicao.usuarioHunterId, nomeVar, motivoVar)
        .then(function (resultado) {
            return resposta2.json(resultado);
        });
}

function salvarNen(requisicao, resposta2) {
    var dados = requisicao.body || {};
    var pontuacoes = dados.scores;
    var mensagem = "Conclua as 14 perguntas para salvar seu Nen.";
    if (!Array.isArray(pontuacoes) || pontuacoes.length !== 6) return invalido(resposta2, mensagem);

    var total = 0;
    for (var i = 0; i < pontuacoes.length; i++) {
        var pontos = pontuacoes[i];
        if (!Number.isInteger(pontos) || pontos < 0 || pontos > 14) return invalido(resposta2, mensagem);
        total += pontos;
    }
    if (total !== 14) return invalido(resposta2, mensagem);

    return hunterModel.salvarNen(requisicao.usuarioHunterId, pontuacoes)
        .then(function (resultado) {
            return resposta2.status(201).json(resultado);
        })
        .catch(function (erro) {
            if (erro.code !== "ER_DUP_ENTRY") throw erro;
            return resposta2.status(409).json({ mensagem: "Seu teste de Nen já foi concluído." });
        });
}

function salvarVoto(requisicao, resposta2) {
    var dados = requisicao.body || {};
    var metaVar = campo(dados.goal, 150);
    var restricaoVar = campo(dados.restriction, 300);
    var penalidadeVar = campo(dados.penalty, 300);
    var severidadeVar = dados.severity;
    if (!metaVar || !restricaoVar || !penalidadeVar || !["Leve", "Moderada", "Severa"].includes(severidadeVar)) {
        return invalido(resposta2, "Confira os campos do voto.");
    }
    return hunterModel.salvarVoto(requisicao.usuarioHunterId, { goal: metaVar, restriction: restricaoVar, penalty: penalidadeVar, severity: severidadeVar })
        .then(function (resultado) {
            return resposta2.json(resultado);
        });
}

var categorias = {
    bp: ["Baixo", "Moderado", "Alto", "Extremo"], bev: ["Baixo", "Moderado", "Alto"],
    bt: ["Animal", "Besta mágica", "Quimera", "Outro"], bh: ["Floresta", "Montanha", "Água", "Deserto", "Outro"],
    bo: ["Pequeno", "Médio", "Grande"], bc: ["Dócil", "Territorial", "Agressivo", "Desconhecido"],
    bnn: ["Desconhecida"].concat(hunterModel.tiposNen)
};

function registrarCriatura(requisicao, resposta2) {
    var dados = requisicao.body || {};
    var nomeVar = campo(dados.name, 150, false);
    var descricaoVar = campo(dados.description, 600);
    if (nomeVar === null || !descricaoVar) return invalido(resposta2, "Confira os dados da criatura.");

    var criatura = { name: nomeVar || "Criatura sem nome", description: descricaoVar };
    for (var chave in categorias) {
        if (!categorias[chave].includes(dados[chave])) return invalido(resposta2, "Confira os dados da criatura.");
        criatura[chave] = dados[chave];
    }
    return hunterModel.registrarCriatura(requisicao.usuarioHunterId, criatura)
        .then(function (resultado) {
            return resposta2.status(201).json(resultado);
        });
}

function salvarTentativa(requisicao, resposta2) {
    var quiz;
    for (var i = 0; i < quizzes.length; i++) {
        if (quizzes[i].id === requisicao.params.quiz) {
            quiz = quizzes[i];
            break;
        }
    }
    var dados = requisicao.body || {};
    var respostas = dados.respostas;
    var mensagem = "Respostas inválidas para esse quiz.";
    if (!quiz || !Array.isArray(respostas) || respostas.length > quiz.questions.length) {
        return invalido(resposta2, mensagem);
    }

    var acertos = 0;
    for (var indice = 0; indice < respostas.length; indice++) {
        var resposta = respostas[indice];
        if (!Number.isInteger(resposta) || resposta < 0 || resposta >= quiz.questions[indice][1].length) {
            return invalido(resposta2, mensagem);
        }
        if (resposta === 0) acertos++;
    }
    return hunterModel.salvarTentativa(requisicao.usuarioHunterId, quiz.id, acertos, quiz.questions.length)
        .then(function (tentativa) {
            if (tentativa.bloqueio === "nen") {
                return resposta2.status(403).json({ mensagem: "Conclua o teste de Nen primeiro." });
            }
            return resposta2.status(201).json(tentativa);
        });
}

function buscarDashboard(requisicao, resposta2) {
    return hunterModel.buscarDashboard()
        .then(function (resultado) {
            resposta2.json(resultado);
        });
}

module.exports = {
    buscarDashboard,
    estado,
    editarPerfil,
    salvarNen,
    salvarVoto,
    registrarCriatura,
    salvarTentativa
};
