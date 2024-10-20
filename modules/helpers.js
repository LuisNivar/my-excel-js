import { ROWS, COLUNMS, FIRST_LETTER_ASCII_CODE } from "./constants.js";
import { range, getElements } from "./utils.js";

function generateState() {
  return range(COLUNMS).map((_) =>
    range(ROWS).map((_) => ({ computedValue: "", value: 0 }))
  );
}
//TODO: Excel column notation -> X,Y,Z,AA,AB...
const getColumnLetter = (i) => String.fromCharCode(i + FIRST_LETTER_ASCII_CODE);

const computeValue = (value, constants) => {
  const isNumber = typeof value === "number";
  const isEmpty = value === 0;

  if (isEmpty) return "";
  if (isNumber) return value;

  const isFormula = value.startsWith("=") || value.startsWith("+");
  if (!isFormula) {
    return value;
  }

  const formula = value.slice(1);
  let computedValue;

  try {
    computedValue = new Function(`
            ${constants}
            return ${formula}`)();
  } catch (e) {
    computedValue = "!ERROR"; //+ e.message';
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

export {
  generateState,
  getColumnLetter,
  computeValue,
  selection,
  removeSelection,
};
