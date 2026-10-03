/* ===== RESERVAS ===== */
const form = document.getElementById("form-reserva");
const modal = document.getElementById("modal");
const botaoFechar = document.getElementById("fechar-modal");
const campoData = document.querySelector('input[type="date"]');

campoData.min = new Date().toISOString().split("T")[0];

const erroReserva = document.getElementById("erro-reserva");
const botaoEnviar = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  erroReserva.textContent = "";
  botaoEnviar.disabled = true;

  const dados = Object.fromEntries(new FormData(form));

  try {
    const resposta = await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    const resultado = await resposta.json();

    if (resposta.ok) {
      modal.hidden = false;
      form.reset();
    } else if (resultado.erros) {
      erroReserva.textContent = Object.values(resultado.erros).join(" ");
    } else {
      erroReserva.textContent = resultado.mensagem || "Não foi possível enviar. Tente novamente.";
    }
  } catch (e) {
    erroReserva.textContent = "Não foi possível falar com o servidor. Tente novamente em instantes.";
  } finally {
    botaoEnviar.disabled = false;
  }
});

botaoFechar.addEventListener("click", function () {
  modal.hidden = true;
});


/* ===== CARDÁPIO: expandir/recolher detalhes do prato ===== */
const nomesPratos = document.querySelectorAll("#cardapio .prato-nome");

function alternarPrato(nome) {
  const aberto = nome.classList.toggle("aberto");
  nome.setAttribute("aria-expanded", aberto ? "true" : "false");
  nome.closest(".prato-info").querySelector(".detalhes").classList.toggle("aberto");
}

nomesPratos.forEach(function (nome) {
  nome.addEventListener("click", function () {
    alternarPrato(nome);
  });

  nome.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      alternarPrato(nome);
    }
  });
});
