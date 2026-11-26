var mysql = require("mysql2");

// CONEXÃO DO BANCO MYSQL SERVER
var configuracaoMySql = {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
};

function executar(instrucao, parametros = []) {

    if (process.env.AMBIENTE_PROCESSO !== "producao" && process.env.AMBIENTE_PROCESSO !== "desenvolvimento") {
        console.log("\nO AMBIENTE (produção OU desenvolvimento) NÃO FOI DEFINIDO EM .env OU dev.env OU app.js\n");
        return Promise.reject("AMBIENTE NÃO CONFIGURADO EM .env");
    }

    return new Promise(function (resolver, rejeitar) {
        var conexao = mysql.createConnection(configuracaoMySql);
        var executarConsulta = parametros.length ? conexao.execute.bind(conexao) : conexao.query.bind(conexao);
        executarConsulta(instrucao, parametros, function (erro, resultados) {
            conexao.end();
            if (erro) {
                return rejeitar(erro);
            }
            resolver(resultados);
        });
        conexao.on('error', function (erro) {
            return ("ERRO NO MySQL SERVER: ", erro.sqlMessage);
        });
    });
}

function executarEmTransacao(operacao) {
    return Promise.resolve().then(function () {
        var conexao = mysql.createConnection(configuracaoMySql).promise();

        function executarConsulta(sql, parametros) {
            return conexao.execute(sql, parametros).then(function (resultado) {
                return resultado[0];
            });
        }

        return conexao.beginTransaction().then(function () {
            return operacao(executarConsulta);
        }).then(function (resultado) {
            return conexao.commit().then(function () {
                return resultado;
            });
        }).catch(function (erro) {
            return conexao.rollback().then(function () {
                throw erro;
            });
        }).finally(function () {
            return conexao.end();
        });
    });
}

module.exports = { executar, executarEmTransacao };