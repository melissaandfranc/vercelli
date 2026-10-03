const nomes = document.querySelectorAll(".prato-nome");

function alternarPrato(nome) {
    const aberto = nome.classList.toggle("aberto");
    nome.setAttribute("aria-expanded", aberto ? "true" : "false");
    nome.closest(".prato-info").querySelector(".detalhes").classList.toggle("aberto");
}

nomes.forEach(function (nome) {
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