const DECIMAL_PLACES = 6;

// round decimal using rounding.js
function roundToDecimalPlaces(numStr, method, decimalPlaces = DECIMAL_PLACES) {
    const rounded = roundDecimal(numStr, decimalPlaces);
    const methodMap = {
        'chop': 'chop',
        'roundup': 'up',
        'rounddown': 'down',
        'nearestEven': 'even'
    };
    const key = methodMap[method] || 'even';
    const result = rounded[key];
    const original = parseFloat(numStr);
    const roundedNum = parseFloat(result);
    const isRounded = Math.abs(original - roundedNum) > 1e-12;
    const digitCount = countSignificantDigits(numStr);
    return { display: result, needsRounding: isRounded, digitCount: digitCount };
}

document.addEventListener("DOMContentLoaded", () => {

  // tab navigation
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

 // clear conversion fields
  const clearConvertBtn = document.getElementById("btn-clear-convert");
  if (clearConvertBtn) {
    clearConvertBtn.addEventListener("click", () => {
      document.getElementById("input-convert-decimal").value = "";
      
      const outBin = document.getElementById("out-convert-binary");
      const outHex = document.getElementById("out-convert-hex");
      const outSpec = document.getElementById("out-convert-special");
      
      outBin.textContent = "----";
      outHex.textContent = "0x-";
      outSpec.textContent = "-";
      
      outBin.classList.add("placeholder");
      outHex.classList.add("placeholder");
      outSpec.classList.add("placeholder");
    });
  }

  // clear rounding fields
  const clearRoundBtn = document.getElementById("btn-clear-round");
  if (clearRoundBtn) {
    clearRoundBtn.addEventListener("click", () => {
      document.getElementById("round-val").value = "";
      document.getElementById("round-digits").value = "";
      document.getElementById("round-format").value = "Decimal"; 
      
      document.getElementById("out-chop").textContent = "—";
      document.getElementById("out-up").textContent = "—";
      document.getElementById("out-down").textContent = "—";
      document.getElementById("out-even").textContent = "—";
    });
  }

  // clear arithmetic fields
  const clearArithBtn = document.getElementById("btn-clear-arith");
  if (clearArithBtn) {
    clearArithBtn.addEventListener("click", () => {
      document.getElementById("arith-operand-a").value = "";
      document.getElementById("arith-operand-b").value = "";
      document.getElementById("arith-error").textContent = "";
      
      document.getElementById("arith-operation").value = "sub";
      document.getElementById("arith-rounding").value = "chop";
      
      document.getElementById("arith-steps").innerHTML = '<li class="step-item placeholder">Step details will appear here.</li>';
      
      const decEl = document.getElementById("arith-result-decimal");
      const binEl = document.getElementById("arith-result-binary");
      const hexEl = document.getElementById("arith-result-hex");
      
      decEl.textContent = "-";
      binEl.textContent = "----";
      hexEl.textContent = "0x";
      
      decEl.classList.add("placeholder");
      binEl.classList.add("placeholder");
      hexEl.classList.add("placeholder");
    });
  }


  // arithmetic compute
  const computeBtn = document.getElementById("arith-compute-btn");
  if (computeBtn) {
    computeBtn.addEventListener("click", () => {
      const operandA = document.getElementById("arith-operand-a").value;
      const operandB = document.getElementById("arith-operand-b").value;
      const operation = document.getElementById("arith-operation").value;
      const roundingMethod = document.getElementById("arith-rounding").value;

      const errorEl = document.getElementById("arith-error");
      const stepsEl = document.getElementById("arith-steps");
      const decEl = document.getElementById("arith-result-decimal");
      const binEl = document.getElementById("arith-result-binary");
      const hexEl = document.getElementById("arith-result-hex");

      errorEl.textContent = "";
      stepsEl.innerHTML = "";
      decEl.innerHTML = "-";
      binEl.textContent = "----";
      hexEl.textContent = "0x";

      // figure out if inputs are hex or decimal
      const inputType = validateInputs(operandA, operandB);
      if (inputType === "hex") {
        const normalizedA = normalizeOperand(operandA);
        const normalizedB = normalizeOperand(operandB);
        if (!normalizedA || !normalizedB) {
          stepsEl.innerHTML = "Invalid input";
          return;
        }
        renderHexSteps(operandA, operandB, normalizedA, normalizedB, roundingMethod, operation);
      } else if (inputType === "decimal") {
        renderStepsDecimal(operandA, operandB, roundingMethod, operation);
      } else {
        stepsEl.innerHTML = "Invalid input";
      }
    });
  }
});

