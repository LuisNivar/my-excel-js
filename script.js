const getElement = el => document.querySelector(el);
const getElements = el => document.querySelectorAll(el);
const range = length => Array.from({length},(_,i) => i);

//TODO: Excel column notation -> X,Y,Z,AA,AB...
const FIRST_LETTER_ASCII_CODE = 65;
const getColumnLetter = i => String.fromCharCode(i + FIRST_LETTER_ASCII_CODE);

const ROWS = 8
const COLUNMS = 5;

let selectedColumn = null;

let STATE = range(COLUNMS).map(
    i => range(ROWS).map(
    () =>({computedValue : 0 , value : 0}))
    );

const $table = getElement('.main-table');
const $head = getElement('.head-table');
const $body = getElement('.body-table')    

// Get td
$body.addEventListener('click',event =>{
     const td = event.target.closest('td');
    if(!td) return;

    const col = td.nextElementSibling.dataset.x;
    if(col <= 0) return
    
     const {x, y} = td.dataset;
     const $input = td.querySelector('input');
     const $span = td.querySelector('span');

     
     const endChar = $input.value.length;
     $input.setSelectionRange(endChar,endChar);
     $input.focus();
     removeColumnSelection();

     // Inputs events
     $input.addEventListener('keydown', event =>{
        if(event.key === 'Enter') { $input.blur(); }
     })

     $input.addEventListener('blur', () => {
        if($input.value === STATE[x][y].value){ return } 

        updateCell({x, y, value : $input.value.toLowerCase()});
     },{once : true}); 

});

$head.addEventListener('click', event => {
    const th = event.target.closest('th');
    if(!th) return; 
    const index = [...th.parentNode.children].indexOf(th);
    // prevent error when click in RowHeaders 
    if(index <= 0 ) return;

    selectedColumn = index - 1; 
    // reset state
    removeColumnSelection();

    const selectedRow = getElements(`tr td:nth-child(${index + 1 })`);
    th.classList.add('selected');
    selectedRow.forEach(el => el.classList.add('selected'));
});

document.addEventListener('keydown',(event)=>{
    if(event.key === 'Backspace' && selectedColumn !== null){
        range(ROWS).forEach(row => {
            updateCell({x : selectedColumn,  y : row, value : 0})
        });
        renderTable();
        selectedColumn = null;
    }
});

document.addEventListener('copy',(event)=>{
    if(selectedColumn !== null){
        const columnValues = range(ROWS).map(row => {
            return STATE[selectedColumn][row].computedValue;
        });

        event.clipboardData.setData('text/plain',columnValues.join('\n'));
        event.preventDefault();
    }
});

document.addEventListener('click',({target})=> {
    const isThClicked = target.closest('th');
    const isTdClicked = target.closest('td');

    if(!isThClicked && !isTdClicked){
        removeColumnSelection();
        selectedColumn = null;
    }
});

const renderTable = ()=> {
    const headerHTML = `
    <tr>
        <th>&#129126</th>
        ${range(COLUNMS).map(i => `<th>${ getColumnLetter(i)}</th>`).join('')}
    </tr>`;

    $head.innerHTML = headerHTML;

    //data-tooltip="${STATE[col][row].computedValue}"
    const bodyHtml = range(ROWS).map(row => {
        return `
        <tr>
            <td>${row + 1}</td>
            ${range(COLUNMS).map(col => `
                <td data-x="${col}" data-y="${row}">
                  	<span>${STATE[col][row].computedValue}</span> 
                    <input type="text" name="${col}-${row}" value="${STATE[col][row].value}" />
                </td>`
            ).join('')}
        </tr>`
    }).join('');

    $body.innerHTML= bodyHtml;
}

const updateCell = ({x,y,value}) => {
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
}

const computeValue = (value, constants) => {
    const isNumber = typeof(value) === "number";
    if(isNumber) {return value; }

    const isFormula =  value.startsWith('=') || value.startsWith('+'); 
    if(!isFormula) {return value; }

    const formula = value.slice(1);
    let computedValue;
    
    try {
        computedValue = new Function( `
            ${constants}
            return ${formula}`
         )();
    } catch (e) {
        computedValue = '!ERROR';  //+ e.message'; 
    }

    return computedValue;
}

const computeAllCells = (cells, constants) => {
    cells.forEach((rows, x) => {
        rows.forEach((cell, y) => {
            const computedValue = computeValue(cell.value,constants);
            cell.computedValue = computedValue;
        });      
    });
}

const generateConstantsCell = (cols) => {
    return cols.map((rows,x)=> {
        return rows.map((cell, y)=> {
            const letter = getColumnLetter(x);
            const cellRef = `${letter.toLowerCase()}${y + 1}`; // Like A1, C15...
            return `const ${cellRef} = ${cell.computedValue};`; // Like const A1 = 15...
        }).join('\n');
    }).join('\n');
}

function removeColumnSelection() {
    getElements('.selected').forEach(el => el.classList.remove('selected'));
} 

renderTable();