var empresaModel = require("../models/empresaModel");

function buscarPorCnpj(requisicao, resposta) {
    var cnpj = requisicao.query.cnpj;

    empresaModel.buscarPorCnpj(cnpj)
        .then(function (resultado) {
            resposta.status(200).json(resultado);
        });
}

function listar(requisicao, resposta) {
    empresaModel.listar()
        .then(function (resultado) {
            resposta.status(200).json(resultado);
        });
}

function buscarPorId(requisicao, resposta) {
    var id = requisicao.params.id;

    empresaModel.buscarPorId(id)
        .then(function (resultado) {
            resposta.status(200).json(resultado);
        });
}

function cadastrar(requisicao, resposta) {
    var cnpj = requisicao.body.cnpj;
    var razaoSocial = requisicao.body.razaoSocial;

    empresaModel.buscarPorCnpj(cnpj)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta
                    .status(401)
                    .json({ mensagem: `a empresa com o cnpj ${cnpj} já existe` });
            } else {
                empresaModel.cadastrar(razaoSocial, cnpj)
                    .then(function (resultado) {
                        resposta.status(201).json(resultado);
                    });
            }
        });
}

module.exports = {
    buscarPorCnpj,
    buscarPorId,
    cadastrar,
    listar,
};
