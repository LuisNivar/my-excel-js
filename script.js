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
const $formulaBar = getElement("#formula-bar");

// Get td
$body.addEventListener("click", (event) => {
  const td = event.target.closest("td");
  if (!td) return;

  const tr = td.parentNode;
  const indexColumn = [...tr.children].indexOf(td);

  if (indexColumn === 0) {
    const rows = [...tr.children];
    removeSelection();
    tr.classList.add("selected");
    rows.forEach((cell) => cell.classList.add("selected"));
    selection.row = Number(td.innerText) - 1;
    $formulaBar.value = "";
    return;
  }

  removeSelection();
  td.classList.add("selected");
  const { x, y } = td.dataset;
  selection.column = x;
  selection.row = y;
  $formulaBar.value = STATE[x][y].value;
});

$body.addEventListener("dblclick", (event) => {
  const td = event.target.closest("td");
  if (!td) return;

  const { x, y } = td.dataset;
  const $input = td.querySelector("input");

  const endChar = $input.value.length;
  $input.setSelectionRange(endChar, endChar);
  $input.focus();
  $formulaBar.value = $input.value;

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
  const indexColumn = [...th.parentNode.children].indexOf(th);

  // prevent error when click in RowHeaders
  if (indexColumn === 0) return;

  // reset state
  removeSelection();

  const selectedRows = getElements(`tr td:nth-child(${indexColumn + 1})`);
  th.classList.add("selected");
  selectedRows.forEach((el) => el.classList.add("selected"));
  selection.column = indexColumn - 1;
  $formulaBar.value = "";
});

document.addEventListener("keydown", (event) => {
  const isBackSpace = event.key === "Backspace";
  const isColumnSelected = selection.column !== null && selection.row === null;
  const isRowSelected = selection.column === null && selection.row !== null;
  const isCellSelected = !isColumnSelected && !isRowSelected;

  if (isBackSpace && isColumnSelected) {
    range(ROWS).forEach((row) => {
      updateCell({ x: selection.column, y: row, value: 0 });
    });
    renderTable();
    selection.column = null;
    $formulaBar.value = "";
  }

  if (isBackSpace && isRowSelected) {
    range(COLUNMS).forEach((colmn) => {
      updateCell({ x: colmn, y: selection.row, value: 0 });
    });
    renderTable();
    selection.row = null;
    $formulaBar.value = "";
  }

  if (isBackSpace && isCellSelected) {
    updateCell({ x: selection.column, y: selection.row, value: 0 });
    renderTable();
    selection.column = null;
    selection.row = null;
    $formulaBar.value = "";
  }
});

document.addEventListener("copy", (event) => {
  const isColumnSelected = selection.column !== null && selection.row === null;
  const isRowSelected = selection.column === null && selection.row !== null;
  const isCellSelected = !isColumnSelected && !isRowSelected;

  if (isColumnSelected) {
    const columnValues = range(ROWS).map((row) => {
      return STATE[selection.column][row].computedValue;
    });

    event.clipboardData.setData("text/plain", columnValues.join("\n"));
    event.preventDefault();
  }

  if (isRowSelected) {
    const rowValues = range(COLUNMS).map((column) => {
      return STATE[column][selection.row].computedValue;
    });

    event.clipboardData.setData("text/plain", rowValues.join(";"));
    event.preventDefault();
  }

  if (isCellSelected) {
    const cellValue = STATE[selection.column][selection.row].computedValue;
    event.clipboardData.setData("text/plain", cellValue);
    event.preventDefault();
  }
});

document.addEventListener("click", ({ target }) => {
  const isThClicked = target.closest("th");
  const isTdClicked = target.closest("td");

  if (!isThClicked && !isTdClicked) {
    removeSelection();
    $formulaBar.value = "";
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
