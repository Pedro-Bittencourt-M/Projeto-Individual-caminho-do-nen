var express = require("express");
var roteador = express.Router();

var usuarioController = require("../controllers/usuarioController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
roteador.post("/cadastrar", function (requisicao, resposta) {
    usuarioController.cadastrar(requisicao, resposta);
});

roteador.post("/autenticar", function (requisicao, resposta) {
    usuarioController.autenticar(requisicao, resposta);
});

module.exports = roteador;