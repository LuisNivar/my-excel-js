import { ROWS, COLUNMS, FIRST_LETTER_ASCII_CODE } from "./constants.js";
import { range, getElements } from "./utils.js";

function generateState() {
  return range(COLUNMS).map((_) =>
    range(ROWS).map((_) => ({ computedValue: "", value: "", format: "normal" }))
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

  let formula = value.slice(1);
  let computedValue;

  const excelFormulas = [
    `function sum(...args) {
      let result = 0;
      if ([...args].length === 0) return 0;
      for (const arg of [...args]) {
        const n = isNaN(arg) ? 0 : arg;
        result += n;
      }
      return result;
    }`,
    `function average(...args) {
    const n = [...args].length;
    const result = sum(...args)/n;
    return result;
  }`,
    `function today(){
    const now = new Date(Date.now());
    return now.toLocaleDateString();
  }`,
    `  function max(...args){
    return Math.max(...args);
  }`,
    ` function min(...args){
    return Math.min(...args);
  }`,
    ` function concat(...args){
    if ([...args].length === 0) return "";
    let result = "";
    for (const arg of [...args]) {
      result += arg;
    }
    return result;
  }`,
  ];

  const rangePattern = /[a-zA-Z]\d:[a-zA-Z]\d/;
  const hasRange = rangePattern.test(formula);

  if (hasRange) {
    const rangeCells = formula.match(rangePattern)[0];
    const rangeConst = range2Consts(rangeCells);
    formula = formula.replace(rangePattern, rangeConst);
  }

  const formulaFormated = formula.toLowerCase();

  try {
    computedValue = new Function(`
            ${constants}
            ${excelFormulas.join("\n")}
            
            return ${formulaFormated}`)();
  } catch (e) {
    computedValue = "#ERROR!"; // + e.message;
  }

  // One Decimal place
  if (!isNaN(computedValue)) {
    computedValue = Math.round(computedValue * 10) / 10;
  }

  return computedValue;
};

const selection = {
  column: null,
  row: null,
  get isColumnSelected() {
    return this.column !== null && this.row === null;
  },
  get isRowSelected() {
    return this.column === null && this.row !== null;
  },
  get isEmpty() {
    return this.column === null && this.row === null;
  },
  get isCellSelected() {
    return !this.isColumnSelected && !this.isRowSelected && !this.isEmpty;
  },
  clear() {
    this.column = null;
    this.row = null;
  },
};

function removeSelection() {
  getElements(".selected").forEach((el) => el.classList.remove("selected"));
  selection.clear();
}

const range2Consts = (rangeCells) => {
  const start = /(?<column>[a-zA-Z])(?<row>\d)(?=:)/.exec(rangeCells).groups;
  const end = /(?<=:)(?<column>[a-zA-Z])(?<row>\d)/.exec(rangeCells).groups;

  const startRow = Number(start.row);
  const endRow = Number(end.row);

  const startColum =
    start.column.toUpperCase().charCodeAt(0) - FIRST_LETTER_ASCII_CODE;

  const endColum =
    end.column.toUpperCase().charCodeAt(0) - FIRST_LETTER_ASCII_CODE;

  let arrayCells = [];
  for (let j = startColum; j < endColum + 1; j++) {
    const letter = getColumnLetter(j);

    for (let i = startRow; i < endRow + 1; i++) {
      arrayCells.push(letter + i);
    }
  }

  const result = arrayCells.join(",");
  return result;
};

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
