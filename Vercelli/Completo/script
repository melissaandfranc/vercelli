/* ===== RESERVAS ===== */
const form = document.getElementById("form-reserva");
const modal = document.getElementById("modal");
const botaoFechar = document.getElementById("fechar-modal");
const campoData = document.querySelector('input[type="date"]');

campoData.min = new Date().toISOString().split("T")[0];

form.addEventListener("submit", function (evento) {
  evento.preventDefault();
  modal.hidden = false;
  form.reset();
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
