const raizSite = new URL("../", document.currentScript.src);
function read(chave, valorPadrao) {
    try {
        return JSON.parse(localStorage.getItem(chave)) ?? valorPadrao;
    } catch {
        return valorPadrao;
    }
}
function write(chave, value) {
    localStorage.setItem(chave, JSON.stringify(value));
}
const siteLocal = raizSite.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(raizSite.hostname);
const previa = false;
function pageUrl(caminho2) {
    const url = new URL(caminho2, raizSite);
    if (previa) url.searchParams.set("preview", "1");
    return url;
}
const pagina = document.body.dataset.v;
const paginasHunter = ["dashboard", "perfil", "quiz", "voto", "bestiario", "personagens"];

async function apiHunter(caminho, metodo = "GET", dados) {
    let resposta;
    try {
        resposta = await fetch(new URL("hunter/" + caminho, raizSite), {
            method: metodo,
            credentials: "same-origin",
            signal: AbortSignal.timeout(10000),
            ...(dados === undefined ? {} : {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            })
        });
    } catch {
        throw new Error("Não foi possível conectar à API. Confira se o servidor está ligado.");
    }
    const conteudo = await resposta.json().catch(() => null);
    if (!resposta.ok || !conteudo) {
        const erro = new Error(conteudo?.mensagem || "A API não respondeu como esperado.");
        erro.status = resposta.status;
        erro.completedAt = conteudo?.completedAt;
        throw erro;
    }
    return conteudo;
}

