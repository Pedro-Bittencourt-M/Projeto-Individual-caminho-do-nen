var express = require("express");
var roteador = express.Router();

var avisoController = require("../controllers/avisoController");

roteador.get("/listar", function (requisicao, resposta) {
    avisoController.listar(requisicao, resposta);
});

roteador.get("/listar/:idUsuario", function (requisicao, resposta) {
    avisoController.listarPorUsuario(requisicao, resposta);
});

roteador.get("/pesquisar/:descricao", function (requisicao, resposta) {
    avisoController.pesquisarDescricao(requisicao, resposta);
});

roteador.post("/publicar/:idUsuario", function (requisicao, resposta) {
    avisoController.publicar(requisicao, resposta);
});

roteador.put("/editar/:idAviso", function (requisicao, resposta) {
    avisoController.editar(requisicao, resposta);
});

roteador.delete("/deletar/:idAviso", function (requisicao, resposta) {
    avisoController.deletar(requisicao, resposta);
});

module.exports = roteador;