const contratantesData = require("./data.json");
const stringSimilarity = require("string-similarity");

const SIMILARITY_THRESHOLD = 0.35;

// ===== FUNCIONES ===== //

function findSimilarContratantes(data, inputContratante) {
  let similarities = [];

  for (let i = 0; i < data.length; i++) {
    const contratante = data[i]["CONTRATANTE"].toUpperCase();
    const similarityScore = Number(
      stringSimilarity.compareTwoStrings(contratante, inputContratante.toUpperCase())
    ).toFixed(2);

    similarities.push({
      SISTEMA: data[i]["SISTEMA"],
      SEGMENTO: data[i]["SEGMENTO"],
      CONTRATANTE: data[i]["CONTRATANTE"],
      IDENTIFICACION: data[i]["IDENTIFICACION"],
      PLAZA: data[i]["PLAZA"],
      CANAL: data[i]["CANAL DISTRIBUCION"],
      similarityScore
    });
  }

  similarities.sort((a, b) => b.similarityScore - a.similarityScore);
  return similarities.slice(0, 3); // top 3
}

// ===== VARIABLES ===== //

let boton = document.getElementById("submit");
let clearButton = document.getElementById("clear-button");
let resultadoDiv = document.getElementById("resultado");
let finalTableDiv = document.getElementById("final-table");
let searchInput = document.getElementById("search-input");
let manualResults = document.getElementById("manual-results");

let selectedPerLine = {}; // one selection per input line
let manualSelected = {};  // for global manual search

// ===== EVENTOS ===== //

boton.addEventListener("click", () => {
  resultadoDiv.innerHTML = "";
  finalTableDiv.innerHTML = "";
  selectedPerLine = {};

  let texto = document.getElementById("texto").value;
  let arrtxt = texto.split("\n").map((elem) => {
    return elem.replace("-", " ").trim().toUpperCase();
  });

  arrtxt.forEach((element, idx) => {
    if (element !== "") {
      let similist = findSimilarContratantes(contratantesData, element);

      let buttonsHtml = similist
        .map(
          (s) =>
            `<div class="col-2">
              <button class="contratante-but btn btn-outline-primary w-100" 
                data-line="${idx}" 
                data-sistema="${s.SISTEMA}" 
                data-segmento="${s.SEGMENTO}"
                data-contratante="${s.CONTRATANTE}" 
                data-identificacion="${s.IDENTIFICACION}"
                data-plaza="${s.PLAZA}"
                data-canal="${s.CANAL}"
                data-score="${s.similarityScore}">
                ${s.CONTRATANTE}
              </button>
            </div>`
        )
        .join("");

      let searchHtml = `
        <div class="col-3">
          <input type="text" class="form-control mini-search" autocomplete="off" 
            placeholder="Buscar manualmente..." 
            data-line="${idx}">
          <div class="mini-results list-group mt-1" data-line="${idx}"></div>
        </div>
      `;

      let rowHtml = `
        <div class="row py-2 align-items-center" data-line="${idx}">
          <div class="col-3">${element} ⇒ </div>
          ${buttonsHtml}
          ${searchHtml}
        </div>`;

      resultadoDiv.innerHTML += rowHtml;
    }
  });

  attachButtonEvents();
  attachMiniSearchEvents();
  autoActivateAboveThreshold();
});

clearButton.addEventListener("click", () => {
  document.getElementById("texto").value = "";
  resultadoDiv.innerHTML = "";
  finalTableDiv.innerHTML = "";
  selectedPerLine = {};
  manualSelected = {};
});

// ===== GLOBAL MANUAL SEARCH ===== //

searchInput.addEventListener("input", () => {
  let filtertxt = searchInput.value.toUpperCase();
  manualResults.innerHTML = "";

  if (filtertxt.length < 2) return;

  let filtered = contratantesData.filter((c) =>
    c["CONTRATANTE"].toUpperCase().includes(filtertxt)
  );

  filtered.slice(0, 10).forEach((c) => {
    manualResults.innerHTML += `
      <div class="col-12 mb-2">
        <button class="manual-but btn btn-outline-secondary w-100"
          data-sistema="${c.SISTEMA}"
          data-segmento="${c.SEGMENTO}"
          data-contratante="${c.CONTRATANTE}"
          data-identificacion="${c.IDENTIFICACION}"
          data-plaza="${c.PLAZA}"
          data-canal="${c["CANAL DISTRIBUCION"]}">
          ${c.CONTRATANTE} (${c.IDENTIFICACION})
        </button>
      </div>
    `;
  });

  attachManualButtonEvents();
});

// ===== HELPERS ===== //

