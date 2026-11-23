const siteRoot = new URL("../", document.currentScript.src);
const accountsKey = "caminho-do-nen.accounts";
const sessionKey = "caminho-do-nen.session";
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
const accounts = read(accountsKey, {});
const localSite = siteRoot.protocol === "file:" || ["localhost", "127.0.0.1", "[::1]"].includes(siteRoot.hostname);
const preview = localSite
    && new URLSearchParams(location.search).get("preview") === "1";
function pageUrl(path) {
    const url = new URL(path, siteRoot);
    if (preview) url.searchParams.set("preview", "1");
    return url;
}
const current = preview ? "preview" : read(sessionKey, "");
const hunter = preview ? { name: "Hunter de teste", license: "PRÉVIA" } : Object.hasOwn(accounts, current) ? accounts[current] : null;
const privatePages = ["dashboard", "perfil", "quiz", "voto", "bestiario", "personagens"];
const page = document.body.dataset.v;
if (privatePages.includes(page)) {
    if (hunter && page === "dashboard") {
        const destination = pageUrl("dashboard/perfil.html");
        destination.hash = "estatisticas";
        location.replace(destination);
    } else if (hunter) document.querySelector("main").hidden = false;
    else location.replace(new URL("login.html", siteRoot));
}

window.addEventListener("pageshow", event => {
    if (event.persisted && !preview && read(sessionKey, "") !== current) location.reload();
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
    logout.addEventListener("click", () => {
        if (!preview) localStorage.removeItem(sessionKey);
        location.assign(new URL("index.html", siteRoot));
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
const panels = document.querySelector("#panels");
if (panels && hunter) {
    panels.closest(".faixa").hidden = false;
    document.querySelector("#cast-step").hidden = false;
}
if (panels && hunter) {
    for (const [asset, name, description] of characters) {
        panels.insertAdjacentHTML("beforeend", `<article class="painel-protagonista"><div class="conteudo-protagonista">
            <div class="ilustracao"><img src="${new URL("assets/" + asset + ".webp", siteRoot)}" alt=""></div>
            <div class="texto-protagonista"><h3>${name}</h3><p>${description}</p></div>
        </div></article>`);
    }
}

const characterList = document.querySelector("#pcs");
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
        document.querySelector("#mbody").replaceChildren(content.content.cloneNode(true));
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

const hexagon = document.querySelector("#hexsvg");
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
    const info = document.querySelector("#hexinfo");
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

async function passwordHash(password, salt) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
        name: "PBKDF2", salt: encoder.encode(salt), iterations: 600000, hash: "SHA-256"
    }, key, 256);
    return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, "0")).join("");
}

const previewLink = get("preview-link");
if (previewLink && localSite) {
    previewLink.hidden = false;
}

