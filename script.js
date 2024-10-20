import { getElement, getElements, range } from "./modules/utils.js";
import {
  generateState,
  getColumnLetter,
  computeValue,
  selection,
  removeSelection,
  generateConstantsCell,
  computeAllCells,
} from "./modules/helpers.js";
import { ROWS, COLUNMS, DIAGONAL_ARROW } from "./modules/constants.js";

let STATE = generateState();

const $table = getElement(".main-table");
const $head = getElement(".head-table");
const $body = getElement(".body-table");

// Get td
$body.addEventListener("click", (event) => {
  const td = event.target.closest("td");
  if (!td) return;

  const col = [...td.parentNode.children].indexOf(td);
  if (col <= 0) {
    const tr = td.parentNode;
    const row = [...tr.children];

    removeSelection();
    tr.classList.add("selected");
    row.forEach((cell) => cell.classList.add("selected"));
    selection.row = Number(td.innerText) - 1;
    return;
  }

  const { x, y } = td.dataset;
  const $input = td.querySelector("input");
  const $span = td.querySelector("span");

  const endChar = $input.value.length;
  $input.setSelectionRange(endChar, endChar);
  $input.focus();
  removeSelection();

  // Inputs events
  $input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      $input.blur();
    }
  });

  $input.addEventListener(
    "blur",
    () => {
      if ($input.value === STATE[x][y].value) {
        return;
      }

      updateCell({ x, y, value: $input.value.toLowerCase() });
    },
    { once: true }
  );
});

$head.addEventListener("click", (event) => {
  const th = event.target.closest("th");
  if (!th) return;
  const index = [...th.parentNode.children].indexOf(th);

  // prevent error when click in RowHeaders
  if (index <= 0) return;

  // reset state
  removeSelection();

  const selectedRows = getElements(`tr td:nth-child(${index + 1})`);
  th.classList.add("selected");
  selectedRows.forEach((el) => el.classList.add("selected"));
  selection.column = index - 1;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Backspace" && selection.column !== null) {
    range(ROWS).forEach((row) => {
      updateCell({ x: selection.column, y: row, value: 0 });
    });
    renderTable();
    selection.column = null;
  }

  if (event.key === "Backspace" && selection.row !== null) {
    range(COLUNMS).forEach((colmn) => {
      updateCell({ x: colmn, y: selection.row, value: 0 });
    });
    renderTable();
    selection.row = null;
  }
});

document.addEventListener("copy", (event) => {
  if (selection.column !== null) {
    const columnValues = range(ROWS).map((row) => {
      return STATE[selection.column][row].computedValue;
    });

    event.clipboardData.setData("text/plain", columnValues.join("\n"));
    event.preventDefault();
  }

  if (selection.row !== null) {
    const rowValues = range(COLUNMS).map((column) => {
      return STATE[column][selection.row].computedValue;
    });

    event.clipboardData.setData("text/plain", rowValues.join(";"));
    event.preventDefault();
  }
});

document.addEventListener("click", ({ target }) => {
  const isThClicked = target.closest("th");
  const isTdClicked = target.closest("td");

  if (!isThClicked && !isTdClicked) {
    removeSelection();
  }
});

const renderTable = () => {
  const headerHTML = `
    <tr>
        <th>${DIAGONAL_ARROW}</th>
        ${range(COLUNMS)
          .map((i) => `<th>${getColumnLetter(i)}</th>`)
          .join("")}
    </tr>`;

  $head.innerHTML = headerHTML;

  const bodyHtml = range(ROWS)
    .map((row) => {
      return `
        <tr>
            <td>${row + 1}</td>
            ${range(COLUNMS)
              .map(
                (col) => `
                <td data-x="${col}" data-y="${row}">
                  	<span>${STATE[col][row].computedValue}</span> 
                    <input type="text" name="${col}-${row}" value="${STATE[col][row].value}" />
                </td>`
              )
              .join("")}
        </tr>`;
    })
    .join("");

  $body.innerHTML = bodyHtml;
};

const updateCell = ({ x, y, value }) => {
  const newState = structuredClone(STATE);
  const constants = generateConstantsCell(newState);

  const cell = newState[x][y];
  const computedValue = computeValue(value, constants);
  cell.computedValue = computedValue;
  cell.value = value;

  newState[x][y] = cell;

  // update constants
  computeAllCells(newState, generateConstantsCell(newState));
  STATE = newState;

  renderTable();
};

renderTable();
