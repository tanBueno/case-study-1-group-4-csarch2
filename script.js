

document.addEventListener("DOMContentLoaded", () => {

  // ---------------------------------------------------------------------
  // Tab navigation (shared by all three task panels)
  // ---------------------------------------------------------------------
  const tabs = document.querySelectorAll(".task-tab");
  const panels = document.querySelectorAll(".task-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTask = tab.dataset.task;
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === targetTask);
      });
    });
  });

  // ---------------------------------------------------------------------
  // Task 3: Arithmetic Operations - UI wiring
  // ---------------------------------------------------------------------
  const computeBtn = document.getElementById("arith-compute-btn");
  if (computeBtn) {
    computeBtn.addEventListener ("click", () => {
      const operandA = document.getElementById("arith-operand-a").value;
      const operandB = document.getElementById("arith-operand-b").value;
      const operation = document.getElementById("arith-operation").value; // 'sub' | 'div'
      const roundingMethod = document.getElementById("arith-rounding").value; // 'chop' | 'roundup' | 'rounddown' | 'nearestEven'

      const errorEl = document.getElementById("arith-error");
      const stepsEl = document.getElementById("arith-steps");
      const decEl = document.getElementById("arith-result-decimal");
      const binEl = document.getElementById("arith-result-binary");
      const hexEl = document.getElementById("arith-result-hex");

      errorEl.textContent = "";
      stepsEl.innerHTML = "";

      console.log("Operand A:", operandA);
      console.log("Operand B:", operandB);
      console.log("Operation:", operation);
      console.log("Rounding Method:", roundingMethod);

      inputType = validateInputs(operandA, operandB);
      console.log(inputType);
      if(inputType == "hex"){
        document.getElementById('arith-steps').innerHTML = "On hold for hex";
      }
      else if(inputType == "decimal"){
        renderStepsDecimal(operandA, operandB);
      }
      else{
        document.getElementById('arith-steps').innerHTML = "Invalid input";
      }

    })
  }
});

function renderStepsDecimal(operandA, operandB){
  normA = getNormalizedDecimal(operandA);
  normB = getNormalizedDecimal(operandB);

  aligned = alignWithStrings(normA.significand, normA.exponent, normB.significand, normB.exponent);

  let arithSteps = "";
  // Normalization
  arithSteps += "<b>Step 1 (Normalize):</b><br>";
  arithSteps += `A = ${normA.significand} &times; 10<sup>${normA.exponent}</sup><br>`;
  arithSteps += `B = ${normB.significand} &times; 10<sup>${normB.exponent}</sup><br><br>`;

  // Align the smaller exponent to the big exponent
  arithSteps += `<b>Step 2 (Align Exponents to 10<sup>${aligned.sharedExp}</sup>):</b><br>`;
  arithSteps += `A = ${aligned.sigA} &times; 10<sup>${aligned.sharedExp}</sup><br>`;
  arithSteps += `B = ${aligned.sigB} &times; 10<sup>${aligned.sharedExp}</sup><br>`;

  // Check for special cases
  checkSpecialDecimal(Number(aligned.sigA))
  checkSpecialDecimal(Number(aligned.sigB))

  // Rounding
  // arithSteps += `Step 3 (Chop): ...`;

  // Operation

  // normalize again

  // check for special cases again

  document.getElementById('arith-steps').innerHTML = arithSteps;
}

function getNormalizedDecimal(numInput) {
  let realNum = Number(numInput);

  if (realNum === 0) {
    return { significand: "0", exponent: 0 };
  }

  let sciString = realNum.toExponential(); 
  let parts = sciString.split('e'); 

  return {
    significand: parts[0],
    exponent: parseInt(parts[1], 10)
  }
}

function alignWithStrings(sigStrA, expA, sigStrB, expB) {
  let maxExp = Math.max(expA, expB);

  function shiftDecimalLeft(sigStr, shiftCount) {
    if (shiftCount === 0) return sigStr; // No shift needed

    // Check if the text starts with a minus sign
    let isNegative = sigStr.startsWith('-');
    
    // Remove the minus sign temporarily so just work with the digits
    let str = isNegative ? sigStr.substring(1) : sigStr;

    if (!str.includes('.')) str += '.';
    let parts = str.split('.'); 
    let intPart = parts[0];
    let decPart = parts[1];

    let combined = intPart + decPart; 
    let newDecIndex = intPart.length - shiftCount;

    let resultStr = "";
    if (newDecIndex <= 0) {
      // Add padding zeros based on how far left we shifted
      resultStr = "0." + "0".repeat(Math.abs(newDecIndex)) + combined;
    } else {
      // Place the decimal in the middle
      resultStr = combined.slice(0, newDecIndex) + '.' + combined.slice(newDecIndex);
    }

    // Put the minus sign back on if it had one
    return isNegative ? "-" + resultStr : resultStr; 
  }

  let alignedA = shiftDecimalLeft(sigStrA, maxExp - expA);
  let alignedB = shiftDecimalLeft(sigStrB, maxExp - expB);

  return { sigA: alignedA, sigB: alignedB, sharedExp: maxExp };
}

function checkSpecialDecimal(num, exp) {
  let sign = num < 0 ? 1 : 0;
  let absNum = Math.abs(num);

  // 1. Check for Infinity (> 3.4 x 10^38)
  if (absNum > 3.4e38) {
    return {
      type: 'infinity',
      sign: sign,
      exponent: '11111111',
      fraction: '00000000000000000000000'
    };
  }

  // 2. Check for Denormalized (< 1.18 x 10^-38 and not zero)
  if (absNum > 0 && absNum < 1.18e-38) {
    // For denorm, exponent bits are all zeros
    // You scale your fraction relative to 2^-126 here
    return {
      type: 'denormalized',
      sign: sign,
      exponent: '00000000',
      fraction: getDenormFraction(absNum), // your custom shifting logic
    };
  }
  return { type: 'normal' };
}

function detectInputType(val) {
  let str = val.trim();
  if (str === "") return 'invalid';

  // check if hex
  if (str.toLowerCase().startsWith('0x')) {
    return 'hex'
  }
  // Check if number
  if (!isNaN(Number(str))) {
    return 'decimal';
  }
  return 'invalid';
}

function validateInputs(rawA, rawB) {
  let typeA = detectInputType(rawA);
  let typeB = detectInputType(rawB);

  if (typeA !== typeB) {
    alert("Warning: Both operands must be the same type (either both decimal or both IEEE hex)!");
    return false;
  }
  return typeA;
}
