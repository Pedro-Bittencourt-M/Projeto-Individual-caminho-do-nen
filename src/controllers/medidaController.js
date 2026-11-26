var medidaModel = require("../models/medidaModel");

function buscarUltimasMedidas(requisicao, resposta) {

    var limite_linhas = 7;

    var idAquario = requisicao.params.idAquario;

    console.log(`Recuperando as ultimas ${limite_linhas} medidas`);

    medidaModel.buscarUltimasMedidas(idAquario, limite_linhas)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).send("Nenhum resultado encontrado!");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}


function buscarMedidasEmTempoReal(requisicao, resposta) {

    var idAquario = requisicao.params.idAquario;

    console.log(`Recuperando medidas em tempo real`);

    medidaModel.buscarMedidasEmTempoReal(idAquario)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).send("Nenhum resultado encontrado!");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar as ultimas medidas.", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    buscarUltimasMedidas,
    buscarMedidasEmTempoReal
};
