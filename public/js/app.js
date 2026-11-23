const siteRoot = new URL("../", document.currentScript.src);
function read(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}
function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
const localSite = siteRoot.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(siteRoot.hostname);
const preview = localSite
    && new URLSearchParams(location.search).get("preview") === "1";
function pageUrl(path) {
    const url = new URL(path, siteRoot);
    if (preview) url.searchParams.set("preview", "1");
    return url;
}
const pagina = document.body.dataset.v;
const paginasHunter = ["dashboard", "perfil", "quiz", "voto", "bestiario", "personagens"];

async function apiHunter(caminho, metodo = "GET", dados) {
    let resposta;
    try {
        resposta = await fetch(new URL("hunter/" + caminho, siteRoot), {
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
    if (!preview && ["http:", "https:"].includes(siteRoot.protocol)) {
        try {
            estado = await apiHunter("estado?pagina=" + encodeURIComponent(pagina || ""));
        } catch (erro) {
            if (erro.status !== 401) erroAoConsultar = erro;
        }
    }

    const hunter = preview ? { name: "Hunter de teste", license: "PRÉVIA" } : estado.hunter;
    const current = "preview";
    if (paginasHunter.includes(pagina)) {
        if (hunter && pagina === "dashboard") {
            const destino = pageUrl("dashboard/perfil.html");
            destino.hash = "estatisticas";
            location.replace(destino);
            return;
        }
        if (hunter) {
            document.querySelector("main").hidden = false;
        } else if (erroAoConsultar) {
            const aviso = document.createElement("p");
            aviso.className = "cartao";
            aviso.textContent = erroAoConsultar.message;
            document.querySelector("main").before(aviso);
        } else {
            location.replace(new URL("login.html", siteRoot));
            return;
        }
    }
    window.addEventListener("pageshow", event => {
        if (event.persisted && !preview) location.reload();
    });

    const nav = document.querySelector("#nav");
    const links = [
        ["index.html", "Início"],
        ["sobre.html", "Sobre mim"],
        ["dashboard/personagens.html", "Personagens"],
        ["dashboard/perfil.html", "Perfil"],
        ["dashboard/quiz.html", "Quizzes"],
        ["dashboard/voto.html", "Voto e Restrição"],
        ["dashboard/bestiario.html", "Bestiário"],
        ["cadastro.html", "Cadastro"],
        ["login.html", "Entrar"]
    ];
    nav.setAttribute("aria-label", "Navegação principal");
    nav.innerHTML = `<b><img src="${new URL("assets/logo.png", siteRoot)}" alt="">Caminho do Nen</b>`;
    function navigationLink(url, label) {
        const link = document.createElement("a");
        link.href = pageUrl(url);
        link.textContent = label;
        if (url === "login.html") link.classList.add("botao-destaque");
        if (link.pathname === location.pathname || (url === "index.html" && siteRoot.pathname === location.pathname)) {
            link.classList.add("ativo");
            link.setAttribute("aria-current", "page");
        }
        return link;
    }

    if (hunter) {
        nav.classList.add("navegacao-hunter");
        nav.insertAdjacentHTML("beforeend", `
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

        nav.prepend(nav.querySelector(".controle-menu-hunter"));
        const menu = nav.querySelector("#hunter-menu");
        const profile = nav.querySelector("#hunter-profile");
        const profileButton = nav.querySelector(".botao-perfil");
        profileButton.textContent = hunter.name.charAt(0).toUpperCase();
        profile.querySelector("b").textContent = hunter.name;
        for (const [url, label] of links) {
            if (!url.startsWith("dashboard/")) continue;
            const link = navigationLink(url, label);
            if (label === "Perfil") {
                profile.append(link);
            } else {
                const item = document.createElement("li");
                item.append(link);
                menu.append(item);
            }
        }

        const logout = document.createElement("button");
        logout.type = "button";
        logout.textContent = preview ? "Sair da prévia" : "Sair";
        logout.addEventListener("click", async () => {
            try {
                if (!preview) await apiHunter("sair", "POST");
                location.assign(new URL("index.html", siteRoot));
            } catch (erro) {
                logout.title = erro.message;
                logout.textContent = "Tentar sair novamente";
            }
        });
        profile.append(logout);

        function bindDisclosure(button, panel) {
            function close() {
                panel.hidden = true;
                button.setAttribute("aria-expanded", "false");
            }
            button.addEventListener("click", () => {
                if (!panel.hidden) {
                    close();
                    return;
                }
                panel.hidden = false;
                button.setAttribute("aria-expanded", "true");
            });
            document.addEventListener("click", event => {
                if (!button.contains(event.target) && !panel.contains(event.target)) close();
            });
            document.addEventListener("keydown", event => {
                if (event.key === "Escape" && !panel.hidden) {
                    close();
                    button.focus();
                }
            });
        }

        bindDisclosure(nav.querySelector(".botao-menu"), menu);
        bindDisclosure(profileButton, profile);
        profile.addEventListener("click", event => {
            if (event.target.closest("a")) {
                profile.hidden = true;
                profileButton.setAttribute("aria-expanded", "false");
            }
        });
    } else {
        for (const [url, label] of links) {
            if (!url.startsWith("dashboard/")) nav.append(navigationLink(url, label));
        }
    }


    const characters = [
        ["gon", "Gon Freecss", "Sai da Ilha da Baleia para se tornar Hunter e encontrar seu pai."],
        ["killua", "Killua Zoldyck", "Deixa para trás a vida de assassino e segue sua própria jornada ao lado de Gon."],
        ["kurapika", "Kurapika", "Busca recuperar os olhos escarlates do clã Kurta."],
        ["leorio", "Leorio Paradinight", "Quer se tornar médico e usa o Exame Hunter como caminho para realizar esse objetivo."]
    ];
    const panels = document.querySelector("#paineis_protagonistas");
    if (panels && hunter) {
        panels.closest(".faixa").hidden = false;
        document.querySelector("#etapa_personagens").hidden = false;
    }
    if (panels && hunter) {
        for (const [asset, name, description] of characters) {
            panels.insertAdjacentHTML("beforeend", `<article class="painel-protagonista"><div class="conteudo-protagonista">
                <div class="ilustracao"><img src="${new URL("assets/" + asset + ".webp", siteRoot)}" alt=""></div>
                <div class="texto-protagonista"><h3>${name}</h3><p>${description}</p></div>
            </div></article>`);
        }
    }

    const characterList = document.querySelector("#lista_personagens");
    if (characterList && hunter) {
        const galleryCharacters = [
            ...characters,
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
        for (const [asset, name, description, extension = "webp"] of galleryCharacters) {
            characterList.insertAdjacentHTML("beforeend", `<article class="cartao-personagem" tabindex="0"><div class="conteudo-personagem">
                <img src="${new URL("assets/" + asset + "." + extension, siteRoot)}" loading="lazy" alt=""><div class="descricao-personagem"><h3>${name}</h3><p>${description}</p></div>
            </div></article>`);
        }
    }


    const dialog = document.querySelector("#modal");
    document.querySelectorAll("[data-open]").forEach(button => {
        button.addEventListener("click", () => {
            const content = document.getElementById("t-" + button.dataset.open);
            document.querySelector("#conteudo_janela_informacoes").replaceChildren(content.content.cloneNode(true));
            dialog.showModal();
        });
    });

    const nenColors = ["#2c9954", "#8942a1", "#247eaf", "#bd3528", "#dc9119", "#169d89"];
    const nenPoints = [[640, 228], [997, 434], [997, 846], [640, 1052], [283, 846], [283, 434]];
    function drawNenArtwork(hexagon, filterId) {
        const artwork = new URL("assets/hexagono-nen.png", siteRoot);
        hexagon.setAttribute("viewBox", "-265 38 1810 1204");


        hexagon.innerHTML = `
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
            <image href="${artwork}" width="1280" height="1280" filter="url(#${filterId})" aria-hidden="true"></image>`;
    }

    const hexagon = document.querySelector("#hexagono_tipos_nen");
    if (hexagon) {
        const types = [
            ["Intensificação", nenColors[0], "Gon", "Reforça o corpo e os objetos. Direto, honesto e determinado.", "A água transborda do copo."],
            ["Transmutação", nenColors[1], "Killua", "Muda as propriedades da aura, como dar a ela características de eletricidade.", "A água muda de sabor."],
            ["Materialização", nenColors[2], "Kurapika", "Cria objetos a partir da aura, como correntes.", "Surgem impurezas na água."],
            ["Especialização", nenColors[3], "Chrollo", "Reúne habilidades fora das outras cinco categorias.", "Ocorre um efeito diferente dos demais."],
            ["Manipulação", nenColors[4], "Illumi", "Permite controlar objetos ou seres vivos.", "A folha se move."],
            ["Emissão", nenColors[5], "Leorio", "Permite projetar a aura e mantê-la longe do corpo.", "A água muda de cor."]
        ];
        const points = nenPoints;
        const info = document.querySelector("#informacoes_tipo_nen");
        drawNenArtwork(hexagon, "nen-sem-fundo");
        hexagon.setAttribute("role", "group");
        hexagon.setAttribute("aria-label", "Os seis tipos de Nen");

        types.forEach(([name, color, example, description, effect], index) => {
            const [x, y] = points[index];
            const horizontal = Math.sign(x - 640) * 122;
            const labelY = y + [-122, 16, 16, 155, 16, 16][index];
            const anchor = horizontal === 0 ? "middle" : horizontal > 0 ? "start" : "end";
            hexagon.insertAdjacentHTML("beforeend", `<g class="vertice-nen" role="button" tabindex="0" aria-label="${name}" aria-pressed="false">
                <circle cx="${x}" cy="${y}" r="101"></circle>
                <text x="${x + horizontal}" y="${labelY}" text-anchor="${anchor}" aria-hidden="true">${name}</text>
            </g>`);
            const vertex = hexagon.lastElementChild;
            const next = types[(index + 1) % types.length][0];
            const previous = types[(index + types.length - 1) % types.length][0];
            const opposite = types[(index + 3) % types.length][0];
            function select() {
                const active = hexagon.querySelector(".ativo");
                active?.classList.remove("ativo");
                active?.setAttribute("aria-pressed", "false");
                vertex.classList.add("ativo");
                vertex.setAttribute("aria-pressed", "true");
                info.style.setProperty("--nen-color", color);
                info.innerHTML = `<h3><span class="etiqueta">${name}</span></h3>
                    <p class="texto-secundario">Exemplo: ${example}</p><p>${description}</p>
                    <p class="texto-secundario"><strong>Na divinação:</strong> ${effect}</p>
                    ${index === 3 ? "" : `<p class="texto-secundario"><strong>Afinidade:</strong> 80% com ${previous} e ${next}; 40% com ${opposite}.</p>`}`;
            }
            vertex.addEventListener("focus", select);
            vertex.addEventListener("pointerenter", select);
            vertex.addEventListener("click", select);
            vertex.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    select();
                }
            });
            if (index === 0) select();
        });
    }

    const get = id => document.getElementById(id);
    const value = id => get(id).value.trim();

    async function solicitarConta(rota, dados) {
        if (siteRoot.protocol !== "http:" && siteRoot.protocol !== "https:") {
            throw new Error("Abra o site pelo servidor para usar o cadastro ou o login.");
        }

        let resposta;
        try {
            resposta = await fetch(new URL("usuarios/" + rota, siteRoot), {
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

    const previewLink = get("link_previa_sem_conta");
    if (previewLink && localSite) {
        previewLink.hidden = false;
    }

    const auth = get("formulario_cadastro") || get("formulario_login");
    if (auth) {
        const registering = auth.id === "formulario_cadastro";
        const feedback = auth.querySelector("[role=status]");
        const submit = auth.querySelector("button[type=submit]");
        if (registering) {
            get("senha_input").addEventListener("input", () => {
                get("indicador_forca_senha").style.width = Math.min(100, get("senha_input").value.length * 8) + "%";
            });
        }
        auth.addEventListener("submit", async event => {
            event.preventDefault();
            submit.disabled = true;
            try {
                const email = value("email_input").toLowerCase();
                const password = get("senha_input").value;
                let dados = { emailServer: email, senhaServer: password };
                if (registering) {
                    const nome = value("nome_input");
                    if (!nome) throw new Error("Informe um nome de Hunter.");
                    if (password !== get("confirmacao_senha_input").value) throw new Error("As senhas precisam ser iguais.");
                    dados = {
                        ...dados,
                        nomeServer: nome,
                        motivoServer: value("motivacao_input"),
                        aceiteServer: get("aceite_input").checked
                    };
                }

                await solicitarConta(registering ? "cadastrar" : "autenticar", dados);
                if (registering) {
                    location.assign(new URL("dashboard/quiz.html", siteRoot));
                } else {
                    const dadosConta = await apiHunter("estado");
                    location.assign(new URL(dadosConta.resultado ? "dashboard/perfil.html" : "dashboard/quiz.html", siteRoot));
                }
            } catch (error) {
                feedback.textContent = error instanceof TypeError || error instanceof DOMException
                    ? "O navegador bloqueou o armazenamento ou a autenticação. Abra o site pelo servidor local."
                    : error.message;
            } finally {
                submit.disabled = false;
            }
        });
    }

    function card(title, description) {
        const article = document.createElement("article");
        article.className = "cartao";
        const heading = document.createElement("h2");
        heading.textContent = title;
        const details = document.createElement("p");
        details.textContent = description;
        article.append(heading, details);
        return article;
    }

    const mural = get("mural");
    if (mural && hunter) {
        mural.replaceChildren(...(preview ? [hunter] : estado.mural).map(account => card(account.name, "Licença " + account.license)));
    }
    if (mural) mural.closest(".faixa").hidden = !hunter;

    const nenTypes = ["Intensificação", "Transmutação", "Materialização", "Especialização", "Manipulação", "Emissão"];
    function affinityHexagon(dominant) {
        const affinities = nenTypes.map((_, index) => {
            const steps = Math.abs(index - dominant);
            return 100 - 20 * Math.min(steps, nenTypes.length - steps);
        });
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "hexagrama-afinidade");
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", nenTypes.map((name, index) => name + " " + affinities[index] + "%").join(", "));
        drawNenArtwork(svg, "nen-afinidade-sem-fundo");
        svg.setAttribute("viewBox", "-265 38 1810 1260");
        svg.insertAdjacentHTML("beforeend", nenPoints.map(([x, y], index) => {
            const horizontal = Math.sign(x - 640) * 122;
            const labelY = y + [-129, -12, -12, 152, -12, -12][index];
            const anchor = horizontal === 0 ? "middle" : horizontal > 0 ? "start" : "end";
            const highlight = index === dominant
                ? `<circle cx="${x}" cy="${y}" r="102" fill="none" stroke="#ffd34e" stroke-width="12"></circle>`
                : "";
            return `<g aria-hidden="true">${highlight}
                <text x="${x + horizontal}" y="${labelY}" text-anchor="${anchor}">${nenTypes[index]}
                    <tspan class="porcentagem-afinidade" x="${x + horizontal}" dy="47">${affinities[index]}%</tspan>
                </text>
            </g>`;
        }).join(""));
        return svg;
    }


    const resultKey = "caminho-do-nen.result." + current;
    let result = preview ? read(resultKey, null) : estado.resultado;

    if (hunter && get("dados_perfil_hunter")) {
        const edit = get("editar-perfil");
        const form = get("formulario_perfil");
        const name = get("nome_input");
        const reason = get("motivacao_input");
        const status = get("status-perfil");
        const vow = preview ? read("caminho-do-nen.vow." + current, null) : estado.voto;

        function showProfile() {
            get("licenca-hunter").textContent = hunter.license || "Não informada";
            get("nome-hunter").textContent = hunter.name;
            get("nen-hunter").textContent = nenTypes[result?.type] || "não revelado";
            get("motivo-hunter").textContent = hunter.reason || "não informada";
            get("voto-hunter").textContent = vow?.goal || "nenhum";
            nav.querySelector(".botao-perfil").textContent = hunter.name.charAt(0).toUpperCase();
            nav.querySelector(".cabecalho-menu-perfil b").textContent = hunter.name;
        }

        name.value = hunter.name;
        reason.value = hunter.reason || "";
        showProfile();

        edit.addEventListener("click", () => {
            form.hidden = !form.hidden;
            edit.setAttribute("aria-expanded", String(!form.hidden));
            if (!form.hidden) name.focus();
        });

        form.addEventListener("submit", async event => {
            event.preventDefault();
            const updated = {
                ...hunter,
                name: name.value.trim(),
                reason: reason.value.trim()
            };
            if (!updated.name) {
                status.textContent = "Informe um nome de Hunter.";
                name.focus();
                return;
            }
            try {
                const salvo = preview ? updated : await apiHunter("perfil", "PUT", { name: updated.name, reason: updated.reason });
                Object.assign(hunter, salvo);
                name.value = hunter.name;
                reason.value = hunter.reason;
                showProfile();
                status.textContent = preview ? "Perfil atualizado nesta prévia." : "Perfil salvo.";
            } catch (erro) {
                status.textContent = erro.message;
            }
        });
    }
    const statistics = get("afinidades-hunter");
    if (hunter && statistics) {
        if (result) {
            const summary = document.createElement("p");
            summary.textContent = "Sua afinidade diminui 20 pontos percentuais a cada vértice de distância do tipo dominante.";
            statistics.append(summary, affinityHexagon(result.type));
        } else {
            const summary = document.createElement("p");
            summary.textContent = "Faça o quiz de Nen para descobrir suas afinidades.";
            const link = navigationLink("dashboard/quiz.html", "Fazer o quiz de Nen");
            link.className = "botao";
            statistics.append(summary, link);
        }
    }

    if (hunter && get("selecao_quizzes")) {
        const questions = [
            "Diante de um desafio, o que você prefere?", "O que mais valoriza em uma equipe?",
            "Como se prepara para algo inesperado?", "O que mais orienta suas decisões?",
            "Como gosta de aprender?", "O que faz quando um plano falha?",
            "O que indicaria como seu ponto forte?", "Como enfrenta a pressão?",
            "Que papel assume num grupo?", "O que faz diante de uma situação nova?",
            "O que mais motiva você?", "Como protege algo importante?",
            "Que tipo de habilidade gostaria de treinar?", "Qual estratégia escolheria no Exame Hunter?"
        ];
        const choices = ["Persistir e agir de frente", "Mudar de abordagem e improvisar",
            "Preparar uma ferramenta para o problema", "Buscar um caminho fora do comum",
            "Organizar as pessoas e o ambiente", "Agir rapidamente e manter distância"];
        const triviaQuizzes = quizzesPersonagens.map(quiz => ({ ...quiz }));
        const hub = get("selecao_quizzes");
        const box = get("area_perguntas_quiz");
        const startNen = get("iniciar-nen");
        const statisticsUrl = pageUrl("dashboard/perfil.html");
        statisticsUrl.hash = "estatisticas";
        get("link-estatisticas").href = statisticsUrl;
        const nenCard = startNen.closest(".quiz-obrigatorio");
        const nenLabel = nenCard.querySelector(".rotulo");
        const completedQuizzes = get("quizzes-concluidos");
        const completedList = get("lista-quizzes-concluidos");
        const cooldown = 3 * 60 * 60 * 1000;


        const availableList = get("lista-quizzes-disponiveis");
        for (const quiz of triviaQuizzes) {
            quiz.storageKey = "caminho-do-nen.trivia." + current + "." + quiz.id;
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
                <img class="imagem-quiz-personagem" src="${new URL("assets/" + quiz.id + ".webp", siteRoot)}" alt="">
            </article>`;
            quiz.button = item.querySelector("button");
            quiz.wait = item.querySelector("p[id]");
            quiz.button.onclick = () => runQuiz(quiz);
            availableList.insertBefore(item, get("quiz-arcos"));
        }

        function explainWait(message, attempt) {
            const remaining = Math.max(0, (attempt?.completedAt || 0) + cooldown - Date.now());
            const minutes = Math.ceil(remaining / 60000);
            const hours = Math.floor(minutes / 60);
            const parts = [hours && hours + " h", minutes % 60 && minutes % 60 + " min"].filter(Boolean);
            const description = remaining ? "Disponível em " + parts.join(" ") + "." : "";
            if (message.textContent !== description) message.textContent = description;
            message.hidden = !remaining;
            return Boolean(remaining);
        }

        function updateQuizList() {
            if (result) {
                nenCard.classList.add("quiz-concluido");
                nenLabel.textContent = "Concluído";
                if (nenCard.parentElement !== completedList) {
                    completedList.append(nenCard);
                    completedQuizzes.hidden = false;
                }
            }
            startNen.hidden = Boolean(result);
            startNen.disabled = Boolean(result);
            for (const quiz of triviaQuizzes) {
                quiz.button.disabled = !result || explainWait(quiz.wait, preview ? read(quiz.storageKey, null) : estado.tentativas[quiz.id]);
            }
            get("nen-concluido").hidden = !result;
        }
        updateQuizList();
        setInterval(() => {
            if (!hub.hidden) updateQuizList();
        }, 1000);

        function runQuiz(quiz) {
            const isTrivia = Boolean(quiz);
            if (preview) result = read(resultKey, result);
            updateQuizList();
            if ((quiz ? quiz.button : startNen).disabled) return;
            const total = quiz ? quiz.questions.length : questions.length;
            const scores = nenTypes.map(() => 0);
            const deadline = Date.now() + 4 * 60 * 1000;
            const timer = document.createElement("span");
            timer.className = "tempo-quiz";
            let index = 0;
            let correct = 0;
            const respostas = [];
            let interval;
            let finished = false;
            hub.hidden = true;
            box.hidden = false;

            async function finish() {
                if (finished) return;
                finished = true;
                clearInterval(interval);
                box.replaceChildren(card("Salvando resultado", "Aguarde a confirmação."));
                if (isTrivia) {
                    let summary = index < total ? "O tempo acabou. Questões sem resposta contam como erro." : "Você respondeu a todas as perguntas.";
                    const outcome = { correct, total, completedAt: Date.now() };
                    try {
                        if (preview) {
                            write(quiz.storageKey, outcome);
                        } else {
                            const salvo = await apiHunter("quizzes/" + quiz.id + "/tentativas", "POST", { respostas });
                            estado.tentativas[quiz.id] = salvo;
                            correct = salvo.correct;
                        }
                        summary += " Você pode repetir este quiz em 3 horas.";
                    } catch (erro) {
                        if (erro.completedAt) estado.tentativas[quiz.id] = { completedAt: erro.completedAt };
                        summary += " " + erro.message;
                    }
                    const ranking = [
                        [0, "Leorio", "leorio.webp"],
                        [4, "Gon", "gon.webp"],
                        [7, "Killua", "killua.webp"],
                        [9, "Netero", "netero.svg"],
                        [12, "Meruem", "meruem.svg"]
                    ];
                    const [, character, image] = ranking.findLast(([minimum]) => correct * 12 >= minimum * total);
                    const resultCard = card("Você acertou " + correct + " de " + total + " questões", summary);
                    const reward = document.createElement("figure");
                    reward.className = "personagem-recompensa";
                    const portrait = document.createElement("img");
                    portrait.src = new URL("assets/" + image, siteRoot);
                    portrait.alt = character;
                    const caption = document.createElement("figcaption");
                    caption.textContent = "Personagem da sua faixa de pontuação: " + character;
                    reward.append(portrait, caption);
                    resultCard.append(reward);
                    box.replaceChildren(resultCard);
                } else {
                    const previous = preview ? read(resultKey, null) : result;
                    const type = previous?.type ?? scores.indexOf(Math.max(...scores));
                    try {
                        const outcome = preview ? previous || { type, scores } : await apiHunter("nen", "POST", { scores });
                        if (preview && !previous) write(resultKey, outcome);
                        result = outcome;
                        updateQuizList();
                        box.replaceChildren(card("Seu Nen: " + nenTypes[type], "Afinidade principal de 100%. Seu tipo de Nen é definitivo. Os quizzes de personagens estão liberados."), affinityHexagon(type));
                        const link = navigationLink("dashboard/perfil.html#estatisticas", "Ver estatísticas no perfil");
                        link.className = "botao";
                        box.append(link);
                    } catch (erro) {
                        box.replaceChildren(card("Resultado não salvo", erro.message));
                    }
                }
                const back = document.createElement("button");
                back.type = "button";
                back.textContent = "Voltar aos quizzes";
                back.onclick = () => {
                    box.hidden = true;
                    hub.hidden = false;
                    updateQuizList();
                    const next = triviaQuizzes.find(item => !item.button.disabled)?.button || startNen;
                    (next.disabled ? hub : next).focus();
                };
                box.append(back);
                back.focus();
            }

            function updateTimer() {
                const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
                timer.textContent = Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
                if (!seconds) finish();
            }

            function showQuestion() {
                if (index === total) {
                    finish();
                    return;
                }
                const question = isTrivia ? quiz.questions[index][0] : questions[index];
                const options = isTrivia ? quiz.questions[index][1] : choices;
                const panel = card("Pergunta " + (index + 1) + " de " + total, question);
                if (quiz) {
                    const header = document.createElement("div");
                    header.className = "cabecalho-quiz-personagem";
                    const portrait = document.createElement("img");
                    portrait.src = new URL("assets/" + quiz.id + ".webp", siteRoot);
                    portrait.alt = "";
                    header.append(portrait, quiz.name, timer);
                    panel.prepend(header);
                }
                box.replaceChildren(panel);
                options.forEach((_, offset) => {
                    const choice = (offset + index) % options.length;
                    const button = document.createElement("button");
                    button.type = "button";
                    button.className = "opcao-resposta";
                    button.textContent = options[choice];
                    button.onclick = () => {
                        if (finished) return;
                        if (isTrivia) {
                            if (Date.now() >= deadline) {
                                finish();
                                return;
                            }
                            respostas.push(choice);
                            if (choice === 0) correct++;
                        } else {
                            scores[choice]++;
                        }
                        index++;
                        showQuestion();
                    };
                    box.append(button);
                });
                box.querySelector("button").focus();
            }

            showQuestion();
            if (isTrivia) {
                interval = setInterval(updateTimer, 250);
                updateTimer();
            }
        }
        startNen.onclick = () => runQuiz(null);
    }


    if (hunter && get("area_voto_restricao")) {
        const key = "caminho-do-nen.vow." + current;
        const box = get("area_voto_restricao");
        box.innerHTML = `<form class="cartao">
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
        const fields = {"goal": "meta_input", "restriction": "restricao_input", "penalty": "penalidade_input", "severity": "severidade_input"};

        function updateVow() {
            const vow = preview ? read(key, null) : estado.voto;
            if (!vow) return;
            const summary = card(vow.goal, "Restrição " + vow.severity.toLowerCase() + " · " + vow.restriction);
            const penalty = document.createElement("p");
            penalty.textContent = "Penalidade: " + vow.penalty;
            summary.append(penalty);
            get("voto_salvo").replaceChildren(summary);
            for (const [field, id] of Object.entries(fields)) get(id).value = vow[field];
        }
        updateVow();
        box.querySelector("form").onsubmit = async event => {
            event.preventDefault();
            if (Object.values(fields).some(id => !value(id))) {
                box.querySelector("[role=status]").textContent = "Preencha todos os campos do voto.";
                return;
            }
            try {
                const voto = Object.fromEntries(Object.entries(fields).map(([field, id]) => [field, value(id)]));
                if (preview) write(key, voto);
                else estado.voto = await apiHunter("voto", "PUT", voto);
                updateVow();
                box.querySelector("[role=status]").textContent = "Voto salvo.";
            } catch (erro) {
                box.querySelector("[role=status]").textContent = erro.message;
            }
        };
    }

    if (hunter && get("formulario_criatura")) {
        const key = preview ? "caminho-do-nen.preview.creatures" : "caminho-do-nen.creatures";
        const form = get("formulario_criatura");
        const list = get("lista_criaturas");
        const categories = {
            bp: ["Baixo", "Moderado", "Alto", "Extremo"],
            bev: ["Baixo", "Moderado", "Alto"],
            bt: ["Animal", "Besta mágica", "Quimera", "Outro"],
            bh: ["Floresta", "Montanha", "Água", "Deserto", "Outro"],
            bo: ["Pequeno", "Médio", "Grande"],
            bc: ["Dócil", "Territorial", "Agressivo", "Desconhecido"],
            bnn: ["Desconhecida", ...nenTypes]
        };
        const categoryInputs = {"bp": "perigo_input", "bev": "evolucao_input", "bt": "tipo_input", "bh": "habitat_input", "bo": "porte_input", "bc": "comportamento_input", "bnn": "afinidade_nen_input"};
        for (const [id, options] of Object.entries(categories)) {
            get(categoryInputs[id]).replaceChildren(...options.map(label => new Option(label)));
        }
        get("filtro_tipo_input").replaceChildren(new Option("Todos os tipos", ""), ...categories.bt.map(label => new Option(label)));
        get("filtro_perigo_input").replaceChildren(new Option("Todos os níveis de perigo", ""), ...categories.bp.map(label => new Option(label)));
        function renderCreatures() {
            const entries = (preview ? read(key, []) : estado.criaturas).filter(item =>
                (!value("filtro_tipo_input") || item.bt === value("filtro_tipo_input")) && (!value("filtro_perigo_input") || item.bp === value("filtro_perigo_input")));
            get("total_criaturas").textContent = entries.length + (entries.length === 1 ? " criatura" : " criaturas");
            list.replaceChildren(...entries.map(item => {
                const entry = card(item.name, item.description);
                const details = document.createElement("p");
                details.textContent = [item.bt, "Perigo " + item.bp, item.bh, item.bo, item.bc,
                    "Evolução: " + item.bev, "Nen: " + item.bnn].join(" · ");
                const author = document.createElement("small");
                author.textContent = "Registro de " + item.author;
                entry.append(details, author);
                return entry;
            }));
            if (!entries.length) list.append(card("Nenhuma criatura encontrada", "Registre uma criatura ou altere os filtros."));
        }
        get("botao_registrar_criatura").disabled = false;
        get("botao_registrar_criatura").onclick = () => { form.hidden = false; get("nome_input").focus(); };
        get("botao_cancelar_criatura").onclick = () => { form.reset(); form.hidden = true; get("botao_registrar_criatura").focus(); };
        get("filtro_tipo_input").onchange = renderCreatures;
        get("filtro_perigo_input").onchange = renderCreatures;
        form.onsubmit = async event => {
            event.preventDefault();
            const feedback = get("descricao_input").nextElementSibling;
            if (!value("descricao_input")) {
                feedback.textContent = "Descreva a criatura.";
                return;
            }
            const criatura = {
                name: value("nome_input") || "Criatura sem nome", description: value("descricao_input"), author: hunter.name,
                ...Object.fromEntries(Object.entries(categoryInputs).map(([id, input]) => [id, value(input)]))
            };
            const submit = form.querySelector("button:not([type=button])");
            submit.disabled = true;
            try {
                if (preview) write(key, [criatura, ...read(key, [])]);
                else estado.criaturas.unshift(await apiHunter("criaturas", "POST", criatura));
                feedback.textContent = "";
                form.reset();
                form.hidden = true;
                get("botao_registrar_criatura").focus();
                renderCreatures();
            } catch (erro) {
                feedback.textContent = erro.message;
            } finally {
                submit.disabled = false;
            }
        };
        get("filtro_tipo_input").parentElement.hidden = false;
        renderCreatures();
    }
}

iniciarPagina().catch(erro => console.error(erro));
