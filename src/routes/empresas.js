var express = require("express");
var roteador = express.Router();

var empresaController = require("../controllers/empresaController");

//Recebendo os dados do html e direcionando para a função cadastrar de usuarioController.js
roteador.post("/cadastrar", function (requisicao, resposta) {
    empresaController.cadastrar(requisicao, resposta);
})

roteador.get("/buscar", function (requisicao, resposta) {
    empresaController.buscarPorCnpj(requisicao, resposta);
});

roteador.get("/buscar/:id", function (requisicao, resposta) {
  empresaController.buscarPorId(requisicao, resposta);
});

roteador.get("/listar", function (requisicao, resposta) {
  empresaController.listar(requisicao, resposta);
});

module.exports = roteador;