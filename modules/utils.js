const getElement = (el) => document.querySelector(el);
const getElements = (el) => document.querySelectorAll(el);
const range = (length) => Array.from({ length }, (_, i) => i);

export { getElement, getElements, range };
