const { randomBytes } = require("node:crypto");

const COOKIE = "sessao_hunter";
const DURACAO = 8 * 60 * 60 * 1000;
const sessoes = new Map();

function tokenDaRequisicao(requisicao) {
    if (!requisicao.headers.cookie) return;
    var partes = requisicao.headers.cookie.split(";");
    var prefixo = COOKIE + "=";
    for (var i = 0; i < partes.length; i++) {
        var parte = partes[i].trim();
        if (parte.startsWith(prefixo)) return parte.slice(prefixo.length);
    }
}

function opcoesCookie(requisicao) {
    return { httpOnly: true, sameSite: "lax", secure: requisicao.secure, path: "/" };
}

function iniciar(requisicao, resposta, usuarioId) {
    const agora = Date.now();
    for (const [token, sessao] of sessoes) {
        if (sessao.expiraEm <= agora) sessoes.delete(token);
    }
    sessoes.delete(tokenDaRequisicao(requisicao));
    const token = randomBytes(32).toString("hex");
    sessoes.set(token, { usuarioId, expiraEm: agora + DURACAO });
    var opcoes = opcoesCookie(requisicao);
    opcoes.maxAge = DURACAO;
    resposta.cookie(COOKIE, token, opcoes);
}

function exigir(requisicao, resposta, proximo) {
    const token = tokenDaRequisicao(requisicao);
    const sessao = sessoes.get(token);
    if (!sessao || sessao.expiraEm <= Date.now()) {
        sessoes.delete(token);
        return resposta.status(401).json({ mensagem: "Entre na sua conta Hunter para continuar." });
    }
    requisicao.usuarioHunterId = sessao.usuarioId;
    proximo();
}

function sair(requisicao, resposta) {
    sessoes.delete(tokenDaRequisicao(requisicao));
    resposta.clearCookie(COOKIE, opcoesCookie(requisicao));
    resposta.json({ ok: true });
}

module.exports = { iniciar, exigir, sair };
