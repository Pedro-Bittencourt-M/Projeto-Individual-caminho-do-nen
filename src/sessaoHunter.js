const { randomBytes } = require("node:crypto");

const COOKIE = "sessao_hunter";
const DURACAO = 8 * 60 * 60 * 1000;
const sessoes = new Map();

function tokenDaRequisicao(req) {
    return req.headers.cookie?.split(";").map(parte => parte.trim())
        .find(parte => parte.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
}

function opcoesCookie(req) {
    return { httpOnly: true, sameSite: "lax", secure: req.secure, path: "/" };
}

function iniciar(req, res, usuarioId) {
    const agora = Date.now();
    for (const [token, sessao] of sessoes) {
        if (sessao.expiraEm <= agora) sessoes.delete(token);
    }
    sessoes.delete(tokenDaRequisicao(req));
    const token = randomBytes(32).toString("hex");
    sessoes.set(token, { usuarioId, expiraEm: agora + DURACAO });
    res.cookie(COOKIE, token, { ...opcoesCookie(req), maxAge: DURACAO });
}

function exigir(req, res, next) {
    const token = tokenDaRequisicao(req);
    const sessao = sessoes.get(token);
    if (!sessao || sessao.expiraEm <= Date.now()) {
        sessoes.delete(token);
        return res.status(401).json({ mensagem: "Entre na sua conta Hunter para continuar." });
    }
    req.usuarioHunterId = sessao.usuarioId;
    next();
}

function sair(req, res) {
    sessoes.delete(tokenDaRequisicao(req));
    res.clearCookie(COOKIE, opcoesCookie(req));
    res.json({ ok: true });
}

module.exports = { iniciar, exigir, sair };
