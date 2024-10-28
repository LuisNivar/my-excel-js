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
const $toggleBold = getElement(".bold");
const $toggleItalic = getElement(".italic");

//#region CELL CLICK
$body.addEventListener("click", (event) => {
  const td = event.target.closest("td");
  if (!td) return;

  const { format } = td.dataset;
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

  // Selection
  removeSelection();
  td.classList.add("selected");
  const { x, y } = td.dataset;
  selection.column = x;
  selection.row = y;

  // Formula Bar
  $formulaBar.value = STATE[x][y].value;
  // Tool Bar
  updateToolBar(format);
  STATE[x][y].format = format;
});

//#endregion

//#region CEL DOUBLE CLICK
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

      updateCell({ x, y, value: $input.value });
    },
    { once: true }
  );
});
//#endregion

//#region C-HEADER CLICK
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

//#endregion

//#region  DOM KEY DOWN
document.addEventListener("keydown", (event) => {
  const isDeleteKey = event.key === "Backspace" || event.key === "Delete";

  if (isDeleteKey && selection.isColumnSelected) {
    range(ROWS).forEach((row) => {
      updateCell({ x: selection.column, y: row, value: 0 });
    });
    renderTable();
    selection.column = null;
    $formulaBar.value = "";
  }

  if (isDeleteKey && selection.isRowSelected) {
    range(COLUNMS).forEach((colmn) => {
      updateCell({ x: colmn, y: selection.row, value: 0 });
    });
    renderTable();
    selection.row = null;
    $formulaBar.value = "";
  }

  if (isDeleteKey && selection.isCellSelected) {
    updateCell({ x: selection.column, y: selection.row, value: 0 });
    renderTable();
    selection.clear();
    $formulaBar.value = "";
  }
});

//#endregion

//#region DOM COPY
document.addEventListener("copy", (event) => {
  if (selection.isColumnSelected) {
    const columnValues = range(ROWS).map((row) => {
      return STATE[selection.column][row].computedValue;
    });

    event.clipboardData.setData("text/plain", columnValues.join("\n"));
    event.preventDefault();
  }

  if (selection.isRowSelected) {
    const rowValues = range(COLUNMS).map((column) => {
      return STATE[column][selection.row].computedValue;
    });

    event.clipboardData.setData("text/plain", rowValues.join(";"));
    event.preventDefault();
  }

  if (selection.isCellSelected) {
    const cellValue = STATE[selection.column][selection.row].computedValue;
    event.clipboardData.setData("text/plain", cellValue);
    event.preventDefault();
  }
});
//#endregion

//#region DOM PASTE
document.addEventListener("paste", (event) => {
  if (selection.isColumnSelected) {
    const values = event.clipboardData.getData("text/plain").split("\n");
    range(ROWS).forEach((row) => {
      updateCell({ x: selection.column, y: row, value: values[row] });
    });
    event.preventDefault();
  }

  if (selection.isRowSelected) {
    const values = event.clipboardData.getData("text/plain").split(";");
    range(COLUNMS).forEach((column) => {
      updateCell({ x: column, y: selection.row, value: values[column] });
    });
    event.preventDefault();
  }

  if (selection.isCellSelected) {
    const value = event.clipboardData.getData("text/plain");
    updateCell({ x: selection.column, y: selection.row, value });
    event.preventDefault();
  }
});
//#endregion

//#region DOM CLICK
document.addEventListener("click", ({ target }) => {
  const isThClicked = target.closest("th");
  const isTdClicked = target.closest("td");
  const isToolBarClicked = target.closest(".tool-bar");

  if (!isThClicked && !isTdClicked && !isToolBarClicked) {
    removeSelection();
    $formulaBar.value = "";
  }
});

//#endregion

//#region RENDER
const renderTable = () => {
  const headerHTML = `
    <tr>
        <th>${DIAGONAL_ARROW}</th>
        ${range(COLUNMS)
          .map(
            (i) => `<th>${getColumnLetter(i)}<span class="resizer"></span></th>`
          )
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
                <td data-x="${col}" data-y="${row}" data-format="${STATE[col][row].format}">
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
//#endregion

//#region TOOL-BAR
const updateToolBar = (format) => {
  // This isn't a text editor, that's way I don't do a better solution
  if (format === "bold") {
    $toggleBold.classList.add("toggle");
    $toggleItalic.classList.remove("toggle");
  }

  if (format === "italic") {
    $toggleItalic.classList.add("toggle");
    $toggleBold.classList.remove("toggle");
  }

  if (format === "normal") {
    $toggleBold.classList.remove("toggle");
    $toggleItalic.classList.remove("toggle");
  }
};

//#region TOGGLE BUTTON

//TODO: Refactor format
$toggleBold.addEventListener("click", ({ target }) => {
  if (selection.isEmpty) return;

  //TODO: Allow add format to whole Rows and Columns
  if (selection.isColumnSelected || selection.isRowSelected) return;

  applyFormat(target, "bold");
  $toggleItalic.classList.remove("toggle");
});

$toggleItalic.addEventListener("click", ({ target }) => {
  if (selection.isEmpty) return;

  //TODO: Allow add format to whole Rows and Columns
  if (selection.isColumnSelected || selection.isRowSelected) return;

  applyFormat(target, "italic");
  $toggleBold.classList.remove("toggle");
});

const applyFormat = (target, format) => {
  const { column, row } = selection;

  const td = $body.querySelector(`td[data-x="${column}"][data-y="${row}"]`);
  const oldFormat = td.dataset.format;

  if (oldFormat !== "normal") {
    target.classList.remove("toggle");
    td.dataset.format = "normal";
    STATE[column][row].format = td.dataset.format;
  } else {
    target.classList.add("toggle");
    td.dataset.format = format;
    STATE[column][row].format = td.dataset.format;
  }
};
//#endregion
renderTable();

//#region RESIZE
const $resizers = getElements(".resizer");

$resizers.forEach((resizer) => {
  resizer.addEventListener("mousedown", (e) => {
    const th = e.target.parentElement;
    const startX = e.clientX;
    const startWidth = th.offsetWidth;

    const mouseMoveHandler = (e) => {
      const newWidth = startWidth + (e.clientX - startX);
      th.style.width = newWidth + "px";
    };

    const mouseUpHandler = () => {
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  });
});
//#endregion