// ==================== helpers ====================

// check if a string is hex (starts with 0x)
function isHexValue(value) {
  if (!value.startsWith("0x")) return false;
  const body = value.slice(2);
  if (body.length === 0) return false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i].toLowerCase();
    if (!((ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "f"))) return false;
  }
  return true;
}

// check if a string is a valid decimal number (including scientific)
function isDecimalValue(value) {
  if (!value) return false;
  const text = value.trim();
  if (!text) return false;
  let i = 0;
  if (text[i] === "+" || text[i] === "-") i++;
  let hasDigit = false;
  let hasDot = false;
  while (i < text.length) {
    const ch = text[i];
    if (ch >= "0" && ch <= "9") { hasDigit = true; i++; continue; }
    if (ch === ".") { if (hasDot) return false; hasDot = true; i++; continue; }
    break;
  }
  if (!hasDigit) return false;
  if (i < text.length && text[i] === "e") {
    i++;
    if (i < text.length && (text[i] === "+" || text[i] === "-")) i++;
    let expHasDigit = false;
    while (i < text.length) {
      const ch = text[i];
      if (ch >= "0" && ch <= "9") { expHasDigit = true; i++; } else return false;
    }
    return expHasDigit;
  }
  return i === text.length;
}

// determine if inputs are hex, decimal, or invalid
function validateInputs(operandA, operandB) {
  const a = String(operandA || "").trim();
  const b = String(operandB || "").trim();
  if (isHexValue(a) || isHexValue(b)) return "hex";
  if (isDecimalValue(a) && isDecimalValue(b)) return "decimal";
  return "invalid";
}

// convert hex to decimal string, or keep decimal
function normalizeOperand(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (isHexValue(text)) {
    const hexBody = text.slice(2);
    return String(parseInt(hexBody, 16));
  }
  return isDecimalValue(text) ? text : null;
}

// normalise a decimal string into {sign, significand, exponent}
function getNormalizedDecimal(value) {
  const rawValue = String(value).trim();
  if (!rawValue) return { sign: "", significand: "0", exponent: 0, special: true };
  const sign = rawValue.startsWith("-") ? "-" : "";
  const magnitude = rawValue.replace(/^[-+]/, "");
  if (magnitude.toLowerCase() === "nan" || magnitude.toLowerCase() === "infinity") {
    return { sign, significand: magnitude, exponent: 0, special: true };
  }

  let text = magnitude;
  let expFromE = 0;
  const eIndex = text.toLowerCase().indexOf("e");
  if (eIndex !== -1) {
    expFromE = parseInt(text.slice(eIndex + 1), 10);
    text = text.slice(0, eIndex);
  }
  if (!/^\d*\.?\d*$/.test(text) || text === "" || text === ".") {
    return { sign, significand: "0", exponent: 0, special: true };
  }

  const dotIndex = text.indexOf(".");
  let digits;
  let pointExponent;
  if (dotIndex === -1) {
    digits = text;
    pointExponent = 0;
  } else {
    digits = text.slice(0, dotIndex) + text.slice(dotIndex + 1);
    pointExponent = -(text.length - 1 - dotIndex);
  }

  const leadingStripped = digits.replace(/^0+/, "");
  digits = leadingStripped;
  if (digits === "") {
    return { sign: "", significand: "0", exponent: 0, special: false };
  }
  const trailingStripped = digits.replace(/0+$/, "");
  const trailingZeroCount = digits.length - trailingStripped.length;
  digits = trailingStripped === "" ? "0" : trailingStripped;

  const exponent = pointExponent + trailingZeroCount + expFromE;
  const significand = digits.length === 1 ? digits : digits[0] + "." + digits.slice(1);
  const finalExponent = exponent + (digits.length - 1);

  return { sign, significand, exponent: finalExponent, special: false };
}

