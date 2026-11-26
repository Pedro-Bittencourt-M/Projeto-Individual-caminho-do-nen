var avisoModel = require("../models/avisoModel");

function listar(requisicao, resposta) {
    avisoModel.listar()
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).send("Nenhum resultado encontrado!");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar os avisos: ", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}

function listarPorUsuario(requisicao, resposta) {
    var idUsuario = requisicao.params.idUsuario;

    avisoModel.listarPorUsuario(idUsuario)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).send("Nenhum resultado encontrado!");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log(
                "Houve um erro ao buscar os avisos: ",
                erro.sqlMessage
            );
            resposta.status(500).json(erro.sqlMessage);
        });
}

function pesquisarDescricao(requisicao, resposta) {
    var descricao = requisicao.params.descricao;

    avisoModel.pesquisarDescricao(descricao)
        .then(function (resultado) {
            if (resultado.length > 0) {
                resposta.status(200).json(resultado);
            } else {
                resposta.status(204).send("Nenhum resultado encontrado!");
            }
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao buscar os avisos: ", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}

function publicar(requisicao, resposta) {
    var titulo = requisicao.body.titulo;
    var descricao = requisicao.body.descricao;
    var idUsuario = requisicao.params.idUsuario;

    if (titulo == undefined) {
        resposta.status(400).send("O título está indefinido!");
    } else if (descricao == undefined) {
        resposta.status(400).send("A descrição está indefinido!");
    } else if (idUsuario == undefined) {
        resposta.status(403).send("O id do usuário está indefinido!");
    } else {
        avisoModel.publicar(titulo, descricao, idUsuario)
            .then(function (resultado) {
                resposta.json(resultado);
            })
            .catch(function (erro) {
                console.log(erro);
                console.log("Houve um erro ao realizar o post: ", erro.sqlMessage);
                resposta.status(500).json(erro.sqlMessage);
            });
    }
}

function editar(requisicao, resposta) {
    var novaDescricao = requisicao.body.descricao;
    var idAviso = requisicao.params.idAviso;

    avisoModel.editar(novaDescricao, idAviso)
        .then(function (resultado) {
            resposta.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao realizar o post: ", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });

}

function deletar(requisicao, resposta) {
    var idAviso = requisicao.params.idAviso;

    avisoModel.deletar(idAviso)
        .then(function (resultado) {
            resposta.json(resultado);
        })
        .catch(function (erro) {
            console.log(erro);
            console.log("Houve um erro ao deletar o post: ", erro.sqlMessage);
            resposta.status(500).json(erro.sqlMessage);
        });
}

module.exports = {
    listar,
    listarPorUsuario,
    pesquisarDescricao,
    publicar,
    editar,
    deletar
};
