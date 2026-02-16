//Olá, esse é o interpretador do anery, ainda tem bugs e coisas a resolver, anery ainda está em desenvolvimento então o interpretador não estará 100% correto até o desenvolvimento completo

const fs = require("fs");

const vars = {};

function gerarTexto(tamanho) {
    const letras = "abcdefghijklmnopqrstuvwxyz";
    let len = tamanho === "aleatorio" ? Math.floor(Math.random() * 8) + 3 : Number(tamanho);
    let resultado = "";
    for (let i = 0; i < len; i++) {
        resultado += letras[Math.floor(Math.random() * letras.length)];
    }
    return resultado;
}

function gerarNumero(max) {
    let m = max === "aleatorio" ? 100 : Number(max);
    return Math.floor(Math.random() * m);
}

function pegarValor(valor) {
    if (!valor) return "";
    valor = valor.trim();
    // Se for variável (nome)
    if (valor.startsWith("(") && valor.endsWith(")")) {
        let nome = valor.slice(1, -1);
        let v = vars[nome];
        return isNaN(v) ? v : Number(v);
    }
    // Se for literal {valor}
    if (valor.startsWith("{") && valor.endsWith("}")) {
        let conteudo = valor.slice(1, -1);
        return isNaN(conteudo) ? conteudo : Number(conteudo);
    }
    return isNaN(valor) ? valor : Number(valor);
}

function executarLinha(linha) {
    linha = linha.trim();
    if (!linha || linha.startsWith("#")) return;

    // Lida com o encadeamento por ponto "."
    // Ex: gerar.num {10} = res.console.env (res)
    if (linha.includes(".") && !linha.startsWith("console.") && !linha.startsWith("gerar.")) {
        let partes = linha.split(".");
        partes.forEach(p => executarLinha(p));
        return;
    }

    // Atribuição de variável: (nome {valor})
    if (linha.startsWith("(") && linha.includes("{")) {
        let match = linha.match(/\((.+?)\)\s*\{(.+?)\}/);
        if (match) vars[match[1]] = match[2];
    }

    // console.env
    else if (linha.startsWith("console.env")) {
        // Suporte para o caractere ^ e variáveis mistas
        let conteudo = linha.replace("console.env", "").trim();
        
        // Se contiver ^, remove-os e processa as variáveis ()
        if (conteudo.includes("^")) {
            let finalStr = conteudo.replace(/\^/g, "");
            // Substitui (variavel) pelo valor real
            finalStr = finalStr.replace(/\((.+?)\)/g, (match, nome) => vars[nome] || "");
            console.log(finalStr);
        } else {
            console.log(pegarValor(conteudo));
        }
    }

    // calc (a) + (b) = res
    else if (linha.startsWith("calc")) {
        let match = linha.match(/calc\s+(.+?)\s*([\+\-\*\/\>\<])\s*(.+?)\s*=\s*(.+)/);
        if (match) {
            let a = pegarValor(match[1]);
            let op = match[2];
            let b = pegarValor(match[3]);
            let destino = match[4].trim();
            let res;

            if (op === "+") res = a + b;
            if (op === "-") res = a - b;
            if (op === "*") res = a * b;
            if (op === "/") res = a / b;
            if (op === ">") res = a > b;
            if (op === "<") res = a < b;

            vars[destino] = res;
        }
    }

    // gerar.num ou gerar.texto
    else if (linha.startsWith("gerar.")) {
        let match = linha.match(/gerar\.(num|texto)\s*\{(.+?)\}\s*=\s*(.+)/);
        if (match) {
            let tipo = match[1];
            let param = match[2];
            let destino = match[3].trim();
            vars[destino] = (tipo === "num") ? gerarNumero(param) : gerarTexto(param);
        }
    }
}

function executarArquivo(nome) {
    try {
        let codigo = fs.readFileSync(nome, "utf8");
        // Remove colchetes de bloco [] conforme a doc
        codigo = codigo.replace(/[\[\]]/g, "");
        let linhas = codigo.split("\n");
        for (let linha of linhas) {
            executarLinha(linha);
        }
    } catch (err) {
        console.error("Erro ao ler o arquivo:", err.message);
    }
}

executarArquivo(process.argv[2]);