// shift decimal point by a number of places (positive = right)
function shiftDecimalPoint(significand, places) {
  const value = String(significand).replace(/^\+/, "");
  if (!value || value === "0") return "0";
  const digitsOnly = value.replace(".", "");
  const decimalPosition = value.includes(".") ? value.indexOf(".") : value.length;
  const newDecimalPosition = decimalPosition - places;
  if (newDecimalPosition <= 0) {
    const zeroCount = Math.max(0, -newDecimalPosition);
    return `0.${"0".repeat(zeroCount)}${digitsOnly}`;
  }
  if (newDecimalPosition >= digitsOnly.length) {
    return digitsOnly + "0".repeat(newDecimalPosition - digitsOnly.length);
  }
  return digitsOnly.slice(0, newDecimalPosition) + "." + digitsOnly.slice(newDecimalPosition);
}

// align two numbers to the same exponent
function alignWithStrings(significandA, exponentA, significandB, exponentB, signA = "", signB = "") {
  const sharedExp = Math.max(Number(exponentA), Number(exponentB));
  const shiftA = sharedExp - Number(exponentA);
  const shiftB = sharedExp - Number(exponentB);
  return {
    sharedExp,
    sigA: `${signA}${shiftDecimalPoint(significandA, shiftA)}`.replace(/^\+/, ""),
    sigB: `${signB}${shiftDecimalPoint(significandB, shiftB)}`.replace(/^\+/, "")
  };
}

// count significant digits
function countSignificantDigits(significand) {
  const text = String(significand).replace(/^[+-]/, "");
  if (!text || text === "0" || text === "0.") return 0;
  const withoutLeading = text.replace(/^0+/, "");
  if (withoutLeading === "" || withoutLeading === ".") return 0;
  return withoutLeading.replace(".", "").length;
}

// format significand for display, strip trailing zeros
function formatSignificandForDisplay(significand) {
  const sign = significand.startsWith("-") ? "-" : "";
  const body = String(significand).replace(/^[+-]/, "");
  if (!body || body === "0" || body === "0.") {
    return sign + "0";
  }
  if (body.includes(".")) {
    let parts = body.split(".");
    let whole = parts[0];
    let frac = parts[1];
    frac = frac.replace(/0+$/, "");
    if (frac === "") {
      return sign + whole;
    } else {
      return sign + whole + "." + frac;
    }
  } else {
    return sign + body;
  }
}

// compute 10^exponent
function powerOfTen(exponent) {
  let result = 1n;
  for (let i = 0; i < exponent; i++) result *= 10n;
  return result;
}

