const express = require("express");
const path = require("path");

const app = express();
const PORTA = 3000;

// Permite ler dados em JSON enviados pelo front
app.use(express.json());

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

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});