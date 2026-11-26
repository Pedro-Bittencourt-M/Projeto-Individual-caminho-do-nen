var express = require("express");
var roteador = express.Router();

var aquarioController = require("../controllers/aquarioController");

roteador.get("/:empresaId", function (requisicao, resposta) {
  aquarioController.buscarAquariosPorEmpresa(requisicao, resposta);
});

roteador.post("/cadastrar", function (requisicao, resposta) {
  aquarioController.cadastrar(requisicao, resposta);
})

module.exports = roteador;