// convert decimal string to ieee 754 single-precision binary and hex
function convertToSinglePrecision(inputDecimal) {
  const value = String(inputDecimal || "").trim().toLowerCase();
  if (!value) return { binaryResult: "", hexResult: "0x", specialCase: "None" };
  let specialCase = "None";
  let signBit = "0";
  let combinationField = "";
  let exponentField = "";
  let coefficientField1 = "";
  let coefficientField2 = "";

  // special values
  if (value === "nan" || value === "qnan" || value === "quietnan") {
    signBit = "0";
    combinationField = "11111";
    exponentField = "000000";
    coefficientField1 = "1000000000";
    coefficientField2 = "0000000000";
    specialCase = "qNaN";
  } else if (value === "infinity" || value === "+infinity" || value === "inf") {
    signBit = "0";
    combinationField = "11110";
    exponentField = "000000";
    coefficientField1 = "0000000000";
    coefficientField2 = "0000000000";
    specialCase = "+Infinity";
  } else if (value === "-infinity" || value === "-inf") {
    signBit = "1";
    combinationField = "11110";
    exponentField = "000000";
    coefficientField1 = "0000000000";
    coefficientField2 = "0000000000";
    specialCase = "-Infinity";
  } else if (value === "0" || value === "+0" || value === "-0") {
    signBit = value.startsWith("-") ? "1" : "0";
    combinationField = "00000";
    exponentField = "000000";
    coefficientField1 = "0000000000";
    coefficientField2 = "0000000000";
    specialCase = value.startsWith("-") ? "-0" : "+0";
  } else {
    // parse scientific notation
    let parts = value.split("e");
    let base = parts[0];
    let exp = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    
    if (base.startsWith("-")) {
      signBit = "1";
      base = base.replace("-", "");
    } else {
      signBit = "0";
      base = base.replace("+", "");
    }
    
    const decIndex = base.indexOf(".");
    let cStr = "";
    if (decIndex === -1) {
      cStr = base;
    } else {
      cStr = base.replace(".", "");
      exp -= base.length - 1 - decIndex;
    }
    
    cStr = cStr.replace(/^0+/, "");
    if (cStr === "") cStr = "0";
    
    // zero special case
    if (cStr === "0" || parseFloat(cStr) === 0) {
      combinationField = "00000";
      exponentField = "000000";
      coefficientField1 = "0000000000";
      coefficientField2 = "0000000000";
      specialCase = signBit === "0" ? "+0" : "-0";
    } else {
      // ensure 7-digit coefficient
      if (cStr.length < 7) {
        cStr = cStr.padStart(7, "0");
      } else if (cStr.length > 7) {
        const diff = cStr.length - 7;
        cStr = cStr.substring(0, 7);
        exp += diff;
      }
      
      // bias for decimal32
      let E = exp + 101; 
      
      // underflow/overflow checks
      if (E < 0) {
        specialCase = signBit === "0" ? "+0 (Underflow)" : "-0 (Underflow)";
        combinationField = "00000";
        exponentField = "000000";
        coefficientField1 = "0000000000";
        coefficientField2 = "0000000000";
      } else if (E > 191) {
        specialCase = signBit === "0" ? "+Infinity" : "-Infinity";
        combinationField = "11110";
        exponentField = "000000";
        coefficientField1 = "0000000000";
        coefficientField2 = "0000000000";
      } else {
        // normal encoding
        const eBin = E.toString(2).padStart(8, "0");
        const expMSBs = eBin.substring(0, 2);
        exponentField = eBin.substring(2, 8);
        const MSD = parseInt(cStr[0], 10);
        const msdBin = MSD.toString(2).padStart(4, "0");
        if (MSD < 8) {
          combinationField = expMSBs + msdBin.substring(1, 4);
        } else {
          combinationField = "11" + expMSBs + msdBin[3];
        }
        coefficientField1 = encodeDPD(cStr.substring(1, 4));
        coefficientField2 = encodeDPD(cStr.substring(4, 7));
      }
    }
  }

  const binaryResult = [signBit, combinationField, exponentField, coefficientField1, coefficientField2]
    .filter(Boolean).join(" ");
  const rawBinary = signBit + combinationField + exponentField + coefficientField1 + coefficientField2;
  const hexNum = parseInt(rawBinary, 2).toString(16).toUpperCase();
  const hexResult = "0x" + hexNum.padStart(8, "0");

  return { binaryResult, hexResult, specialCase };
}

// encode 3 decimal digits into 10-bit dpd
function encodeDPD(digitStr) {
  let d1 = parseInt(digitStr[0], 10).toString(2).padStart(4, '0');
  let d2 = parseInt(digitStr[1], 10).toString(2).padStart(4, '0');
  let d3 = parseInt(digitStr[2], 10).toString(2).padStart(4, '0');
  let a = d1[0], b = d1[1], c = d1[2], d = d1[3];
  let e = d2[0], f = d2[1], g = d2[2], h = d2[3];
  let i = d3[0], j = d3[1], k = d3[2], m = d3[3];
  let aei = a + e + i;
  switch (aei) {
    case "000": return b + c + d + f + g + h + "0" + j + k + m;
    case "001": return b + c + d + f + g + h + "100" + m;
    case "010": return b + c + d + j + k + h + "101" + m;
    case "011": return b + c + d + "10" + h + "111" + m;
    case "100": return j + k + d + f + g + h + "110" + m;
    case "101": return f + g + d + "11" + h + "111" + m;
    case "110": return j + k + d + "00" + h + "111" + m;
    case "111": return "00" + d + "11" + h + "111" + m;
    default: return "0000000000";
  }
}

