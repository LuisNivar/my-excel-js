import { ROWS, COLUNMS, FIRST_LETTER_ASCII_CODE } from "./constants.js";
import { range, getElements } from "./utils.js";

function generateState() {
  return range(COLUNMS).map((_) =>
    range(ROWS).map((_) => ({ computedValue: "", value: "" }))
  );
}
//TODO: Excel column notation -> X,Y,Z,AA,AB...
const getColumnLetter = (i) => String.fromCharCode(i + FIRST_LETTER_ASCII_CODE);

const computeValue = (value, constants) => {
  const isEmpty = value === 0 || value.trim() === "";
  if (isEmpty) {
    return "";
  }

  const isFormula = value.startsWith("=") || value.startsWith("+");
  if (!isFormula) {
    return value;
  }

  const formula = value.slice(1);
  let computedValue;

  const excelFormulas = [
    "const sum = (...args) => [...args].reduce((a, b) => a + b, 0);",
    "const today = () => new Date(Date.now()).toLocaleDateString();",
  ];

  const formulaFormated = formula.toLowerCase();

  try {
    computedValue = new Function(`
            ${constants}
            ${excelFormulas.join("")}

            return ${formulaFormated}`)();
  } catch (e) {
    computedValue = "#ERROR!"; //+ e.message';
  }

  return computedValue;
};

const selection = {
  column: null,
  row: null,
};

function removeSelection() {
  getElements(".selected").forEach((el) => el.classList.remove("selected"));
  selection.column = null;
  selection.row = null;
}

const computeAllCells = (cells, constants) => {
  cells.forEach((rows, x) => {
    rows.forEach((cell, y) => {
      const computedValue = computeValue(cell.value, constants);
      cell.computedValue = computedValue;
    });
  });
};

const generateConstantsCell = (cols) => {
  return cols
    .map((rows, x) => {
      return rows
        .map((cell, y) => {
          const letter = getColumnLetter(x);
          const cellRef = `${letter.toLowerCase()}${y + 1}`; // Like A1, C15...

          let computedValue;

          const isString = isNaN(cell.computedValue);
          const isNumber = !isString;
          const isEmpty = cell.computedValue === "";

          if (isString) {
            computedValue = `"${cell.computedValue}"`;
          }

          if (isEmpty) {
            computedValue = "";
          }

          if (isNumber) {
            computedValue = Number(cell.computedValue);
          }

          return `const ${cellRef} = ${computedValue};`; // Like const A1 = 15...
        })
        .join("\n");
    })
    .join("\n");
};

export {
  generateState,
  getColumnLetter,
  computeValue,
  selection,
  removeSelection,
  generateConstantsCell,
  computeAllCells,
};
