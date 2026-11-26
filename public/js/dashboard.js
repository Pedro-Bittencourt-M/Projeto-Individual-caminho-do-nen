function desenharGrafico(id, dados, maximo, cor, casasDecimais) {
    var grafico = document.getElementById(id);
    function desenhar() {
        var largura = grafico.clientWidth;
        var altura = grafico.clientHeight;
        if (!largura || !altura) return;

        var escala = window.devicePixelRatio || 1;
        grafico.width = Math.round(largura * escala);
        grafico.height = Math.round(altura * escala);

        var contexto = grafico.getContext("2d");
        contexto.scale(escala, escala);
        var fonte = Math.max(11, Math.min(17, Math.floor(largura / 23)));
        var esquerda = Math.round(largura * .43);
        var larguraBarra = largura - esquerda - 40;
        var intervalo = altura / dados.length;
        var alturaBarra = Math.min(36, intervalo * .52);

        contexto.font = fonte + "px Inter, system-ui, sans-serif";
        contexto.textBaseline = "middle";

        dados.forEach(function (item, indice) {
            var centro = (indice + .5) * intervalo;
            var y = centro - alturaBarra / 2;
            var valor = item[1];

            contexto.fillStyle = "#dce7df";
            contexto.fillText(item[0], 4, centro, esquerda - 10);

            contexto.fillStyle = "#294037";
            contexto.fillRect(esquerda, y, larguraBarra, alturaBarra);
            contexto.fillStyle = cor;
            contexto.fillRect(esquerda, y, larguraBarra * (valor || 0) / maximo, alturaBarra);

            contexto.fillStyle = "#f4efe0";
            contexto.fillText(valor === null ? "—" : valor.toFixed(casasDecimais).replace(".", ","), largura - 34, centro);
        });
    }

    var observador = new ResizeObserver(desenhar);
    observador.observe(grafico);
    desenhar();
}