// perform decimal subtraction with sign handling
function performDecimalSubtraction(signA, signB, significandA, significandB, sharedExp) {
  const aVal = Number(significandA);
  const bVal = Number(significandB);
  const aIsZero = aVal === 0;
  const bIsZero = bVal === 0;

  // both zero: sign follows a (preserves -0)
  if (aIsZero && bIsZero) {
    const resultSign = signA ? "-" : "";
    return { display: resultSign + "0", exponent: sharedExp };
  }

  const result = aVal - bVal;
  if (result === 0) {
    // exact zero: sign from result (negative if negative)
    const resultSign = result < 0 ? "-" : "";
    return { display: resultSign + "0", exponent: sharedExp };
  }
  const sign = result < 0 ? "-" : "";
  const magnitude = Math.abs(result);
  return { display: `${sign}${magnitude}`, exponent: sharedExp };
}

// perform decimal division with sign handling and rounding
function performDecimalDivision(signA, signB, significandA, exponentA, significandB, exponentB, roundingMethod) {
  const aVal = Number(significandA);
  const bVal = Number(significandB);

  // division by zero
  if (bVal === 0) {
    if (aVal === 0) {
      return { special: "nan", display: "NaN", exponent: 0 };
    } else {
      const sign = (signA !== signB) ? "-" : "";
      return { special: "inf", display: sign + "Infinity", exponent: 0 };
    }
  }

  let expResult = exponentA - exponentB;
  let sigResult = aVal / bVal;

  // normalise to [1,10)
  let normalizedSig = sigResult;
  let normExp = expResult;
  while (normalizedSig >= 10) {
    normalizedSig /= 10;
    normExp += 1;
  }
  while (normalizedSig < 1 && normalizedSig !== 0) {
    normalizedSig *= 10;
    normExp -= 1;
  }

  const sigStr = normalizedSig.toFixed(15);
  const rounded = roundToDecimalPlaces(sigStr, roundingMethod, DECIMAL_PLACES);
  const sign = (signA !== signB) ? "-" : "";

  return {
    display: sign + rounded.display,
    exponent: normExp,
    needsRounding: rounded.needsRounding,
    originalSig: sigResult,
    originalExp: expResult,
    normalizedSig: normalizedSig,
    roundedSig: rounded
  };
}

// normalise a decimal float to 7-digit coefficient form (for display)
function normalizeForDecimalFloat(value, exponent) {
  const sign = value.startsWith("-") ? "-" : "";
  const body = String(value).replace(/^[+-]/, "");
  if (!body || body === "0" || body === "0.") {
    return { significand: sign + "0000000", exponent: 0 };
  }
  const [wholePart, fracPart = ""] = body.split(".");
  const digitsOnly = `${wholePart}${fracPart}`;
  const decimalPlaces = fracPart.length;
  let normalizedDigits = digitsOnly;
  if (normalizedDigits.length < 7) normalizedDigits = normalizedDigits.padStart(7, "0");
  else if (normalizedDigits.length > 7) normalizedDigits = normalizedDigits.slice(0, 7);
  const normalizedExponent = exponent - decimalPlaces;
  return {
    significand: `${sign}${normalizedDigits}`,
    exponent: normalizedExponent
  };
}

// render steps for hex inputs
function renderHexSteps(operandA, operandB, decodedA, decodedB, roundingMethod, operation) {
  const steps = [];
  steps.push("<li><b>Step 0 (Hex to Decimal):</b><br>");
  steps.push(`${operandA} = ${decodedA}<br>`);
  steps.push(`${operandB} = ${decodedB}<br></li>`);
  const decimalSteps = renderStepsDecimalContent(decodedA, decodedB, roundingMethod, operation);
  document.getElementById("arith-steps").innerHTML = steps.join("") + decimalSteps;
}

// render steps for decimal inputs (entry point)
function renderStepsDecimal(operandA, operandB, roundingMethod, operation) {
  document.getElementById("arith-steps").innerHTML =
    renderStepsDecimalContent(operandA, operandB, roundingMethod, operation);
}

