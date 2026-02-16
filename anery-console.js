// anery.js - Versão com Console Interativo (REPL)
const fs = require("fs");
const readline = require("readline");

const vars = {};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function perguntar(pergunta) {
    return new Promise((resolve) => {
        rl.question(pergunta, (resposta) => {
            resolve(resposta);
        });
    });
}

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
    if (valor.startsWith("(") && valor.endsWith(")")) {
        let nome = valor.slice(1, -1);
        let v = vars[nome];
        return isNaN(v) ? v : Number(v);
    }
    if (valor.startsWith("{") && valor.endsWith("}")) {
        let conteudo = valor.slice(1, -1);
        return isNaN(conteudo) ? conteudo : Number(conteudo);
    }
    return isNaN(valor) ? valor : Number(valor);
}

async function executarLinha(linha) {
    linha = linha.trim();
    if (!linha || linha.startsWith("#")) return; // Suporte a comentários 

    if (linha.includes(".") && !linha.startsWith("console.") && !linha.startsWith("gerar.")) {
        let partes = linha.split(".");
        for (let parte of partes) {
            await executarLinha(parte);
        }
        return;
    }

    if (linha.startsWith("(") && linha.includes("{")) {
        let match = linha.match(/\((.+?)\)\s*\{(.+?)\}/);
        if (match) {
            let nome = match[1];
            let valor = match[2];
            if (valor === "entrada") {
                vars[nome] = await perguntar(`Digite o valor para ${nome}: `);
            } else {
                vars[nome] = valor;
            }
        }
    }

    else if (linha.startsWith("entrada")) {
        let match = linha.match(/entrada\s*\((.+?)\)/);
        if (match) {
            let nomeVar = match[1];
            vars[nomeVar] = await perguntar(`Digite o valor para ${nomeVar}: `);
        }
    }

    else if (linha.startsWith("digitar")) {
        let match = linha.match(/digitar\s*\(\s*(.+?)\s*,\s*(.+?)\s*\)/);
        if (match) {
            let mensagem = pegarValor(match[1]);
            let destino = match[2].trim();
            vars[destino] = await perguntar(mensagem + " ");
        }
    }

    else if (linha.startsWith("console.env")) {
        let conteudo = linha.replace("console.env", "").trim();
        if (conteudo.includes("^")) {
            let finalStr = conteudo.replace(/\^/g, "");
            finalStr = finalStr.replace(/\((.+?)\)/g, (match, nome) => vars[nome] || "");
            console.log(finalStr);
        } else {
            console.log(pegarValor(conteudo));
        }
    }

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

    else if (linha.startsWith("gerar.")) {
        let match = linha.match(/gerar\.(num|texto)\s*\{(.+?)\}\s*=\s*(.+)/);
        if (match) {
            let tipo = match[1];
            let param = match[2];
            let destino = match[3].trim();
            vars[destino] = (tipo === "num") ? gerarNumero(param) : gerarTexto(param);
        }
    }

    else if (linha.startsWith("tempo")) {
        let match = linha.match(/tempo\s*\{\s*(\d+)\s*\}\s*(.+)/);
        if (match) {
            let segundos = parseInt(match[1]) * 1000;
            let comando = match[2];
            await new Promise(resolve => setTimeout(resolve, segundos));
            await executarLinha(comando);
        }
    }
}

// --- NOVIDADE: FUNÇÃO PARA O CONSOLE INTERATIVO ---
async function iniciarConsoleInterativo() {
    console.log("--- Anery Interpretador Rev 0.5 ---");
    console.log("Digite seus comandos ou 'sair' para encerrar.");
    
    const loop = async () => {
        const linha = await perguntar("anery> ");
        if (linha.toLowerCase() === "sair") {
            rl.close();
            return;
        }
        await executarLinha(linha);
        loop(); // Chama o próximo comando
    };
    
    loop();
}

async function executarArquivo(nome) {
    try {
        let codigo = fs.readFileSync(nome, "utf8");
        let blocos = codigo.match(/\[([^\]]+)\]/g);
        
        if (blocos) {
            for (let bloco of blocos) {
                let conteudoBloco = bloco.slice(1, -1);
                let linhas = conteudoBloco.split("\n");
                for (let linha of linhas) {
                    await executarLinha(linha);
                }
            }
        } else {
            let linhas = codigo.split("\n");
            for (let linha of linhas) {
                await executarLinha(linha);
            }
        }
        rl.close();
    } catch (err) {
        console.error("Erro ao ler o arquivo:", err.message);
        rl.close();
    }
}

// Lógica de Inicialização
if (process.argv[2]) {
    executarArquivo(process.argv[2]);
} else {
    // Se você apenas digitar 'node anery.js', ele abre o console
    iniciarConsoleInterativo();
}