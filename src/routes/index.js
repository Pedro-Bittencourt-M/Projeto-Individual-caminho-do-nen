var express = require("express");
var roteador = express.Router();

roteador.get("/", function (requisicao, resposta) {
    resposta.render("index");
});

module.exports = roteador;