// core rendering for decimal steps (subtraction or division)
function renderStepsDecimalContent(operandA, operandB, roundingMethod, operation) {
  const normA = getNormalizedDecimal(operandA);
  const normB = getNormalizedDecimal(operandB);

  const signA = normA.sign || "";
  const signB = normB.sign || "";
  const valA = normA.significand;
  const valB = normB.significand;
  const expA = normA.exponent;
  const expB = normB.exponent;

  const roundingLabel = {
    chop: "truncate(chop)",
    roundup: "round-up",
    rounddown: "round-down",
    nearestEven: "nearestEven"
  }[roundingMethod] || roundingMethod;

  let arithSteps = "";

  // step 1: normalise
  arithSteps += "<li><b>Step 1 (Normalize):</b><br>";
  arithSteps += `A = ${signA}${valA} x 10^${expA}<br>`;
  arithSteps += `B = ${signB}${valB} x 10^${expB}<br></li>`;

  if (operation === "div") {
    // ----- division -----
    // step 2: subtract exponents
    let expResult = expA - expB;
    arithSteps += `<li><b>Step 2 (Subtract exponents):</b><br>`;
    arithSteps += `New exponent = ${expA} - ${expB} = ${expResult}<br></li>`;

    // step 2.1: round off operands
    const roundedA = roundToDecimalPlaces(signA + valA, roundingMethod);
    const roundedB = roundToDecimalPlaces(signB + valB, roundingMethod);
    const roundedValA = roundedA.display;
    const roundedValB = roundedB.display;

    arithSteps += `<li><b>Step 2.1 (Round off):</b><br>`;
    arithSteps += `A = ${roundedValA} x 10^${expResult}<br>`;
    arithSteps += `B = ${roundedValB} x 10^${expResult}<br></li>`;

    const signA_rounded = roundedValA.startsWith("-") ? "-" : "";
    const signB_rounded = roundedValB.startsWith("-") ? "-" : "";
    const valA_rounded = roundedValA.replace(/^[+-]/, "");
    const valB_rounded = roundedValB.replace(/^[+-]/, "");

    // division by zero
    const bVal = Number(valB_rounded);
    if (bVal === 0) {
      if (Number(valA_rounded) === 0) {
        const conv = convertToSinglePrecision("nan");
        arithSteps += `<li><b>Step 3 (Operation: divide):</b><br>0 ÷ 0 is undefined = NaN</li>`;
        document.getElementById("arith-result-decimal").innerHTML = "NaN";
        document.getElementById("arith-result-binary").textContent = conv.binaryResult;
        document.getElementById("arith-result-hex").textContent = conv.hexResult;
        return arithSteps;
      } else {
        const sign = (signA_rounded !== signB_rounded) ? "-" : "";
        const displaySign = sign === "-" ? "-" : "+";
        const conv = convertToSinglePrecision(sign + "inf");
        arithSteps += `<li><b>Step 3 (Operation: divide):</b><br>Division by zero = ${displaySign}Infinity</li>`;
        document.getElementById("arith-result-decimal").innerHTML = displaySign + "Infinity";
        document.getElementById("arith-result-binary").textContent = conv.binaryResult;
        document.getElementById("arith-result-hex").textContent = conv.hexResult;
        return arithSteps;
      }
    }

    // step 3: divide significands
    let sigResult = Number(valA_rounded) / Number(valB_rounded);
    arithSteps += `<li><b>Step 3 (Divide significands):</b><br>`;
    arithSteps += `${valA_rounded} ÷ ${valB_rounded} = ${sigResult}<br></li>`;

    // step 4: normalise result
    let normalizedSig = sigResult;
    let normExp = expResult;
    while (normalizedSig >= 10) {
      normalizedSig /= 10;
      normExp += 1;
    }
    while (normalizedSig < 1 && normalizedSig !== 0) {
      normalizedSig *= 10;
      normExp -= 1;
    }
    arithSteps += `<li><b>Step 4 (Normalize result):</b><br>`;
    arithSteps += `${sigResult} x 10^${expResult} = ${normalizedSig} x 10^${normExp}<br></li>`;

    // step 5: round to fixed decimal places
    const sigStr = normalizedSig.toFixed(15);
    const rounded = roundToDecimalPlaces(sigStr, roundingMethod);
    const finalSign = (signA_rounded !== signB_rounded) ? "-" : "";
    const finalDisplay = finalSign + rounded.display;
    const finalExp = normExp;

    if (rounded.needsRounding) {
      arithSteps += `<li><b>Step 5 (Round to ${DECIMAL_PLACES} decimal places):</b><br>`;
      arithSteps += `${normalizedSig} = ${rounded.display} (rounded)<br></li>`;
    } else {
      arithSteps += `<li><b>Step 5 (Round to ${DECIMAL_PLACES} decimal places):</b><br>`;
      arithSteps += `${normalizedSig} = ${rounded.display} (no rounding needed)<br></li>`;
    }

    // step 6: determine sign
    arithSteps += `<li><b>Step 6 (Determine sign):</b><br>`;
    arithSteps += `Signs: A${signA_rounded ? "(-)" : "(+)"}, B${signB_rounded ? "(-)" : "(+)"} = result is ${finalSign ? "negative" : "positive"}<br>`;
    arithSteps += `R = ${finalSign}${rounded.display} x 10^${finalExp}<br></li>`;

    // step 7: normalise to 7-digit coefficient form
    const normResult = normalizeForDecimalFloat(finalSign + rounded.display, finalExp);
    arithSteps += `<li><b>Step 5 (Normalize and re-round result):</b><br>`;
    arithSteps += `R = ${finalSign}${rounded.display} x 10^${finalExp}<br>`;
    arithSteps += `R = ${normResult.significand} x 10^${normResult.exponent} (normalized to ddddddd x 10^e)<br></li>`;

    const resultObj = { display: finalSign + rounded.display, exponent: finalExp };
    const finalScientific = `${resultObj.display}e${resultObj.exponent}`;
    const conversionResult = convertToSinglePrecision(finalScientific);
    const overflow = conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity";
    const underflow = conversionResult.specialCase.includes("Underflow");

    if (overflow) {
      arithSteps += `<li><b>Overflow detected:</b><br>`;
      arithSteps += `The exponent ${finalExp} exceeds the maximum representable exponent (90).<br>`;
      arithSteps += `Result rounds to ${finalSign ? "-" : "+"}Infinity.<br></li>`;
    }

    if (underflow) {
      arithSteps += `<li><b>Underflow detected:</b><br>`;
      arithSteps += `The exponent ${finalExp} is below the minimum representable exponent (-101).<br>`;
      arithSteps += `Result flushes to zero.<br></li>`;
    }

    let displayText = '';
    if (conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity") {
      displayText = conversionResult.specialCase;
    } else if (conversionResult.specialCase === "qNaN") {
      displayText = "NaN";
    } else if (underflow) {
      displayText = "0";
    } else {
      displayText = `${resultObj.display} x 10^${resultObj.exponent}`;
    }
    document.getElementById("arith-result-decimal").innerHTML = displayText;
    document.getElementById("arith-result-binary").textContent = conversionResult.binaryResult;
    document.getElementById("arith-result-hex").textContent = conversionResult.hexResult;

    return arithSteps;

  } else {
    // subtraction
    // step 2: align exponents
    const aligned = alignWithStrings(valA, expA, valB, expB, signA, signB);
    const roundedA = roundToDecimalPlaces(aligned.sigA, roundingMethod);
    const roundedB = roundToDecimalPlaces(aligned.sigB, roundingMethod);

    arithSteps += `<li><b>Step 2 (Align exponents to 10^${aligned.sharedExp}):</b><br>`;
    arithSteps += `A = ${aligned.sigA} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `B = ${aligned.sigB} x 10^${aligned.sharedExp}<br></li>`;

    // step 3: round based on chosen method
    const needsRounding = roundedA.needsRounding || roundedB.needsRounding;
    const digitCountA = roundedA.digitCount;
    const digitCountB = roundedB.digitCount;
    const roundingMsg = needsRounding
      ? `A has ${digitCountA} significant digit(s), B has ${digitCountB} significant digit(s), rounding needed.`
      : `A already has ${digitCountA} significant digit(s), B already has ${digitCountB} significant digit(s), both within the ${DECIMAL_PLACES} decimal place limit, so neither needs rounding yet.`;

    arithSteps += `<li><b>Step 3 (Rounding method: ${roundingLabel}):</b><br>`;
    arithSteps += `${roundingMsg}<br>`;
    arithSteps += `A = ${roundedA.display} x 10^${aligned.sharedExp}${roundedA.needsRounding ? " (rounded off)" : ""}<br>`;
    arithSteps += `B = ${roundedB.display} x 10^${aligned.sharedExp}${roundedB.needsRounding ? " (rounded off)" : ""}<br></li>`;

    // step 4: perform subtraction
    const sA = roundedA.display.startsWith("-") ? "-" : "";
    const sB = roundedB.display.startsWith("-") ? "-" : "";
    const vA = roundedA.display.replace(/^[+-]/, "");
    const vB = roundedB.display.replace(/^[+-]/, "");
    const opResult = performDecimalSubtraction(sA, sB, vA, vB, aligned.sharedExp);

    arithSteps += `<li><b>Step 4 (Operation: subtract):</b><br>`;
    arithSteps += `A = ${roundedA.display} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `B = ${roundedB.display} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `R = ${opResult.display} x 10^${opResult.exponent}<br></li>`;

    // step 5: normalise result
    let finalDisplay = opResult.display;
    let scientificExp = opResult.exponent;
    let finalDisplayForOutput = finalDisplay;
    let finalExpForDisplay = scientificExp;

    if (finalDisplay !== "0" && finalDisplay !== "-0") {
      const roundedResult = roundToDecimalPlaces(finalDisplay, roundingMethod);
      const normResult = normalizeForDecimalFloat(roundedResult.display, scientificExp);
      arithSteps += `<li><b>Step 5 (Normalize result):</b><br>`;
      arithSteps += `R = ${roundedResult.display} x 10^${scientificExp}${roundedResult.needsRounding ? " (rounded off)" : ""}<br>`;
      arithSteps += `R = ${normResult.significand} x 10^${normResult.exponent} (normalized to ddddddd x 10^e)<br></li>`;
      finalDisplayForOutput = roundedResult.display;
      finalExpForDisplay = scientificExp;
    } else {
      arithSteps += `<li><b>Step 5 (Normalize result):</b><br>`;
      arithSteps += `R = ${finalDisplay} (zero)<br></li>`;
    }

    // convert to single precision and check overflow/underflow
    const finalScientific = `${finalDisplayForOutput}e${scientificExp}`;
    const conversionResult = convertToSinglePrecision(finalScientific);
    const overflow = conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity";
    const underflow = conversionResult.specialCase.includes("Underflow");

    if (overflow) {
      arithSteps += `<li><b>Overflow detected:</b><br>`;
      arithSteps += `The exponent ${scientificExp} exceeds the maximum representable exponent (90).<br>`;
      const sign = finalDisplay.startsWith("-") ? "-" : "";
      arithSteps += `Result rounds to ${sign ? "-" : "+"}Infinity.<br></li>`;
    }

    if (underflow) {
      arithSteps += `<li><b>Underflow detected:</b><br>`;
      arithSteps += `The exponent ${scientificExp} is below the minimum representable exponent (-101).<br>`;
      arithSteps += `Result flushes to zero.<br></li>`;
    }

    let displayText = '';
    if (conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity") {
      displayText = conversionResult.specialCase;
    } else if (conversionResult.specialCase === "qNaN") {
      displayText = "NaN";
    } else if (underflow) {
      displayText = "0";
    } else {
      displayText = `${finalDisplayForOutput} x 10^${scientificExp}`;
    }
    document.getElementById("arith-result-decimal").innerHTML = displayText;
    document.getElementById("arith-result-binary").textContent = conversionResult.binaryResult;
    document.getElementById("arith-result-hex").textContent = conversionResult.hexResult;

    return arithSteps;
  }
}
