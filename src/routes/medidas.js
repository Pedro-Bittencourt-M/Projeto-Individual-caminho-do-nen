var express = require("express");
var roteador = express.Router();

var medidaController = require("../controllers/medidaController");

roteador.get("/ultimas/:idAquario", function (requisicao, resposta) {
    medidaController.buscarUltimasMedidas(requisicao, resposta);
});

roteador.get("/tempo-real/:idAquario", function (requisicao, resposta) {
    medidaController.buscarMedidasEmTempoReal(requisicao, resposta);
})

module.exports = roteador;