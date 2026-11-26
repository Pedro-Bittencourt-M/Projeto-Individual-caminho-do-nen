var bancoDados = require("../database/config");

var tiposNen = ["Intensificação", "Transmutação", "Materialização", "Especialização", "Manipulação", "Emissão"];

function perfil(id) {
    var instrucaoSql = `
        SELECT id, nome AS name, email, motivo_cadastro AS reason, codigo_licenca AS license
        FROM usuario
        WHERE id = ?;
    `;
    return bancoDados.executar(instrucaoSql, [id]).then(function (resultado) {
        return resultado[0];
    });
}

function estado(id, pagina) {
    var consultaNen = `
        SELECT tipo_dominante AS tipo, pontos_intensificacao AS intensificacao,
               pontos_transmutacao AS transmutacao, pontos_materializacao AS materializacao,
               pontos_especializacao AS especializacao, pontos_manipulacao AS manipulacao,
               pontos_emissao AS emissao
        FROM resultado_nen
        WHERE fk_usuario = ?;
    `;

    var consultaVoto = `
        SELECT meta AS goal, restricao AS restriction, penalidade AS penalty, severidade AS severity
        FROM voto_restricao
        WHERE fk_usuario = ?
        ORDER BY id DESC;
    `;

    var consultaTentativa = `
        SELECT quiz, MAX(UNIX_TIMESTAMP(concluido_em)) * 1000 AS completedAt
        FROM tentativa_quiz
        WHERE fk_usuario = ?
        GROUP BY quiz;
    `;

    var consultaCriaturas = `
        SELECT c.id, c.nome AS name, c.descricao AS description, c.categoria AS bt,
               c.perigo AS bp, c.habitat AS bh, c.porte AS bo, c.comportamento AS bc,
               c.evolucao AS bev, c.tipo_nen AS bnn, u.nome AS author
        FROM criatura AS c
        JOIN usuario AS u ON u.id = c.fk_usuario
        ORDER BY c.id DESC;
    `;

    var consultaMural = `
        SELECT nome AS name, codigo_licenca AS license
        FROM usuario
        ORDER BY id DESC
        LIMIT 30;
    `;

    return Promise.all([
        perfil(id),
        bancoDados.executar(consultaNen, [id]),
        bancoDados.executar(consultaVoto, [id]),
        bancoDados.executar(consultaTentativa, [id]),
        pagina === "bestiario" ? bancoDados.executar(consultaCriaturas) : [],
        pagina === "inicio" ? bancoDados.executar(consultaMural) : []
    ]).then(function (dados) {
        var hunter = dados[0];
        var resultados = dados[1];
        var votos = dados[2];
        var tentativas = dados[3];
        var criaturas = dados[4];
        var mural = dados[5];
        var nen = resultados[0];
        var resultado = nen ? {
            type: tiposNen.indexOf(nen.tipo),
            scores: [nen.intensificacao, nen.transmutacao, nen.materializacao, nen.especializacao, nen.manipulacao, nen.emissao]
        } : null;
        var ultimaTentativaPorQuiz = {};
        for (var i = 0; i < tentativas.length; i++) {
            var tentativa = tentativas[i];
            ultimaTentativaPorQuiz[tentativa.quiz] = { completedAt: Number(tentativa.completedAt) };
        }
        return { hunter, resultado, votos: votos, criaturas, mural, tentativas: ultimaTentativaPorQuiz };
    });
}

function editarPerfil(id, nome, motivacao) {
    var instrucaoSql = `
        UPDATE usuario
        SET nome = ?, motivo_cadastro = ?
        WHERE id = ?;
    `;
    return bancoDados.executar(instrucaoSql, [nome, motivacao, id]).then(function () {
        return perfil(id);
    });
}

function salvarNen(id, pontuacoes) {
    var tipo2 = 0;
    for (var i = 1; i < pontuacoes.length; i++) {
        if (pontuacoes[i] > pontuacoes[tipo2]) tipo2 = i;
    }
    var instrucaoSql = `
        INSERT INTO resultado_nen (tipo_dominante, pontos_intensificacao, pontos_transmutacao,
            pontos_materializacao, pontos_especializacao, pontos_manipulacao, pontos_emissao,
            data_resultado, fk_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?);
    `;
    return bancoDados.executar(instrucaoSql, [tiposNen[tipo2]].concat(pontuacoes, [id])).then(function () {
        return { type: tipo2, scores: pontuacoes };
    });
}

function salvarVoto(id, voto) {
    var campos = [voto.goal, voto.restriction, voto.penalty, voto.severity];
    var instrucaoSql = `
        INSERT INTO voto_restricao (meta, restricao, penalidade, severidade, fk_usuario)
        VALUES (?, ?, ?, ?, ?);
    `;
    return bancoDados.executar(instrucaoSql, campos.concat([id])).then(function () {
        return voto;
    });
}

function registrarCriatura(id, criatura) {
    var campos = [criatura.name, criatura.description, criatura.bt, criatura.bp, criatura.bh, criatura.bo, criatura.bc, criatura.bev, criatura.bnn];
    var instrucaoSql = `
        INSERT INTO criatura (nome, descricao, categoria, perigo, habitat, porte,
            comportamento, evolucao, tipo_nen, fk_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    return bancoDados.executar(instrucaoSql, campos.concat([id])).then(function (registro) {
        return perfil(id).then(function (hunter) {
            criatura.id = registro.insertId;
            criatura.author = hunter.name;
            return criatura;
        });
    });
}

function salvarTentativa(id, quiz, acertos, total) {
    return bancoDados.executar("SELECT id FROM resultado_nen WHERE fk_usuario = ?", [id])
        .then(function (resultadosNen) {
            if (!resultadosNen[0]) return { bloqueio: "nen" };

            var instrucaoSql = "INSERT INTO tentativa_quiz (fk_usuario, quiz, acertos, total_perguntas) VALUES (?, ?, ?, ?)";
            return bancoDados.executar(instrucaoSql, [id, quiz, acertos, total]).then(function () {
                return { correct: acertos, total: total };
            });
        });
}

function buscarDashboard() {
    var instrucaoSql = `
        SELECT 'usuarios' AS grupo, '' AS nome, COUNT(*) AS valor FROM usuario
        UNION ALL
        SELECT 'nen', tipo_dominante, COUNT(*) FROM resultado_nen GROUP BY tipo_dominante
        UNION ALL
        SELECT 'tentativas', '', COUNT(*) FROM tentativa_quiz
        UNION ALL
        SELECT 'medias', quiz, ROUND(AVG(15.0 * acertos / NULLIF(total_perguntas, 0)), 1)
        FROM tentativa_quiz GROUP BY quiz
        UNION ALL
        SELECT 'perigo', perigo, COUNT(*) FROM criatura GROUP BY perigo;
    `;

    return bancoDados.executar(instrucaoSql);
}

module.exports = {
    buscarDashboard,
    estado,
    editarPerfil,
    salvarNen,
    salvarVoto,
    registrarCriatura,
    salvarTentativa,
    tiposNen
};
