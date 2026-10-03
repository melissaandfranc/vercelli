const express = require("express");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const db = new DatabaseSync(path.join(__dirname, "reservas.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    data TEXT NOT NULL,
    pessoas TEXT NOT NULL,
    observacoes TEXT NOT NULL DEFAULT '',
    criada_em TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
const inserirReserva = db.prepare(
  "INSERT INTO reservas (nome, telefone, data, pessoas, observacoes) VALUES (?, ?, ?, ?, ?)"
);

const app = express();
const PORTA = 3000;

// Permite ler dados em JSON enviados pelo front
app.use(express.json());

const rateLimit = require("express-rate-limit");

// Reservas: no máximo 3 envios por hora para cada pessoa (IP)
const limiteReservas = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  skipFailedRequests: true, // recusas de validação (400) não contam
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    ok: false,
    mensagem: "Você atingiu o limite de reservas por hora. Para mais mesas, ligue para (11) 4002-8922.",
  },
});

// Admin: só conta as tentativas que falham (senha errada)
const limiteAdmin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: "Muitas tentativas de login. Aguarde alguns minutos.",
});

app.use("/api/reservas", limiteReservas);

// Serve o seu site (HTML, CSS, JS, imagens) pelo servidor
app.use(
  express.static(path.join(__dirname, "..", "Vercelli", "Completo"), {
    index: "vercelli.html",
  })
);

// Serve a pasta de imagens, que fica ao lado da pasta Completo
app.use("/imagens", express.static(path.join(__dirname, "..", "Vercelli", "imagens")));

// Rota de teste
app.get("/api/saude", (req, res) => {
  res.json({ ok: true, mensagem: "Servidor funcionando!" });
});

// ---------- RESERVAS ----------
const PESSOAS_VALIDAS = ["1", "2", "3", "4", "5+"];

function hojeEmSaoPaulo() {
  // devolve a data de hoje no formato AAAA-MM-DD
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

function validarReserva(corpo) {
  const erros = {};

  const nome = String(corpo.nome ?? "").trim();
  const telefone = String(corpo.telefone ?? "").trim();
  const data = String(corpo.data ?? "").trim();
  const pessoas = String(corpo.pessoas ?? "").trim();
  const observacoes = String(corpo.observacoes ?? "").trim();

  if (nome.length < 2 || nome.length > 100) {
    erros.nome = "Informe seu nome (de 2 a 100 caracteres).";
  }

  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 11) {
    erros.telefone = "Telefone inválido. Use o DDD + número.";
  }

  const d = new Date(data + "T12:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data) || isNaN(d) || d.toISOString().slice(0, 10) !== data) {
    erros.data = "Escolha uma data válida.";
  } else if (data < hojeEmSaoPaulo()) {
    erros.data = "A data não pode estar no passado.";
  } else if (d.getUTCDay() === 1) {
    erros.data = "Fechamos às segundas-feiras."; // tire este bloco se quiser aceitar segunda
  }

  if (!PESSOAS_VALIDAS.includes(pessoas)) {
    erros.pessoas = "Escolha o número de pessoas.";
  }

  if (observacoes.length > 500) {
    erros.observacoes = "As observações podem ter até 500 caracteres.";
  }

  return { erros, dados: { nome, telefone: digitos, data, pessoas, observacoes } };
}

app.post("/api/reservas", (req, res) => {
  const { erros, dados } = validarReserva(req.body ?? {});

  if (Object.keys(erros).length > 0) {
    return res.status(400).json({ ok: false, erros });
  }

  try {
    const r = inserirReserva.run(
      dados.nome, dados.telefone, dados.data, dados.pessoas, dados.observacoes
    );
    res.status(201).json({ ok: true, id: Number(r.lastInsertRowid), mensagem: "Reserva recebida!" });
  } catch (e) {
    console.error("Erro ao salvar reserva:", e);
    res.status(500).json({ ok: false, mensagem: "Não foi possível salvar. Tente novamente." });
  }
});

// ---------- ÁREA ADMIN ----------
const crypto = require("node:crypto");

function iguais(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function autenticar(req, res, next) {
  const usuario = process.env.ADMIN_USUARIO;
  const senha = process.env.ADMIN_SENHA;
  if (!usuario || !senha) {
    return res.status(503).send("Área administrativa não configurada.");
  }

  const [tipo, credenciais] = (req.headers.authorization || "").split(" ");
  if (tipo === "Basic" && credenciais) {
    const texto = Buffer.from(credenciais, "base64").toString("utf8");
    const i = texto.indexOf(":");
    if (i >= 0 && iguais(texto.slice(0, i), usuario) && iguais(texto.slice(i + 1), senha)) {
      res.set("Cache-Control", "no-store");
      return next();
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="Vercelli Admin", charset="UTF-8"');
  res.status(401).send("Acesso restrito.");
}

app.use(["/admin", "/api/admin"], limiteAdmin, autenticar);

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/api/admin/reservas", (req, res) => {
  const linhas = db
    .prepare("SELECT id, nome, telefone, data, pessoas, observacoes, criada_em FROM reservas ORDER BY data ASC, id ASC")
    .all();
  res.json(linhas);
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});