const auth = get("fc") || get("fl");
if (auth) {
    const registering = auth.id === "fc";
    const feedback = auth.querySelector("[role=status]");
    const submit = auth.querySelector("button[type=submit]");
    if (registering) {
        get("cs").addEventListener("input", () => {
            get("forca").style.width = Math.min(100, get("cs").value.length * 8) + "%";
        });
    }
    auth.addEventListener("submit", async event => {
        event.preventDefault();
        submit.disabled = true;
        try {
            const email = value(registering ? "ce" : "le").toLowerCase();
            const password = get(registering ? "cs" : "ls").value;
            const saved = read(accountsKey, {});
            if (registering) {
                if (!value("cn")) throw new Error("Informe um nome de Hunter.");
                if (password !== get("cs2").value) throw new Error("As senhas precisam ser iguais.");
                if (Object.hasOwn(saved, email)) throw new Error("Já existe uma conta com esse e-mail neste navegador.");
                const salt = crypto.randomUUID();
                saved[email] = {
                    name: value("cn"), reason: value("cm"),
                    license: salt.slice(0, 8).toUpperCase(), salt, hash: await passwordHash(password, salt)
                };
                write(accountsKey, saved);
            } else {
                const account = Object.hasOwn(saved, email) && saved[email];
                if (!account || account.hash !== await passwordHash(password, account.salt)) {
                    throw new Error("E-mail ou senha incorretos.");
                }
            }
            write(sessionKey, email);
            const nextPage = read("caminho-do-nen.result." + email, null) ? "perfil" : "quiz";
            location.assign(pageUrl("dashboard/" + nextPage + ".html"));
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
    mural.replaceChildren(...Object.values(accounts).map(account => card(account.name, "Licença " + account.license)));
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
let result = read(resultKey, null);

if (hunter && get("pbox")) {
    const edit = get("editar-perfil");
    const form = get("form-perfil");
    const name = get("editar-nome");
    const reason = get("editar-motivo");
    const status = get("status-perfil");
    const vow = read("caminho-do-nen.vow." + current, null);

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

    form.addEventListener("submit", event => {
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
            if (!preview) {
                const saved = read(accountsKey, {});
                if (!Object.hasOwn(saved, current)) {
                    status.textContent = "Entre novamente para salvar o perfil.";
                    return;
                }
                saved[current] = { ...saved[current], name: updated.name, reason: updated.reason };
                write(accountsKey, saved);
            }
            Object.assign(hunter, updated);
            name.value = hunter.name;
            reason.value = hunter.reason;
            showProfile();
            status.textContent = preview ? "Perfil atualizado nesta prévia." : "Perfil salvo.";
        } catch {
            status.textContent = "O navegador não conseguiu salvar o perfil.";
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

if (hunter && get("qhub")) {
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
    const triviaQuizzes = [
        { id: "killua", name: "Killua", questions: [
            ["Qual é o sobrenome de Killua?", ["Zoldyck", "Freecss", "Kurta", "Nostrade"]],
            ["Que profissão tornou a família de Killua conhecida?", ["Assassinos", "Médicos", "Caçadores de tesouros", "Artistas marciais"]],
            ["Qual é a irmã de Killua?", ["Alluka", "Mito", "Shizuku", "Neon"]],
            ["Qual arma Killua usa em combate?", ["Ioiôs", "Correntes", "Cartas", "Bumerangues"]],
            ["Qual é a categoria natural de Nen de Killua?", ["Transmutação", "Materialização", "Intensificação", "Emissão"]],
            ["Que propriedade Killua dá à aura?", ["Eletricidade", "Elasticidade", "Magnetismo", "Frio"]],
            ["Quem Killua mata na fase final do primeiro Exame Hunter, causando sua desclassificação?", ["Bodoro", "Hanzo", "Gittarackur", "Pokkle"]],
            ["Quem escondeu uma agulha na cabeça de Killua?", ["Illumi", "Silva", "Milluki", "Zeno"]],
            ["Contra qual inimigo Killua retira a agulha de Illumi?", ["Rammot", "Ikalgo", "Youpi", "Bloster"]],
            ["Qual adversário da Arena Celestial usa uma cadeira de rodas e chicotes contra Killua?", ["Riehlvelt", "Gido", "Sadaso", "Kastro"]],
            ["Na partida contra Razor, para quem Killua segura a bola durante os arremessos com Nen?", ["Gon", "Biscuit", "Tsezguerra", "Hisoka"]],
            ["Qual é o nome da técnica que acelera os movimentos de Killua com aura elétrica?", ["Godspeed", "Jajanken", "Bungee Gum", "Pain Packer"]],
            ["Que Formiga Quimera, com aparência de polvo, se torna amiga de Killua?", ["Ikalgo", "Meleoron", "Colt", "Leol"]],
            ["A quem Killua pede para curar Gon no hospital?", ["Nanika", "Neferpitou", "Komugi", "Palm"]],
            ["Com quem Killua segue viagem após se despedir de Gon perto da Árvore do Mundo?", ["Alluka", "Biscuit", "Canary", "Leorio"]]
        ] },
        { id: "leorio", name: "Leorio", questions: [
            ["Qual profissão Leorio quer exercer?", ["Médico", "Professor", "Advogado", "Jornalista"]],
            ["Onde Leorio conhece Gon e Kurapika?", ["No navio a caminho do Exame Hunter", "Na Arena Celestial", "Em Greed Island", "Na mansão dos Zoldyck"]],
            ["Qual acessório Leorio costuma carregar nas mãos?", ["Uma maleta", "Um skate", "Uma vara de pesca", "Um livro de receitas"]],
            ["Por que Leorio quer estudar medicina?", ["Para ajudar quem precisa de tratamento", "Para competir na Arena Celestial", "Para recuperar os olhos do clã Kurta", "Para se tornar presidente da Associação"]],
            ["Quem leva um soco de Nen de Leorio durante a eleição da Associação Hunter?", ["Ging", "Hisoka", "Silva", "Hanzo"]],
            ["Qual categoria de Nen combina com o soco que Leorio projeta à distância?", ["Emissão", "Intensificação", "Materialização", "Transmutação"]],
            ["Na Torre dos Truques, qual prisioneira faz apostas com Leorio?", ["Leroute", "Bendot", "Majtani", "Johness"]],
            ["O que Leorio e Leroute usam como aposta durante o desafio?", ["Horas do tempo disponível da equipe", "Distintivos dos candidatos", "Dinheiro do prêmio do exame", "Pontos de uma partida de cartas"]],
            ["Na fase final do primeiro Exame Hunter, quem era o adversário de Leorio quando Killua interferiu?", ["Bodoro", "Hanzo", "Hisoka", "Pokkle"]],
            ["No exame de caça aos distintivos, qual candidata usa cobras e envenena Leorio?", ["Ponzu", "Menchi", "Leroute", "Shizuku"]],
            ["Qual dos quatro amigos viaja com Leorio e Gon à propriedade dos Zoldyck para buscar Killua?", ["Kurapika", "Kite", "Biscuit", "Wing"]],
            ["Por que Leorio confronta Ging durante a eleição?", ["Porque Ging não tinha visitado Gon no hospital", "Porque Ging havia tomado sua licença", "Porque Ging o impediu de prestar o exame", "Porque Ging o desafiou para um duelo"]],
            ["Quem aparece recuperado na reunião e muda o rumo da candidatura de Leorio?", ["Gon", "Killua", "Netero", "Kurapika"]],
            ["Quem vence a eleição em que Leorio se torna finalista?", ["Pariston", "Cheadle", "Mizaistom", "Botobai"]],
            ["Quem usa a técnica de Leorio como inspiração para um golpe no mangá?", ["Ging", "Chrollo", "Kurapika", "Hisoka"]]
        ] },
        { id: "gon", name: "Gon", questions: [
            ["Em que ilha Gon foi criado?", ["Ilha da Baleia", "Greed Island", "Ilha Zevil", "Ilha de Kukuroo"]],
            ["Quem criou Gon?", ["Mito", "Biscuit", "Shizuku", "Komugi"]],
            ["Como se chama o pai de Gon?", ["Ging", "Kite", "Silva", "Morel"]],
            ["Que jogo Gon procura para encontrar pistas sobre seu pai?", ["Greed Island", "Gungi", "Pedra, Papel e Tesoura", "Gungi Online"]],
            ["Qual é a categoria natural de Nen de Gon?", ["Intensificação", "Manipulação", "Emissão", "Especialização"]],
            ["Como se chama a técnica de Gon inspirada em pedra, papel e tesoura?", ["Jajanken", "Godspeed", "Chain Jail", "Dragon Dive"]],
            ["Quem conta a Gon que Ging está vivo?", ["Kite", "Leorio", "Wing", "Knuckle"]],
            ["De quem Gon tenta pegar o distintivo na quarta fase do Exame Hunter?", ["Hisoka", "Hanzo", "Illumi", "Bodoro"]],
            ["Quem é o adversário de Gon em sua luta na fase final do primeiro Exame Hunter?", ["Hanzo", "Bodoro", "Pokkle", "Gittarackur"]],
            ["Quem ensina os fundamentos do Nen a Gon e Killua na Arena Celestial?", ["Wing", "Morel", "Knov", "Basho"]],
            ["Que categoria Gon usa na variante Papel do Jajanken?", ["Emissão", "Materialização", "Manipulação", "Especialização"]],
            ["Quem treina Gon e Killua em Greed Island?", ["Biscuit", "Palm", "Melody", "Kite"]],
            ["Quem lidera a equipe adversária na partida de queimada em Greed Island?", ["Razor", "Genthru", "Tsezguerra", "Binolt"]],
            ["Qual inimigo Gon derrota após sacrificar seu potencial de Nen?", ["Neferpitou", "Youpi", "Shaiapouf", "Colt"]],
            ["Onde Gon conversa com Ging no fim do anime de 2011?", ["No topo da Árvore do Mundo", "Na Torre dos Truques", "Na Arena Celestial", "Na Ilha da Baleia"]]
        ] },
        { id: "kurapika", name: "Kurapika", questions: [
            ["A qual clã Kurapika pertence?", ["Kurta", "Zoldyck", "Kakin", "Freecss"]],
            ["O que Kurapika quer recuperar?", ["Os olhos escarlates", "Uma licença perdida", "As cartas de Greed Island", "O tesouro de Greed Island"]],
            ["Qual grupo atacou o clã de Kurapika?", ["Trupe Fantasma", "Família Zoldyck", "Associação Hunter", "Máfia de Yorknew"]],
            ["Que arma Kurapika materializa?", ["Correntes", "Ioiôs", "Cartas", "Lanças"]],
            ["Qual é a categoria natural de Nen de Kurapika?", ["Materialização", "Emissão", "Intensificação", "Manipulação"]],
            ["Em qual cidade Kurapika confronta a Trupe Fantasma no arco do leilão?", ["Yorknew", "Zaban", "Dolle", "Dolle Harbor"]],
            ["Quem Kurapika protege como guarda-costas durante o arco de Yorknew?", ["Neon Nostrade", "Biscuit Krueger", "Alluka Zoldyck", "Menchi"]],
            ["Qual membro da Trupe Fantasma Kurapika derrota em um duelo em Yorknew?", ["Uvogin", "Feitan", "Phinks", "Nobunaga"]],
            ["Quem fornece informações a Kurapika em Yorknew para tentar lutar contra Chrollo?", ["Hisoka", "Silva", "Genthru", "Leorio"]],
            ["Qual corrente Kurapika prende ao coração para impor uma regra?", ["Corrente do Julgamento", "Corrente da Cura", "Corrente do Polegar", "Corrente Sagrada"]],
            ["Com qual dedo Kurapika usa a Corrente da Prisão?", ["Dedo médio", "Polegar", "Mindinho", "Indicador"]],
            ["A Corrente da Prisão foi restringida a qual grupo de alvos?", ["Membros da Trupe Fantasma", "Todos os usuários de Nen", "Apenas membros da família Zoldyck", "Guardas de Kakin"]],
            ["Que efeito a Corrente da Prisão impõe ao prender seu alvo?", ["Força o alvo a ficar em Zetsu", "Transfere a aura para Kurapika", "Copia a habilidade do alvo", "Amplifica a força do alvo"]],
            ["Em qual categoria Kurapika entra quando seus olhos ficam escarlates?", ["Especialização", "Emissão", "Manipulação", "Transmutação"]],
            ["Qual técnica Kurapika usa para impedir Chrollo de usar Nen após o confronto em Yorknew?", ["Corrente do Julgamento", "Corrente da Cura", "Corrente da Prisão", "Corrente de Dowsing"]]
        ] }
    ];
    const hub = get("qhub");
    const box = get("qbox");
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
            quiz.button.disabled = !result || explainWait(quiz.wait, read(quiz.storageKey, null));
        }
        get("nen-concluido").hidden = !result;
    }
    updateQuizList();
    setInterval(() => {
        if (!hub.hidden) updateQuizList();
    }, 1000);

    function runQuiz(quiz) {
        const isTrivia = Boolean(quiz);
        result = read(resultKey, result);
        updateQuizList();
        if ((quiz ? quiz.button : startNen).disabled) return;
        const total = quiz ? quiz.questions.length : questions.length;
        const scores = nenTypes.map(() => 0);
        const deadline = Date.now() + 4 * 60 * 1000;
        const timer = document.createElement("span");
        timer.className = "tempo-quiz";
        let index = 0;
        let correct = 0;
        let interval;
        let finished = false;
        hub.hidden = true;
        box.hidden = false;

        function finish() {
            if (finished) return;
            finished = true;
            clearInterval(interval);
            if (isTrivia) {
                let summary = index < total ? "O tempo acabou. Questões sem resposta contam como erro." : "Você respondeu a todas as perguntas.";
                const outcome = { correct, total, completedAt: Date.now() };
                try {
                    write(quiz.storageKey, outcome);
                    summary += " Você pode repetir este quiz em 3 horas.";
                } catch {
                    summary += " O navegador não conseguiu salvar a tentativa.";
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
                const previous = read(resultKey, null);
                const type = previous?.type ?? scores.indexOf(Math.max(...scores));
                try {
                    const outcome = previous || { type, scores };
                    if (!previous) write(resultKey, outcome);
                    result = outcome;
                    updateQuizList();
                    box.replaceChildren(card("Seu Nen: " + nenTypes[type], "Afinidade principal de 100%. Seu tipo de Nen é definitivo. Os quizzes de personagens estão liberados."), affinityHexagon(type));
                    const link = navigationLink("dashboard/perfil.html#estatisticas", "Ver estatísticas no perfil");
                    link.className = "botao";
                    box.append(link);
                } catch {
                    box.replaceChildren(card("Seu Nen: " + nenTypes[type], "O navegador não conseguiu salvar o resultado."));
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


if (hunter && get("vbox")) {
    const key = "caminho-do-nen.vow." + current;
    const box = get("vbox");
    box.innerHTML = `<form class="cartao">
        <label for="goal">Meta</label><input id="goal" required maxlength="150">
        <label for="restriction">Restrição</label><textarea id="restriction" required maxlength="300"></textarea>
        <label for="penalty">Penalidade</label><textarea id="penalty" required maxlength="300"></textarea>
        <label for="severity">Severidade da restrição</label>
        <select id="severity"><option>Leve</option><option>Moderada</option><option>Severa</option></select>
        <button>Selar voto</button><p role="status"></p>
    </form><div id="saved-vow"></div>`;
    function updateVow() {
        const vow = read(key, null);
        if (!vow) return;
        const summary = card(vow.goal, "Restrição " + vow.severity.toLowerCase() + " · " + vow.restriction);
        const penalty = document.createElement("p");
        penalty.textContent = "Penalidade: " + vow.penalty;
        summary.append(penalty);
        get("saved-vow").replaceChildren(summary);
        Object.keys(vow).forEach(field => { get(field).value = vow[field]; });
    }
    updateVow();
    box.querySelector("form").onsubmit = event => {
        event.preventDefault();
        const fields = ["goal", "restriction", "penalty", "severity"];
        if (fields.some(field => !value(field))) {
            box.querySelector("[role=status]").textContent = "Preencha todos os campos do voto.";
            return;
        }
        try {
            write(key, Object.fromEntries(fields.map(field => [field, value(field)])));
            updateVow();
            box.querySelector("[role=status]").textContent = "Voto salvo.";
        } catch {
            box.querySelector("[role=status]").textContent = "O navegador não conseguiu salvar o voto.";
        }
    };
}

if (hunter && get("bform")) {
    const key = preview ? "caminho-do-nen.preview.creatures" : "caminho-do-nen.creatures";
    const form = get("bform");
    const list = get("blist");
    const categories = {
        bp: ["Baixo", "Moderado", "Alto", "Extremo"],
        bev: ["Baixo", "Moderado", "Alto"],
        bt: ["Animal", "Besta mágica", "Quimera", "Outro"],
        bh: ["Floresta", "Montanha", "Água", "Deserto", "Outro"],
        bo: ["Pequeno", "Médio", "Grande"],
        bc: ["Dócil", "Territorial", "Agressivo", "Desconhecido"],
        bnn: ["Desconhecida", ...nenTypes]
    };
    for (const [id, options] of Object.entries(categories)) {
        get(id).replaceChildren(...options.map(label => new Option(label)));
    }
    get("ftipo").replaceChildren(new Option("Todos os tipos", ""), ...categories.bt.map(label => new Option(label)));
    get("fper").replaceChildren(new Option("Todos os níveis de perigo", ""), ...categories.bp.map(label => new Option(label)));
    function renderCreatures() {
        const entries = read(key, []).filter(item =>
            (!value("ftipo") || item.bt === value("ftipo")) && (!value("fper") || item.bp === value("fper")));
        get("bcount").textContent = entries.length + (entries.length === 1 ? " criatura" : " criaturas");
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
    get("bnew").disabled = false;
    get("bnew").onclick = () => { form.hidden = false; get("bn").focus(); };
    get("bcancel").onclick = () => { form.reset(); form.hidden = true; get("bnew").focus(); };
    get("ftipo").onchange = renderCreatures;
    get("fper").onchange = renderCreatures;
    form.onsubmit = event => {
        event.preventDefault();
        const feedback = get("bd").nextElementSibling;
        if (!value("bd")) {
            feedback.textContent = "Descreva a criatura.";
            return;
        }
        const entries = read(key, []);
        entries.unshift({
            name: value("bn") || "Criatura sem nome", description: value("bd"), author: hunter.name,
            ...Object.fromEntries(Object.keys(categories).map(id => [id, value(id)]))
        });
        try {
            write(key, entries);
            feedback.textContent = "";
            form.reset();
            form.hidden = true;
            get("bnew").focus();
            renderCreatures();
        } catch {
            feedback.textContent = "O navegador não conseguiu salvar a criatura.";
        }
    };
    get("ftipo").parentElement.hidden = false;
    renderCreatures();
}