async function iniciarPagina() {
    let estado = { hunter: null, resultado: null, voto: null, tentativas: {}, criaturas: [], mural: [] };
    let erroAoConsultar;
    if (!previa && ["http:", "https:"].includes(raizSite.protocol)) {
        try {
            estado = await apiHunter("estado?pagina=" + encodeURIComponent(pagina || ""));
        } catch (erro) {
            if (erro.status !== 401) erroAoConsultar = erro;
        }
    }

    const hunter = previa ? { name: "Hunter de teste", license: "PRÉVIA" } : estado.hunter;
    const contaAtual = "preview";
    if (paginasHunter.includes(pagina)) {
        if (hunter) {
            document.querySelector("main").hidden = false;
        } else if (erroAoConsultar) {
            const aviso = document.createElement("p");
            aviso.className = "cartao";
            aviso.textContent = erroAoConsultar.message;
            document.querySelector("main").before(aviso);
        } else {
            location.replace(new URL("login.html", raizSite));
            return;
        }
    }
    window.addEventListener("pageshow", evento => {
        if (evento.persisted && !previa) location.reload();
    });

    const navegacao = document.querySelector("#nav");
    const ligacoes = [
        ["index.html", "Início"],
        ["sobre.html", "Sobre mim"],
        ["dashboard/personagens.html", "Personagens"],
        ["dashboard/perfil.html", "Perfil"],
        ["dashboard/dashboard.html", "Dashboard"],
        ["dashboard/quiz.html", "Quizzes"],
        ["dashboard/voto.html", "Voto e Restrição"],
        ["dashboard/bestiario.html", "Bestiário"],
        ["cadastro.html", "Cadastro"],
        ["login.html", "Entrar"]
    ];
    navegacao.setAttribute("aria-label", "Navegação principal");
    navegacao.innerHTML = `<b><img src="${new URL("assets/logo.png", raizSite)}" alt="">Caminho do Nen</b>`;
    function navigationLink(url, rotulo) {
        const ligacao = document.createElement("a");
        ligacao.href = pageUrl(url);
        ligacao.textContent = rotulo;
        if (url === "login.html") ligacao.classList.add("botao-destaque");
        if (ligacao.pathname === location.pathname || (url === "index.html" && raizSite.pathname === location.pathname)) {
            ligacao.classList.add("ativo");
            ligacao.setAttribute("aria-current", "page");
        }
        return ligacao;
    }

    if (hunter) {
        navegacao.classList.add("navegacao-hunter");
        navegacao.insertAdjacentHTML("beforeend", `
            <div class="controle-menu-hunter">
                <button type="button" class="botao-menu" aria-label="Menu da área Hunter" aria-controls="hunter-menu" aria-expanded="false">
                    <i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>
                </button>
                <ul class="lista-menu-hunter" id="hunter-menu" hidden></ul>
            </div>
            <div class="controle-perfil">
                <button type="button" class="botao-perfil" aria-label="Opções do perfil" aria-controls="hunter-profile" aria-expanded="false"></button>
                <div class="menu-perfil" id="hunter-profile" hidden><div class="cabecalho-menu-perfil"><b></b></div></div>
            </div>`);

        navegacao.prepend(navegacao.querySelector(".controle-menu-hunter"));
        const menu = navegacao.querySelector("#hunter-menu");
        const perfil = navegacao.querySelector("#hunter-profile");
        const botaoPerfil = navegacao.querySelector(".botao-perfil");
        botaoPerfil.textContent = hunter.name.charAt(0).toUpperCase();
        perfil.querySelector("b").textContent = hunter.name;
        for (const [url, rotulo] of ligacoes) {
            if (!url.startsWith("dashboard/")) continue;
            const ligacao = navigationLink(url, rotulo);
            if (rotulo === "Perfil") {
                perfil.append(ligacao);
            } else {
                const item = document.createElement("li");
                item.append(ligacao);
                menu.append(item);
            }
        }

        const botaoSair = document.createElement("button");
        botaoSair.type = "button";
        botaoSair.textContent = previa ? "Sair da prévia" : "Sair";
        botaoSair.addEventListener("click", async () => {
            try {
                if (!previa) await apiHunter("sair", "POST");
                location.assign(new URL("index.html", raizSite));
            } catch (erro) {
                botaoSair.title = erro.message;
                botaoSair.textContent = "Tentar sair novamente";
            }
        });
        perfil.append(botaoSair);

        function bindDisclosure(botao, painel) {
            function close() {
                painel.hidden = true;
                botao.setAttribute("aria-expanded", "false");
            }
            botao.addEventListener("click", () => {
                if (!painel.hidden) {
                    close();
                    return;
                }
                painel.hidden = false;
                botao.setAttribute("aria-expanded", "true");
            });
            document.addEventListener("click", evento => {
                if (!botao.contains(evento.target) && !painel.contains(evento.target)) close();
            });
            document.addEventListener("keydown", evento => {
                if (evento.key === "Escape" && !painel.hidden) {
                    close();
                    botao.focus();
                }
            });
        }

        bindDisclosure(navegacao.querySelector(".botao-menu"), menu);
        bindDisclosure(botaoPerfil, perfil);
        perfil.addEventListener("click", evento => {
            if (evento.target.closest("a")) {
                perfil.hidden = true;
                botaoPerfil.setAttribute("aria-expanded", "false");
            }
        });
    } else {
        for (const [url, rotulo] of ligacoes) {
            if (!url.startsWith("dashboard/")) navegacao.append(navigationLink(url, rotulo));
        }
    }


    const personagens = [
        ["gon", "Gon Freecss", "Sai da Ilha da Baleia para se tornar Hunter e encontrar seu pai."],
        ["killua", "Killua Zoldyck", "Deixa para trás a vida de assassino e segue sua própria jornada ao lado de Gon."],
        ["kurapika", "Kurapika", "Busca recuperar os olhos escarlates do clã Kurta."],
        ["leorio", "Leorio Paradinight", "Quer se tornar médico e usa o Exame Hunter como caminho para realizar esse objetivo."]
    ];
    const paineis = document.querySelector("#paineis_protagonistas");
    if (paineis && hunter) {
        paineis.closest(".faixa").hidden = false;
        document.querySelector("#etapa_personagens").hidden = false;
    }
    if (paineis && hunter) {
        for (const [arquivoImagem, nome2, descricao] of personagens) {
            paineis.insertAdjacentHTML("beforeend", `<article class="painel-protagonista"><div class="conteudo-protagonista">
                <div class="ilustracao"><img src="${new URL("assets/" + arquivoImagem + ".webp", raizSite)}" alt=""></div>
                <div class="texto-protagonista"><h3>${nome2}</h3><p>${descricao}</p></div>
            </div></article>`);
        }
    }

    const listaPersonagens = document.querySelector("#lista_personagens");
    if (listaPersonagens && hunter) {
        const personagensGaleria = [
            ...personagens,
            ["shizuku", "Shizuku Murasaki", "Integrante da Trupe Fantasma que materializa um aspirador para recolher objetos.", "svg"],
            ["chrollo", "Chrollo Lucilfer", "Líder da Trupe Fantasma. Seu livro de Nen permite usar habilidades que ele rouba de outras pessoas.", "svg"],
            ["hisoka", "Hisoka Morow", "Procura adversários fortes e dá à própria aura propriedades elásticas e adesivas.", "svg"],
            ["meruem", "Meruem", "Rei das Formigas Quimera. Encontra em Komugi uma adversária à altura no jogo de Gungi.", "svg"],
            ["netero", "Isaac Netero", "Presidente da Associação Hunter e mestre de artes marciais com décadas de treinamento em Nen.", "svg"],
            ["zeno", "Zeno Zoldyck", "Avô de Killua e veterano da família Zoldyck, conhecido por dar forma de dragão à sua aura.", "svg"],
            ["illumi", "Illumi Zoldyck", "Irmão mais velho de Killua. Usa agulhas para manipular pessoas e alterar a própria aparência.", "svg"],
            ["feitan", "Feitan Portor", "Integrante da Trupe Fantasma que luta com espada e pode converter a dor que sofre em calor intenso.", "svg"],
            ["ging", "Ging Freecss", "Pai de Gon e Hunter arqueólogo. A busca por ele leva Gon a deixar a Ilha da Baleia.", "svg"],
            ["neferpitou", "Neferpitou", "Integrante da Guarda Real de Meruem. Pode usar Nen para realizar cirurgias e controlar corpos.", "svg"],
            ["youpi", "Menthuthuyoupi", "Conhecido como Youpi, integra a Guarda Real de Meruem e muda a forma do próprio corpo durante as lutas.", "svg"],
            ["shaiapouf", "Shaiapouf", "Integrante da Guarda Real de Meruem que espalha escamas de suas asas e pode dividir o corpo em cópias menores.", "svg"],
            ["mito", "Mito Freecss", "Criou Gon na Ilha da Baleia e o acompanhou até a partida para o Exame Hunter.", "svg"],
            ["kite", "Kite", "Discípulo de Ging que investiga as Formigas Quimera. Sua habilidade Crazy Slots sorteia a arma que ele pode usar.", "svg"],
            ["pariston", "Pariston Hill", "Vice-presidente da Associação Hunter na época de Netero e figura central na eleição para escolher seu sucessor.", "svg"],
            ["silva", "Silva Zoldyck", "Pai de Killua e chefe da família Zoldyck. Atua como assassino ao lado de seu pai, Zeno.", "svg"]
        ];
        for (const [arquivoImagem, nome2, descricao, extensao = "webp"] of personagensGaleria) {
            listaPersonagens.insertAdjacentHTML("beforeend", `<article class="cartao-personagem" tabindex="0"><div class="conteudo-personagem">
                <img src="${new URL("assets/" + arquivoImagem + "." + extensao, raizSite)}" loading="lazy" alt=""><div class="descricao-personagem"><h3>${nome2}</h3><p>${descricao}</p></div>
            </div></article>`);
        }
    }


    const janela = document.querySelector("#modal");
    document.querySelectorAll("[data-open]").forEach(botao => {
        botao.addEventListener("click", () => {
            const conteudo2 = document.getElementById("t-" + botao.dataset.open);
            document.querySelector("#conteudo_janela_informacoes").innerHTML = "";
            document.querySelector("#conteudo_janela_informacoes").append(conteudo2.content.cloneNode(true));
            janela.showModal();
        });
    });

    const coresNen = ["#2c9954", "#8942a1", "#247eaf", "#bd3528", "#dc9119", "#169d89"];
    const pontosHexagono = [[640, 228], [997, 434], [997, 846], [640, 1052], [283, 846], [283, 434]];
    function drawNenArtwork(hexagono, filterId) {
        const imagemHexagono = new URL("assets/hexagono-nen.png", raizSite);
        hexagono.setAttribute("viewBox", "-265 38 1810 1204");


        hexagono.innerHTML = `
            <defs>
                <filter id="${filterId}" color-interpolation-filters="sRGB">
                    <feColorMatrix type="matrix" values="0 0 0 0 0
                                                         0 0 0 0 0
                                                         0 0 0 0 0
                                                         4 4 4 0 -.18" result="mascara"></feColorMatrix>
                    <feComposite in="SourceGraphic" in2="mascara" operator="in"></feComposite>
                </filter>
            </defs>
            <g aria-hidden="true" fill="#fff">
                <path d="M 552 278 L 370 384 M 728 278 L 910 384
                         M 997 534 V 746 M 910 896 L 728 1002
                         M 552 1002 L 370 896 M 283 746 V 534"
                      fill="none" stroke="#fff" stroke-width="33" stroke-linecap="butt"></path>
                <path fill-rule="evenodd"
                      d="M 482 457 H 607 L 628 480 Q 607 541 558 585 H 724
                         Q 660 526 641 453 L 681 446 Q 688 473 698 490
                         L 748 445 L 775 474 L 721 524 L 739 543
                         L 797 493 L 823 523 L 770 571 Q 792 589 829 610
                         L 811 645 Q 781 630 753 609 V 626 H 709 V 676
                         H 805 V 717 H 709 V 773 Q 709 785 719 785 H 766
                         Q 776 785 776 776 V 738 L 817 754 V 778
                         Q 815 827 764 827 H 718 Q 668 827 668 776 V 717
                         H 605 Q 581 798 486 835 L 473 797
                         Q 544 768 563 717 H 472 V 676 H 565 V 626 H 527 V 610
                         Q 499 634 470 650 L 451 616 Q 486 594 517 569
                         L 477 533 L 504 502 L 545 540 Q 563 521 576 498 H 482 Z
                         M 607 626 V 676 H 668 V 626 Z"></path>
            </g>
            <image href="${imagemHexagono}" width="1280" height="1280" filter="url(#${filterId})" aria-hidden="true"></image>`;
    }

    const hexagono = document.querySelector("#hexagono_tipos_nen");
    if (hexagono) {
        const tipos = [
            ["Intensificação", coresNen[0], "Gon", "Reforça o corpo e os objetos. Direto, honesto e determinado.", "A água transborda do copo."],
            ["Transmutação", coresNen[1], "Killua", "Muda as propriedades da aura, como dar a ela características de eletricidade.", "A água muda de sabor."],
            ["Materialização", coresNen[2], "Kurapika", "Cria objetos a partir da aura, como correntes.", "Surgem impurezas na água."],
            ["Especialização", coresNen[3], "Chrollo", "Reúne habilidades fora das outras cinco categorias.", "Ocorre um efeito diferente dos demais."],
            ["Manipulação", coresNen[4], "Illumi", "Permite controlar objetos ou seres vivos.", "A folha se move."],
            ["Emissão", coresNen[5], "Leorio", "Permite projetar a aura e mantê-la longe do corpo.", "A água muda de cor."]
        ];
        const pontos = pontosHexagono;
        const informacoes = document.querySelector("#informacoes_tipo_nen");
        drawNenArtwork(hexagono, "nen-sem-fundo");
        hexagono.setAttribute("role", "group");
        hexagono.setAttribute("aria-label", "Os seis tipos de Nen");

        tipos.forEach(([nome2, cor, exemplo, descricao, efeito], indice) => {
            const [x, y] = pontos[indice];
            const horizontal = Math.sign(x - 640) * 122;
            const posicaoTexto = y + [-122, 16, 16, 155, 16, 16][indice];
            const alinhamento = horizontal === 0 ? "middle" : horizontal > 0 ? "start" : "end";
            hexagono.insertAdjacentHTML("beforeend", `<g class="vertice-nen" role="button" tabindex="0" aria-label="${nome2}" aria-pressed="false">
                <circle cx="${x}" cy="${y}" r="101"></circle>
                <text x="${x + horizontal}" y="${posicaoTexto}" text-anchor="${alinhamento}" aria-hidden="true">${nome2}</text>
            </g>`);
            const vertice = hexagono.lastElementChild;
            const proximo = tipos[(indice + 1) % tipos.length][0];
            const anterior = tipos[(indice + tipos.length - 1) % tipos.length][0];
            const oposto = tipos[(indice + 3) % tipos.length][0];
            function select() {
                const elementoAtivo = hexagono.querySelector(".ativo");
                elementoAtivo?.classList.remove("ativo");
                elementoAtivo?.setAttribute("aria-pressed", "false");
                vertice.classList.add("ativo");
                vertice.setAttribute("aria-pressed", "true");
                informacoes.style.setProperty("--nen-color", cor);
                informacoes.innerHTML = `<h3><span class="etiqueta">${nome2}</span></h3>
                    <p class="texto-secundario">Exemplo: ${exemplo}</p><p>${descricao}</p>
                    <p class="texto-secundario"><strong>Na divinação:</strong> ${efeito}</p>
                    ${indice === 3 ? "" : `<p class="texto-secundario"><strong>Afinidade:</strong> 80% com ${anterior} e ${proximo}; 40% com ${oposto}.</p>`}`;
            }
            vertice.addEventListener("focus", select);
            vertice.addEventListener("pointerenter", select);
            vertice.addEventListener("click", select);
            vertice.addEventListener("keydown", evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    select();
                }
            });
            if (indice === 0) select();
        });
    }

    const get = id => document.getElementById(id);
    const value = id => get(id).value.trim();

    async function solicitarConta(rota, dados) {
        if (raizSite.protocol !== "http:" && raizSite.protocol !== "https:") {
            throw new Error("Abra o site pelo servidor para usar o cadastro ou o login.");
        }

        let resposta;
        try {
            resposta = await fetch(new URL("usuarios/" + rota, raizSite), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dados)
            });
        } catch {
            throw new Error("Não foi possível conectar à API. Confira se o servidor está ligado.");
        }

        const conta = await resposta.json().catch(() => null);
        if (!resposta.ok || !Number.isInteger(conta?.id) || !conta.email) {
            throw new Error(conta?.mensagem || "A API do Caminho do Nen não respondeu como esperado.");
        }
        return conta;
    }

    const ligacaoPrevia = get("link_previa_sem_conta");
    if (ligacaoPrevia && siteLocal) {
        ligacaoPrevia.hidden = false;
    }

    const formularioConta = get("formulario_cadastro") || get("formulario_login");
    if (formularioConta) {
        const cadastrando = formularioConta.id === "formulario_cadastro";
        const mensagemCampo = formularioConta.querySelector("[role=status]");
        const botaoEnviar = formularioConta.querySelector("button[type=submit]");
        function marcarRequisito(id, passou) {
            var requisito = get(id);
            if (passou) {
                requisito.classList.add("valido");
                requisito.querySelector("span").textContent = "✓";
            } else {
                requisito.classList.remove("valido");
                requisito.querySelector("span").textContent = "✕";
            }
        }

        function validarSenha() {
            var senha = get("senha_input").value;
            var tamanho = senha.length >= 8 && senha.length <= 70;
            var minuscula = /[a-zà-öø-ÿ]/.test(senha);
            var maiuscula = /[A-ZÀ-ÖØ-Þ]/.test(senha);
            var numero = /[0-9]/.test(senha);
            var simbolo = /[^a-zà-öø-ÿA-ZÀ-ÖØ-Þ0-9\s]/.test(senha);

            marcarRequisito("senha_tamanho", tamanho);
            marcarRequisito("senha_minuscula", minuscula);
            marcarRequisito("senha_maiuscula", maiuscula);
            marcarRequisito("senha_numero", numero);
            marcarRequisito("senha_simbolo", simbolo);

            return tamanho && minuscula && maiuscula && numero && simbolo;
        }

        if (cadastrando) {
            var senhaInput = get("senha_input");
            var mostrarSenha = get("mostrar_senha");

            senhaInput.addEventListener("input", validarSenha);
            mostrarSenha.addEventListener("click", function () {
                if (senhaInput.type === "password") {
                    senhaInput.type = "text";
                    mostrarSenha.textContent = "Ocultar";
                    mostrarSenha.setAttribute("aria-pressed", "true");
                } else {
                    senhaInput.type = "password";
                    mostrarSenha.textContent = "Mostrar";
                    mostrarSenha.setAttribute("aria-pressed", "false");
                }
            });
            validarSenha();
        }
        formularioConta.addEventListener("submit", async evento => {
            evento.preventDefault();
            botaoEnviar.disabled = true;
            try {
                const email = value("email_input").toLowerCase();
                const senha2 = get("senha_input").value;
                let dados = { emailServer: email, senhaServer: senha2 };
                if (cadastrando) {
                    const nome = value("nome_input");
                    if (!nome) throw new Error("Informe um nome de Hunter.");
                    if (!validarSenha()) throw new Error("A senha precisa atender a todos os requisitos.");
                    if (senha2 !== get("confirmacao_senha_input").value) throw new Error("As senhas precisam ser iguais.");
                    dados = {
                        ...dados,
                        nomeServer: nome,
                        motivoServer: value("motivacao_input"),
                        aceiteServer: get("aceite_input").checked
                    };
                }

                await solicitarConta(cadastrando ? "cadastrar" : "autenticar", dados);
                if (cadastrando) {
                    location.assign(new URL("dashboard/quiz.html", raizSite));
                } else {
                    const dadosConta = await apiHunter("estado");
                    location.assign(new URL(dadosConta.resultado ? "dashboard/perfil.html" : "dashboard/quiz.html", raizSite));
                }
            } catch (erro2) {
                mensagemCampo.textContent = erro2 instanceof TypeError || erro2 instanceof DOMException
                    ? "O navegador bloqueou o armazenamento ou a autenticação. Abra o site pelo servidor local."
                    : erro2.message;
            } finally {
                botaoEnviar.disabled = false;
            }
        });
    }

    function card(title, descricao) {
        const artigo = document.createElement("article");
        artigo.className = "cartao";
        const titulo = document.createElement("h2");
        titulo.textContent = title;
        const detalhes = document.createElement("p");
        detalhes.textContent = descricao;
        artigo.append(titulo, detalhes);
        return artigo;
    }

    const mural = get("mural");
    if (mural && hunter) {
        mural.innerHTML = "";
        mural.append(...(previa ? [hunter] : estado.mural).map(account => card(account.name, "Licença " + account.license)));
    }
    if (mural) mural.closest(".faixa").hidden = !hunter;

    const tiposNen = ["Intensificação", "Transmutação", "Materialização", "Especialização", "Manipulação", "Emissão"];
    function affinityHexagon(dominant) {
        const afinidades = tiposNen.map((_, indice) => {
            const distancia = Math.abs(indice - dominant);
            return 100 - 20 * Math.min(distancia, tiposNen.length - distancia);
        });
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "hexagrama-afinidade");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", tiposNen.map((nome2, indice) => nome2 + " " + afinidades[indice] + "%").join(", "));
        drawNenArtwork(svg, "nen-afinidade-sem-fundo");
        svg.setAttribute("viewBox", "-265 38 1810 1260");
        svg.insertAdjacentHTML("beforeend", pontosHexagono.map(([x, y], indice) => {
            const horizontal = Math.sign(x - 640) * 122;
            const posicaoTexto = y + [-129, -12, -12, 152, -12, -12][indice];
            const alinhamento = horizontal === 0 ? "middle" : horizontal > 0 ? "start" : "end";
            const destaque = indice === dominant
                ? `<circle cx="${x}" cy="${y}" r="102" fill="none" stroke="#ffd34e" stroke-width="12"></circle>`
                : "";
            return `<g aria-hidden="true">${destaque}
                <text x="${x + horizontal}" y="${posicaoTexto}" text-anchor="${alinhamento}">${tiposNen[indice]}
                    <tspan class="porcentagem-afinidade" x="${x + horizontal}" dy="47">${afinidades[indice]}%</tspan>
                </text>
            </g>`;
        }).join(""));
        return svg;
    }


    const chaveResultado = "caminho-do-nen.result." + contaAtual;
    let resultadoNen = previa ? read(chaveResultado, null) : estado.resultado;

    if (hunter && get("dados_perfil_hunter")) {
        const botaoEditar = get("editar-perfil");
        const formulario = get("formulario_perfil");
        const nome2 = get("nome_input");
        const motivacao = get("motivacao_input");
        const mensagemSituacao = get("status-perfil");
        const voto2 = previa ? read("caminho-do-nen.vow." + contaAtual, null) : estado.voto;

        function showProfile() {
            get("licenca-hunter").textContent = hunter.license || "Não informada";
            get("nome-hunter").textContent = hunter.name;
            get("nen-hunter").textContent = tiposNen[resultadoNen?.type] || "não revelado";
            get("motivo-hunter").textContent = hunter.reason || "não informada";
            get("voto-hunter").textContent = voto2?.goal || "nenhum";
            navegacao.querySelector(".botao-perfil").textContent = hunter.name.charAt(0).toUpperCase();
            navegacao.querySelector(".cabecalho-menu-perfil b").textContent = hunter.name;
        }

        nome2.value = hunter.name;
        motivacao.value = hunter.reason || "";
        showProfile();

        botaoEditar.addEventListener("click", () => {
            formulario.hidden = !formulario.hidden;
            botaoEditar.setAttribute("aria-expanded", String(!formulario.hidden));
            if (!formulario.hidden) nome2.focus();
        });

        formulario.addEventListener("submit", async evento => {
            evento.preventDefault();
            const dadosAtualizados = {
                ...hunter,
                name: nome2.value.trim(),
                reason: motivacao.value.trim()
            };
            if (!dadosAtualizados.name) {
                mensagemSituacao.textContent = "Informe um nome de Hunter.";
                nome2.focus();
                return;
            }
            try {
                const salvo = previa ? dadosAtualizados : await apiHunter("perfil", "PUT", { name: dadosAtualizados.name, reason: dadosAtualizados.reason });
                Object.assign(hunter, salvo);
                nome2.value = hunter.name;
                motivacao.value = hunter.reason;
                showProfile();
                mensagemSituacao.textContent = previa ? "Perfil atualizado nesta prévia." : "Perfil salvo.";
            } catch (erro) {
                mensagemSituacao.textContent = erro.message;
            }
        });
    }
    const estatisticas = get("afinidades-hunter");
    if (hunter && estatisticas) {
        if (resultadoNen) {
            const resumo = document.createElement("p");
            resumo.textContent = "Sua afinidade diminui 20 pontos percentuais a cada vértice de distância do tipo dominante.";
            estatisticas.append(resumo, affinityHexagon(resultadoNen.type));
        } else {
            const resumo = document.createElement("p");
            resumo.textContent = "Faça o quiz de Nen para descobrir suas afinidades.";
            const ligacao = navigationLink("dashboard/quiz.html", "Fazer o quiz de Nen");
            ligacao.className = "botao";
            estatisticas.append(resumo, ligacao);
        }
    }

    if (hunter && get("selecao_quizzes")) {
        const perguntas = [
            "Diante de um desafio, o que você prefere?", "O que mais valoriza em uma equipe?",
            "Como se prepara para algo inesperado?", "O que mais orienta suas decisões?",
            "Como gosta de aprender?", "O que faz quando um plano falha?",
            "O que indicaria como seu ponto forte?", "Como enfrenta a pressão?",
            "Que papel assume num grupo?", "O que faz diante de uma situação nova?",
            "O que mais motiva você?", "Como protege algo importante?",
            "Que tipo de habilidade gostaria de treinar?", "Qual estratégia escolheria no Exame Hunter?"
        ];
        const alternativas = ["Persistir e agir de frente", "Mudar de abordagem e improvisar",
            "Preparar uma ferramenta para o problema", "Buscar um caminho fora do comum",
            "Organizar as pessoas e o ambiente", "Agir rapidamente e manter distância"];
        const quizzesConhecimento = quizzesPersonagens.map(quiz => ({ ...quiz }));
        const listaQuizzes = get("selecao_quizzes");
        const areaQuiz = get("area_perguntas_quiz");
        const botaoIniciarNen = get("iniciar-nen");
        const enderecoEstatisticas = pageUrl("dashboard/perfil.html");
        enderecoEstatisticas.hash = "estatisticas";
        get("link-estatisticas").href = enderecoEstatisticas;
        const cartaoNen = botaoIniciarNen.closest(".quiz-obrigatorio");
        const rotuloNen = cartaoNen.querySelector(".rotulo");
        const quizzesConcluidos = get("quizzes-concluidos");
        const listaConcluidos = get("lista-quizzes-concluidos");
        const tempoEspera = 3 * 60 * 60 * 1000;


        const listaDisponiveis = get("lista-quizzes-disponiveis");
        for (const quiz of quizzesConhecimento) {
            quiz.storageKey = "caminho-do-nen.trivia." + contaAtual + "." + quiz.id;
            const item = document.createElement("li");
            item.className = "cartao-etapa";
            item.innerHTML = `<article class="conteudo-etapa conteudo-quiz-personagem">
                <div>
                    <span class="rotulo">Iniciante</span>
                    <h2>${quiz.name}</h2>
                    <p>${quiz.questions.length} perguntas · 4 min</p>
                    <button type="button" aria-label="Começar quiz de ${quiz.name}" aria-describedby="espera-${quiz.id}" disabled>Começar</button>
                    <p id="espera-${quiz.id}">Conclua o teste de Nen para liberar.</p>
                </div>
                <img class="imagem-quiz-personagem" src="${new URL("assets/" + quiz.id + ".webp", raizSite)}" alt="">
            </article>`;
            quiz.button = item.querySelector("button");
            quiz.wait = item.querySelector("p[id]");
            quiz.button.onclick = () => runQuiz(quiz);
            listaDisponiveis.insertBefore(item, get("quiz-arcos"));
        }

        function explainWait(message, tentativa) {
            const tempoRestante = Math.max(0, (tentativa?.completedAt || 0) + tempoEspera - Date.now());
            const minutos = Math.ceil(tempoRestante / 60000);
            const horas = Math.floor(minutos / 60);
            const partes = [horas && horas + " h", minutos % 60 && minutos % 60 + " min"].filter(Boolean);
            const descricao = tempoRestante ? "Disponível em " + partes.join(" ") + "." : "";
            if (message.textContent !== descricao) message.textContent = descricao;
            message.hidden = !tempoRestante;
            return Boolean(tempoRestante);
        }

        function updateQuizList() {
            if (resultadoNen) {
                cartaoNen.classList.add("quiz-concluido");
                rotuloNen.textContent = "Concluído";
                if (cartaoNen.parentElement !== listaConcluidos) {
                    listaConcluidos.append(cartaoNen);
                    quizzesConcluidos.hidden = false;
                }
            }
            botaoIniciarNen.hidden = Boolean(resultadoNen);
            botaoIniciarNen.disabled = Boolean(resultadoNen);
            for (const quiz of quizzesConhecimento) {
                quiz.button.disabled = !resultadoNen || explainWait(quiz.wait, previa ? read(quiz.storageKey, null) : estado.tentativas[quiz.id]);
            }
            get("nen-concluido").hidden = !resultadoNen;
        }
        updateQuizList();
        setInterval(() => {
            if (!listaQuizzes.hidden) updateQuizList();
        }, 1000);

        function runQuiz(quiz) {
            const quizConhecimento = Boolean(quiz);
            if (previa) resultadoNen = read(chaveResultado, resultadoNen);
            updateQuizList();
            if ((quiz ? quiz.button : botaoIniciarNen).disabled) return;
            const total = quiz ? quiz.questions.length : perguntas.length;
            const pontuacoes = tiposNen.map(() => 0);
            const horaLimite = Date.now() + 4 * 60 * 1000;
            const cronometro = document.createElement("span");
            cronometro.className = "tempo-quiz";
            let indice = 0;
            let acertos = 0;
            const respostas = [];
            let intervalo;
            let finalizado = false;
            listaQuizzes.hidden = true;
            areaQuiz.hidden = false;

            async function finish() {
                if (finalizado) return;
                finalizado = true;
                clearInterval(intervalo);
                areaQuiz.innerHTML = "";
                areaQuiz.append(card("Salvando resultado", "Aguarde a confirmação."));
                if (quizConhecimento) {
                    let resumo = indice < total ? "O tempo acabou. Questões sem resposta contam como erro." : "Você respondeu a todas as perguntas.";
                    const resultadoFinal = { correct: acertos, total, completedAt: Date.now() };
                    try {
                        if (previa) {
                            write(quiz.storageKey, resultadoFinal);
                        } else {
                            const salvo = await apiHunter("quizzes/" + quiz.id + "/tentativas", "POST", { respostas });
                            estado.tentativas[quiz.id] = salvo;
                            acertos = salvo.correct;
                        }
                        resumo += " Você pode repetir este quiz em 3 horas.";
                    } catch (erro) {
                        if (erro.completedAt) estado.tentativas[quiz.id] = { completedAt: erro.completedAt };
                        resumo += " " + erro.message;
                    }
                    const faixasPontuacao = [
                        [0, "Leorio", "leorio.webp"],
                        [4, "Gon", "gon.webp"],
                        [7, "Killua", "killua.webp"],
                        [9, "Netero", "netero.svg"],
                        [12, "Meruem", "meruem.svg"]
                    ];
                    const [, personagem, imagem] = faixasPontuacao.findLast(([minimum]) => acertos * 12 >= minimum * total);
                    const cartaoResultado = card("Você acertou " + acertos + " de " + total + " questões", resumo);
                    const recompensa = document.createElement("figure");
                    recompensa.className = "personagem-recompensa";
                    const retrato = document.createElement("img");
                    retrato.src = new URL("assets/" + imagem, raizSite);
                    retrato.alt = personagem;
                    const legenda = document.createElement("figcaption");
                    legenda.textContent = "Personagem da sua faixa de pontuação: " + personagem;
                    recompensa.append(retrato, legenda);
                    cartaoResultado.append(recompensa);
                    areaQuiz.innerHTML = "";
                    areaQuiz.append(cartaoResultado);
                } else {
                    const anterior = previa ? read(chaveResultado, null) : resultadoNen;
                    const tipo = anterior?.type ?? pontuacoes.indexOf(Math.max(...pontuacoes));
                    try {
                        const resultadoFinal = previa ? anterior || { type: tipo, scores: pontuacoes } : await apiHunter("nen", "POST", { scores: pontuacoes });
                        if (previa && !anterior) write(chaveResultado, resultadoFinal);
                        resultadoNen = resultadoFinal;
                        updateQuizList();
                        areaQuiz.innerHTML = "";
                        areaQuiz.append(card("Seu Nen: " + tiposNen[tipo], "Afinidade principal de 100%. Seu tipo de Nen é definitivo. Os quizzes de personagens estão liberados."), affinityHexagon(tipo));
                        const ligacao = navigationLink("dashboard/perfil.html#estatisticas", "Ver estatísticas no perfil");
                        ligacao.className = "botao";
                        areaQuiz.append(ligacao);
                    } catch (erro) {
                        areaQuiz.innerHTML = "";
                        areaQuiz.append(card("Resultado não salvo", erro.message));
                    }
                }
                const botaoVoltar = document.createElement("button");
                botaoVoltar.type = "button";
                botaoVoltar.textContent = "Voltar aos quizzes";
                botaoVoltar.onclick = () => {
                    areaQuiz.hidden = true;
                    listaQuizzes.hidden = false;
                    updateQuizList();
                    const proximo = quizzesConhecimento.find(item => !item.button.disabled)?.button || botaoIniciarNen;
                    (proximo.disabled ? listaQuizzes : proximo).focus();
                };
                areaQuiz.append(botaoVoltar);
                botaoVoltar.focus();
            }

            function updateTimer() {
                const segundos = Math.max(0, Math.ceil((horaLimite - Date.now()) / 1000));
                cronometro.textContent = Math.floor(segundos / 60) + ":" + String(segundos % 60).padStart(2, "0");
                if (!segundos) finish();
            }

            function showQuestion() {
                if (indice === total) {
                    finish();
                    return;
                }
                const pergunta = quizConhecimento ? quiz.questions[indice][0] : perguntas[indice];
                const opcoes = quizConhecimento ? quiz.questions[indice][1] : alternativas;
                const painel = card("Pergunta " + (indice + 1) + " de " + total, pergunta);
                if (quiz) {
                    const cabecalho = document.createElement("div");
                    cabecalho.className = "cabecalho-quiz-personagem";
                    const retrato = document.createElement("img");
                    retrato.src = new URL("assets/" + quiz.id + ".webp", raizSite);
                    retrato.alt = "";
                    cabecalho.append(retrato, quiz.name, cronometro);
                    painel.prepend(cabecalho);
                }
                areaQuiz.innerHTML = "";
                areaQuiz.append(painel);
                opcoes.forEach((_, deslocamento) => {
                    const alternativa = (deslocamento + indice) % opcoes.length;
                    const botao = document.createElement("button");
                    botao.type = "button";
                    botao.className = "opcao-resposta";
                    botao.textContent = opcoes[alternativa];
                    botao.onclick = () => {
                        if (finalizado) return;
                        if (quizConhecimento) {
                            if (Date.now() >= horaLimite) {
                                finish();
                                return;
                            }
                            respostas.push(alternativa);
                            if (alternativa === 0) acertos++;
                        } else {
                            pontuacoes[alternativa]++;
                        }
                        indice++;
                        showQuestion();
                    };
                    areaQuiz.append(botao);
                });
                areaQuiz.querySelector("button").focus();
            }

            showQuestion();
            if (quizConhecimento) {
                intervalo = setInterval(updateTimer, 250);
                updateTimer();
            }
        }
        botaoIniciarNen.onclick = () => runQuiz(null);
    }


    if (hunter && get("area_voto_restricao")) {
        const chave = "caminho-do-nen.vow." + contaAtual;
        const areaQuiz = get("area_voto_restricao");
        areaQuiz.innerHTML = `<form class="cartao">
            <div class="campo">
                <label for="meta_input">Meta</label>
                <input id="meta_input" type="text" placeholder="Ex.: treinar Nen todos os dias" required maxlength="150" />
            </div>
            <div class="campo">
                <label for="restricao_input">Restrição</label>
                <textarea id="restricao_input" required maxlength="300" placeholder="Ex.: treinar apenas depois das aulas"></textarea>
            </div>
            <div class="campo">
                <label for="penalidade_input">Penalidade</label>
                <textarea id="penalidade_input" required maxlength="300" placeholder="Ex.: ficar um dia sem usar a habilidade"></textarea>
            </div>
            <div class="campo">
                <label for="severidade_input">Severidade da restrição</label>
                <select id="severidade_input"><option>Leve</option><option>Moderada</option><option>Severa</option></select>
            </div>
            <button>Selar voto</button><p role="status"></p>
        </form><div id="voto_salvo"></div>`;
        const campos = {"goal": "meta_input", "restriction": "restricao_input", "penalty": "penalidade_input", "severity": "severidade_input"};

        function updateVow() {
            const voto2 = previa ? read(chave, null) : estado.voto;
            if (!voto2) return;
            const resumo = card(voto2.goal, "Restrição " + voto2.severity.toLowerCase() + " · " + voto2.restriction);
            const penalidade = document.createElement("p");
            penalidade.textContent = "Penalidade: " + voto2.penalty;
            resumo.append(penalidade);
            get("voto_salvo").innerHTML = "";
            get("voto_salvo").append(resumo);
            for (const [field, id] of Object.entries(campos)) get(id).value = voto2[field];
        }
        updateVow();
        areaQuiz.querySelector("form").onsubmit = async evento => {
            evento.preventDefault();
            if (Object.values(campos).some(id => !value(id))) {
                areaQuiz.querySelector("[role=status]").textContent = "Preencha todos os campos do voto.";
                return;
            }
            try {
                const voto = Object.fromEntries(Object.entries(campos).map(([field, id]) => [field, value(id)]));
                if (previa) write(chave, voto);
                else estado.voto = await apiHunter("voto", "PUT", voto);
                updateVow();
                areaQuiz.querySelector("[role=status]").textContent = "Voto salvo.";
            } catch (erro) {
                areaQuiz.querySelector("[role=status]").textContent = erro.message;
            }
        };
    }

    if (hunter && get("formulario_criatura")) {
        const chave = previa ? "caminho-do-nen.preview.creatures" : "caminho-do-nen.creatures";
        const formulario = get("formulario_criatura");
        const lista = get("lista_criaturas");
        const categorias = {
            bp: ["Baixo", "Moderado", "Alto", "Extremo"],
            bev: ["Baixo", "Moderado", "Alto"],
            bt: ["Animal", "Besta mágica", "Quimera", "Outro"],
            bh: ["Floresta", "Montanha", "Água", "Deserto", "Outro"],
            bo: ["Pequeno", "Médio", "Grande"],
            bc: ["Dócil", "Territorial", "Agressivo", "Desconhecido"],
            bnn: ["Desconhecida", ...tiposNen]
        };
        const camposCategorias = {"bp": "perigo_input", "bev": "evolucao_input", "bt": "tipo_input", "bh": "habitat_input", "bo": "porte_input", "bc": "comportamento_input", "bnn": "afinidade_nen_input"};
        for (const [id, opcoes] of Object.entries(categorias)) {
            get(camposCategorias[id]).innerHTML = "";
            get(camposCategorias[id]).append(...opcoes.map(rotulo => new Option(rotulo)));
        }
        get("filtro_tipo_input").innerHTML = "";
        get("filtro_tipo_input").append(new Option("Todos os tipos", ""), ...categorias.bt.map(rotulo => new Option(rotulo)));
        get("filtro_perigo_input").innerHTML = "";
        get("filtro_perigo_input").append(new Option("Todos os níveis de perigo", ""), ...categorias.bp.map(rotulo => new Option(rotulo)));
        function renderCreatures() {
            const registros = (previa ? read(chave, []) : estado.criaturas).filter(item =>
                (!value("filtro_tipo_input") || item.bt === value("filtro_tipo_input")) && (!value("filtro_perigo_input") || item.bp === value("filtro_perigo_input")));
            get("total_criaturas").textContent = registros.length + (registros.length === 1 ? " criatura" : " criaturas");
            lista.innerHTML = "";
            lista.append(...registros.map(item => {
                const registro = card(item.name, item.description);
                const detalhes = document.createElement("p");
                detalhes.textContent = [item.bt, "Perigo " + item.bp, item.bh, item.bo, item.bc,
                    "Evolução: " + item.bev, "Nen: " + item.bnn].join(" · ");
                const autor = document.createElement("small");
                autor.textContent = "Registro de " + item.author;
                registro.append(detalhes, autor);
                return registro;
            }));
            if (!registros.length) lista.append(card("Nenhuma criatura encontrada", "Registre uma criatura ou altere os filtros."));
        }
        get("botao_registrar_criatura").disabled = false;
        get("botao_registrar_criatura").onclick = () => { formulario.hidden = false; get("nome_input").focus(); };
        get("botao_cancelar_criatura").onclick = () => { formulario.reset(); formulario.hidden = true; get("botao_registrar_criatura").focus(); };
        get("filtro_tipo_input").onchange = renderCreatures;
        get("filtro_perigo_input").onchange = renderCreatures;
        formulario.onsubmit = async evento => {
            evento.preventDefault();
            const mensagemCampo = get("descricao_input").nextElementSibling;
            if (!value("descricao_input")) {
                mensagemCampo.textContent = "Descreva a criatura.";
                return;
            }
            const criatura = {
                name: value("nome_input") || "Criatura sem nome", description: value("descricao_input"), author: hunter.name,
                ...Object.fromEntries(Object.entries(camposCategorias).map(([id, input]) => [id, value(input)]))
            };
            const botaoEnviar = formulario.querySelector("button:not([type=button])");
            botaoEnviar.disabled = true;
            try {
                if (previa) write(chave, [criatura, ...read(chave, [])]);
                else estado.criaturas.unshift(await apiHunter("criaturas", "POST", criatura));
                mensagemCampo.textContent = "";
                formulario.reset();
                formulario.hidden = true;
                get("botao_registrar_criatura").focus();
                renderCreatures();
            } catch (erro) {
                mensagemCampo.textContent = erro.message;
            } finally {
                botaoEnviar.disabled = false;
            }
        };
        get("filtro_tipo_input").parentElement.hidden = false;
        renderCreatures();
    }
}

iniciarPagina().catch(erro => console.error(erro));
