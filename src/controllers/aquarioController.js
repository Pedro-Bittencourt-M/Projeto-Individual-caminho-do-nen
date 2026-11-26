var aquarioModel = require("../models/aquarioModel");

function buscarAquariosPorEmpresa(requisicao, resposta) {
    var idUsuario = requisicao.params.idUsuario;

    aquarioModel.buscarAquariosPorEmpresa(idUsuario)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).json([]);
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar os aquarios: ", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}

function cadastrar(requisicao, resposta) {
    var descricao = requisicao.body.descricao;
    var idUsuario = requisicao.body.idUsuario;

    if (descricao == undefined) {
        resposta.status(400).send("descricao está undefined!");
    } else if (idUsuario == undefined) {
        resposta.status(400).send("idUsuario está undefined!");
    } else {

        aquarioModel.cadastrar(descricao, idUsuario)
            .then(function (resultado) {
                resposta.status(201).json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log(
                    "\nHouve um erro ao realizar o cadastro! Erro: ",
                    erro.sqlMessage
                );
                resposta.status(500).json(erro.sqlMessage);
            });
    }
}

module.exports = {
    buscarAquariosPorEmpresa,
    cadastrar
};
