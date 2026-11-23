var database = require("../database/config");

var tiposNen = ["Intensificação", "Transmutação", "Materialização", "Especialização", "Manipulação", "Emissão"];

function perfil(id) {
    var instrucaoSql = `
        SELECT id, nome AS name, email, motivo_cadastro AS reason, codigo_licenca AS license
        FROM usuario
        WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [id]).then(function (resultado) {
        return resultado[0];
    });
}

async function estado(id, pagina) {
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
        WHERE fk_usuario = ?;
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

    var [hunter, resultados, votos, tentativas, criaturas, mural] = await Promise.all([
        perfil(id),
        database.executar(consultaNen, [id]),
        database.executar(consultaVoto, [id]),
        database.executar(consultaTentativa, [id]),
        pagina === "bestiario" ? database.executar(consultaCriaturas) : [],
        pagina === "inicio" ? database.executar(consultaMural) : []
    ]);
    var nen = resultados[0];
    var resultado = nen ? {
        type: tiposNen.indexOf(nen.tipo),
        scores: [nen.intensificacao, nen.transmutacao, nen.materializacao, nen.especializacao, nen.manipulacao, nen.emissao]
    } : null;
    return {
        hunter, resultado, voto: votos[0] || null, criaturas, mural,
        tentativas: Object.fromEntries(tentativas.map(function (tentativa) { return [tentativa.quiz, { completedAt: Number(tentativa.completedAt) }]; }))
    };
}

function editarPerfil(id, name, reason) {
    var instrucaoSql = `
        UPDATE usuario
        SET nome = ?, motivo_cadastro = ?
        WHERE id = ?;
    `;
    return database.executar(instrucaoSql, [name, reason, id]).then(function () {
        return perfil(id);
    });
}

function salvarNen(id, scores) {
    var type = scores.indexOf(Math.max(...scores));
    var instrucaoSql = `
        INSERT INTO resultado_nen (tipo_dominante, pontos_intensificacao, pontos_transmutacao,
            pontos_materializacao, pontos_especializacao, pontos_manipulacao, pontos_emissao,
            data_resultado, fk_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_DATE(), ?);
    `;
    return database.executar(instrucaoSql, [tiposNen[type], ...scores, id]).then(function () {
        return { type, scores };
    });
}

function salvarVoto(id, voto) {
    var campos = [voto.goal, voto.restriction, voto.penalty, voto.severity];
    var instrucaoSql = `
        INSERT INTO voto_restricao (meta, restricao, penalidade, severidade, fk_usuario)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE meta = ?, restricao = ?, penalidade = ?, severidade = ?;
    `;
    return database.executar(instrucaoSql, [...campos, id, ...campos]).then(function () {
        return voto;
    });
}

async function registrarCriatura(id, criatura) {
    var campos = [criatura.name, criatura.description, criatura.bt, criatura.bp, criatura.bh, criatura.bo, criatura.bc, criatura.bev, criatura.bnn];
    var instrucaoSql = `
        INSERT INTO criatura (nome, descricao, categoria, perigo, habitat, porte,
            comportamento, evolucao, tipo_nen, fk_usuario)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    var registro = await database.executar(instrucaoSql, [...campos, id]);
    var hunter = await perfil(id);
    return { ...criatura, id: registro.insertId, author: hunter.name };
}

function salvarTentativa(id, quiz, correct, total) {
    return database.executarEmTransacao(async function (executar) {
        await executar("SELECT id FROM usuario WHERE id = ? FOR UPDATE", [id]);
        var [nen] = await executar("SELECT id FROM resultado_nen WHERE fk_usuario = ?", [id]);
        if (!nen) return { bloqueio: "nen" };

        var [ultima] = await executar("SELECT UNIX_TIMESTAMP(concluido_em) * 1000 AS completedAt, TIMESTAMPDIFF(SECOND, concluido_em, CURRENT_TIMESTAMP) AS segundos FROM tentativa_quiz WHERE fk_usuario = ? AND quiz = ? ORDER BY concluido_em DESC, id DESC LIMIT 1", [id, quiz]);
        if (ultima && ultima.segundos < 10800) return { bloqueio: "tempo", completedAt: Number(ultima.completedAt) };
        var tentativa = await executar("INSERT INTO tentativa_quiz (fk_usuario, quiz, acertos, total_perguntas) VALUES (?, ?, ?, ?)", [id, quiz, correct, total]);
        var [salva] = await executar("SELECT UNIX_TIMESTAMP(concluido_em) * 1000 AS completedAt FROM tentativa_quiz WHERE id = ?", [tentativa.insertId]);
        return { correct, total, completedAt: Number(salva.completedAt) };
    });
}

module.exports = {
    estado,
    editarPerfil,
    salvarNen,
    salvarVoto,
    registrarCriatura,
    salvarTentativa,
    tiposNen
};