function attachButtonEvents() {
  let listbut = document.querySelectorAll(".contratante-but");

  for (let but of listbut) {
    but.addEventListener("click", () => {
      let line = but.dataset.line;
      let parentRow = document.querySelector(`.row[data-line="${line}"]`);

      let rowButtons = parentRow.querySelectorAll(".contratante-but");
      rowButtons.forEach((b) => b.classList.remove("active", "btn-primary"));
      rowButtons.forEach((b) => b.classList.add("btn-outline-primary"));

      but.classList.add("active", "btn-primary");
      but.classList.remove("btn-outline-primary");

      selectedPerLine[line] = {
        SISTEMA: but.dataset.sistema,
        SEGMENTO: but.dataset.segmento,
        CONTRATANTE: but.dataset.contratante,
        IDENTIFICACION: but.dataset.identificacion,
        PLAZA: but.dataset.plaza,
        CANAL: but.dataset.canal
      };

      renderFinalTable();
    });
  }
}

function attachManualButtonEvents() {
  let manualButList = document.querySelectorAll(".manual-but");

  for (let but of manualButList) {
    but.addEventListener("click", () => {
      let obj = {
        SISTEMA: but.dataset.sistema,
        SEGMENTO: but.dataset.segmento,
        CONTRATANTE: but.dataset.contratante,
        IDENTIFICACION: but.dataset.identificacion,
        PLAZA: but.dataset.plaza,
        CANAL: but.dataset.canal
      };

      let key = "manual-" + obj.CONTRATANTE + "-" + obj.IDENTIFICACION;
      selectedPerLine[key] = obj;

      renderFinalTable();
    });
  }
}

function attachMiniSearchEvents() {
  let inputs = document.querySelectorAll(".mini-search");

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      let line = input.dataset.line;
      let filtertxt = input.value.toUpperCase();
      let resultsDiv = document.querySelector(`.mini-results[data-line="${line}"]`);
      resultsDiv.innerHTML = "";

      if (filtertxt.length < 2) return;

      let filtered = contratantesData.filter((c) =>
        c["CONTRATANTE"].toUpperCase().includes(filtertxt)
      );

      filtered.slice(0, 5).forEach((c) => {
        let btn = document.createElement("button");
        btn.className = "list-group-item list-group-item-action";
        btn.textContent = `${c.CONTRATANTE} (${c.IDENTIFICACION})`;
        btn.dataset.sistema = c.SISTEMA;
        btn.dataset.segmento = c.SEGMENTO;
        btn.dataset.contratante = c.CONTRATANTE;
        btn.dataset.identificacion = c.IDENTIFICACION;
        btn.dataset.canal = c["CANAL DISTRIBUCION"];
        btn.dataset.plaza = c.PLAZA

        btn.addEventListener("click", () => {
          selectedPerLine[line] = {
            SISTEMA: btn.dataset.sistema,
            SEGMENTO: btn.dataset.segmento,
            CONTRATANTE: btn.dataset.contratante,
            IDENTIFICACION: btn.dataset.identificacion,
            PLAZA: btn.dataset.plaza,
            CANAL: btn.dataset.canal
          };

          resultsDiv.innerHTML = "";
          input.value = btn.dataset.contratante;

          let row = document.querySelector(`.row[data-line="${line}"]`);
          let rowButtons = row.querySelectorAll(".contratante-but");
          rowButtons.forEach((b) => b.classList.remove("active", "btn-primary"));
          rowButtons.forEach((b) => b.classList.add("btn-outline-primary"));

          renderFinalTable();
        });

        resultsDiv.appendChild(btn);
      });
    });
  });
}

function renderFinalTable() {
  // Merge selectedPerLine and manualSelected
  let values = [...Object.values(selectedPerLine), ...Object.values(manualSelected)];

  if (values.length === 0) {
    finalTableDiv.innerHTML = "";
    return;
  }

  // Remove duplicates by key (CONTRATANTE + IDENTIFICACION)
  let uniqueMap = {};
  values.forEach((r) => {
    let key = r.CONTRATANTE + "-" + r.IDENTIFICACION;
    uniqueMap[key] = r;
  });
  let uniqueValues = Object.values(uniqueMap);

  // Generate table HTML
  let tableHtml = `
    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th>CONTRATANTE</th>
          <th>IDENTIFICACION</th>
          <th>SEGMENTO</th>
          <th>PLAZA</th>
          <th>SISTEMA</th>
          <th>CANAL</th>
        </tr>
      </thead>
      <tbody>
        ${uniqueValues
      .map(
        (r) =>
          `<tr>
              <td>${r.CONTRATANTE}</td>
              <td>${r.IDENTIFICACION}</td>
              <td class='${r.SEGMENTO}'>${r.SEGMENTO}</td>
              <td>${r.PLAZA}</td>
              <td>${r.SISTEMA}</td>
              <td>${r.CANAL}</td>
            </tr>`
      )
      .join("")}
      </tbody>
    </table>
  `;

  finalTableDiv.innerHTML = tableHtml;
}

function autoActivateAboveThreshold() {
  let rows = document.querySelectorAll("#resultado .row");
  rows.forEach((row) => {
    let buttons = row.querySelectorAll(".contratante-but");
    if (buttons.length > 0) {
      let best = buttons[0];
      let score = parseFloat(best.dataset.score);
      if (score > SIMILARITY_THRESHOLD) {
        best.click();
      }
    }
  });
}

