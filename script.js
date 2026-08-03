document.addEventListener("DOMContentLoaded", () => {

  // Tab navigation
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

 // Clear Button for Conversion
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

  // Clear Button for Rounding
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

  // Clear Button for Arithmetic
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


  // Arithmetic compute button
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

// ==================== Helper functions ====================

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

function validateInputs(operandA, operandB) {
  const a = String(operandA || "").trim();
  const b = String(operandB || "").trim();
  if (isHexValue(a) || isHexValue(b)) return "hex";
  if (isDecimalValue(a) && isDecimalValue(b)) return "decimal";
  return "invalid";
}

function normalizeOperand(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (isHexValue(text)) {
    const hexBody = text.slice(2);
    return String(parseInt(hexBody, 16));
  }
  return isDecimalValue(text) ? text : null;
}

function getNormalizedDecimal(value) {
  const rawValue = String(value).trim();
  if (!rawValue) return { sign: "", significand: "0", exponent: 0, special: true };
  const sign = rawValue.startsWith("-") ? "-" : "";
  const magnitude = rawValue.replace(/^[-+]/, "");
  if (magnitude.toLowerCase() === "nan" || magnitude.toLowerCase() === "infinity") {
    return { sign, significand: magnitude, exponent: 0, special: true };
  }
  const numericValue = Number(magnitude);
  if (!Number.isFinite(numericValue)) {
    return { sign, significand: "0", exponent: 0, special: true };
  }
  const normalized = numericValue.toExponential(15);
  const [mantissa, exponentText] = normalized.split("e");
  let significand = mantissa.replace(/^\-/, "");
  significand = significand.replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  significand = significand === "" ? "0" : significand;
  return { sign, significand, exponent: Number(exponentText), special: false };
}

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

function countSignificantDigits(significand) {
  const text = String(significand).replace(/^[+-]/, "");
  if (!text || text === "0" || text === "0.") return 0;
  const withoutLeading = text.replace(/^0+/, "");
  if (withoutLeading === "" || withoutLeading === ".") return 0;
  return withoutLeading.replace(".", "").length;
}

function formatSignificandForDisplay(significand) {
  const sign = significand.startsWith("-") ? "-" : "";
  const body = String(significand).replace(/^[+-]/, "");
  if (!body || body === "0" || body === "0.") {
    return sign + "0";
  }
  const digitsOnly = body.replace(".", "");
  const decimalIndex = body.includes(".") ? body.indexOf(".") : body.length;
  if (decimalIndex === 0) return `${sign}0.${digitsOnly}`;
  if (decimalIndex > 0) {
    const wholePart = body.slice(0, decimalIndex);
    const fracPart = body.slice(decimalIndex + 1);
    if (wholePart === "0") {
      const trimmed = fracPart.replace(/0+$/, "");
      return `${sign}0.${trimmed}`;
    }
  }
  return `${sign}${body}`;
}

function roundSignificand(significand, method) {
  const sign = significand.startsWith("-") ? "-" : "";
  const body = String(significand).replace(/^[+-]/, "");
  const digitCount = countSignificantDigits(body);
  if (digitCount <= 7) {
    return {
      display: formatSignificandForDisplay(significand),
      needsRounding: false,
      digitCount
    };
  }
  const digits = body.replace(".", "");
  const kept = digits.slice(0, 7);
  const nextDigit = digits[7] || "0";
  const remaining = digits.slice(8);
  let roundedDigits = kept;
  if (method === "chop") {
    roundedDigits = kept;
  } else if (method === "roundup") {
    const tail = nextDigit + remaining;
    if (tail !== "") {
      roundedDigits = String(Number(kept) + 1).padStart(7, "0").slice(0, 7);
    }
  } else if (method === "rounddown") {
    roundedDigits = kept;
  } else if (method === "nearestEven") {
    const tail = nextDigit + remaining;
    const discard = Number(nextDigit);
    const lastKept = Number(kept[6] || 0);
    const tailHasMeaningfulValue = tail !== "" && tail !== "0";
    if (discard > 5 || (discard === 5 && (tailHasMeaningfulValue || lastKept % 2 !== 0))) {
      roundedDigits = String(Number(kept) + 1).padStart(7, "0").slice(0, 7);
    }
  }
  let roundedDisplay = `${sign}${roundedDigits[0]}.${roundedDigits.slice(1)}`;
  if (roundedDigits.length === 1) {
    roundedDisplay = `${sign}${roundedDigits}`;
  }
  return {
    display: roundedDisplay,
    needsRounding: true,
    digitCount
  };
}

function powerOfTen(exponent) {
  let result = 1n;
  for (let i = 0; i < exponent; i++) result *= 10n;
  return result;
}

function convertToSinglePrecision(inputDecimal) {
  const value = String(inputDecimal || "").trim().toLowerCase();
  if (!value) return { binaryResult: "", hexResult: "0x", specialCase: "None" };
  let specialCase = "None";
  let signBit = "0";
  let combinationField = "";
  let exponentField = "";
  let coefficientField1 = "";
  let coefficientField2 = "";

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
  } else if (value === "0" || value === "+0") {
    signBit = "0";
    combinationField = "00000";
    exponentField = "000000";
    coefficientField1 = "0000000000";
    coefficientField2 = "0000000000";
    specialCase = "+0";
  } else if (value === "-0") {
    signBit = "1";
    combinationField = "00000";
    exponentField = "000000";
    coefficientField1 = "0000000000";
    coefficientField2 = "0000000000";
    specialCase = "-0";
  } else {
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
    if (cStr.length < 7) {
      cStr = cStr.padStart(7, "0");
    } else if (cStr.length > 7) {
      const diff = cStr.length - 7;
      cStr = cStr.substring(0, 7);
      exp += diff;
    }
    let E = exp + 101;
    if (E < 6) {
      specialCase = "Underflow (Denormalized)";
      combinationField = "00000";
      exponentField = "000000";
      const shift = exp + 101;
      let coeffBig = BigInt(cStr);
      let adjustedCoeff = coeffBig * powerOfTen(-shift);
      let adjStr = adjustedCoeff.toString();
      adjStr = adjStr.padStart(7, "0");
      const trailing = adjStr.substring(1, 7);
      coefficientField1 = encodeDPD(trailing.substring(0, 3));
      coefficientField2 = encodeDPD(trailing.substring(3, 6));
    } else if (E > 191) {
      specialCase = signBit === "0" ? "+Infinity" : "-Infinity";
      combinationField = "11110";
      exponentField = "000000";
      coefficientField1 = "0000000000";
      coefficientField2 = "0000000000";
    } else {
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

  const binaryResult = [signBit, combinationField, exponentField, coefficientField1, coefficientField2]
    .filter(Boolean).join(" ");
  const rawBinary = signBit + combinationField + exponentField + coefficientField1 + coefficientField2;
  const hexNum = parseInt(rawBinary, 2).toString(16).toUpperCase();
  const hexResult = "0x" + hexNum.padStart(8, "0");

  return { binaryResult, hexResult, specialCase };
}

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

function performDecimalSubtraction(signA, signB, significandA, significandB, sharedExp) {
  const aVal = Number(significandA);
  const bVal = Number(significandB);
  const aIsZero = aVal === 0;
  const bIsZero = bVal === 0;

  if (aIsZero && bIsZero) {
    const resultSign = signA ? "-" : "";
    return { display: resultSign + "0", exponent: sharedExp };
  }

  const result = aVal - bVal;
  if (result === 0) {
    const resultSign = result < 0 ? "-" : "";
    return { display: resultSign + "0", exponent: sharedExp };
  }
  const sign = result < 0 ? "-" : "";
  const magnitude = Math.abs(result);
  return { display: `${sign}${magnitude}`, exponent: sharedExp };
}

function performDecimalDivision(signA, signB, significandA, exponentA, significandB, exponentB, roundingMethod) {
  const aVal = Number(significandA);
  const bVal = Number(significandB);

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
  const rounded = roundSignificand(sigStr, roundingMethod);
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

function renderHexSteps(operandA, operandB, decodedA, decodedB, roundingMethod, operation) {
  const steps = [];
  steps.push("<li><b>Step 0 (Hex to Decimal):</b><br>");
  steps.push(`${operandA} = ${decodedA}<br>`);
  steps.push(`${operandB} = ${decodedB}<br></li>`);
  const decimalSteps = renderStepsDecimalContent(decodedA, decodedB, roundingMethod, operation);
  document.getElementById("arith-steps").innerHTML = steps.join("") + decimalSteps;
}

function renderStepsDecimal(operandA, operandB, roundingMethod, operation) {
  document.getElementById("arith-steps").innerHTML =
    renderStepsDecimalContent(operandA, operandB, roundingMethod, operation);
}

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

  arithSteps += "<li><b>Step 1 (Normalize):</b><br>";
  arithSteps += `A = ${signA}${valA} x 10^${expA}<br>`;
  arithSteps += `B = ${signB}${valB} x 10^${expB}<br></li>`;

  if (operation === "div") {
    //DIVISION
    const aVal = Number(valA);
    const bVal = Number(valB);

    if (bVal === 0) {
      if (aVal === 0) {
        const conv = convertToSinglePrecision("nan");
        arithSteps += `<li><b>Step 2 (Operation: divide):</b><br>0 ÷ 0 is undefined → NaN</li>`;
        document.getElementById("arith-result-decimal").innerHTML = "NaN";
        document.getElementById("arith-result-binary").textContent = conv.binaryResult;
        document.getElementById("arith-result-hex").textContent = conv.hexResult;
        return arithSteps;
      } else {
        const sign = (signA !== signB) ? "-" : "";
        const displaySign = sign === "-" ? "-" : "+";
        const conv = convertToSinglePrecision(sign + "inf");
        arithSteps += `<li><b>Step 2 (Operation: divide):</b><br>Division by zero → ${displaySign}Infinity</li>`;
        document.getElementById("arith-result-decimal").innerHTML = displaySign + "Infinity";
        document.getElementById("arith-result-binary").textContent = conv.binaryResult;
        document.getElementById("arith-result-hex").textContent = conv.hexResult;
        return arithSteps;
      }
    }

    let expResult = expA - expB;
    arithSteps += `<li><b>Step 2 (Subtract exponents):</b><br>`;
    arithSteps += `New exponent = ${expA} - ${expB} = ${expResult}<br></li>`;

    let sigResult = aVal / bVal;
    arithSteps += `<li><b>Step 3 (Divide significands):</b><br>`;
    arithSteps += `${aVal} ÷ ${bVal} = ${sigResult}<br></li>`;

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

    const sigStr = normalizedSig.toFixed(15);
    const rounded = roundSignificand(sigStr, roundingMethod);
    const finalSign = (signA !== signB) ? "-" : "";
    const finalDisplay = finalSign + rounded.display;
    const finalExp = normExp;

    if (rounded.needsRounding) {
      arithSteps += `<li><b>Step 5 (Round to 7 digits):</b><br>`;
      arithSteps += `${normalizedSig} = ${rounded.display} (rounded)<br></li>`;
    } else {
      arithSteps += `<li><b>Step 5 (Round to 7 digits):</b><br>`;
      arithSteps += `${normalizedSig} = ${rounded.display} (no rounding needed)<br></li>`;
    }

    arithSteps += `<li><b>Step 6 (Determine sign):</b><br>`;
    arithSteps += `Signs: A${signA ? "(-)" : "(+)"}, B${signB ? "(-)" : "(+)"} → result is ${finalSign ? "negative" : "positive"}<br>`;
    arithSteps += `R = ${finalSign}${rounded.display} x 10^${finalExp}<br></li>`;

    const normResult = normalizeForDecimalFloat(finalSign + rounded.display, finalExp);
    arithSteps += `<li><b>Step 5 (Normalize and re-round result):</b><br>`;
    arithSteps += `R = ${finalSign}${rounded.display} x 10^${finalExp}<br>`;
    arithSteps += `R = ${normResult.significand} x 10^${normResult.exponent} (normalized to ddddddd x 10^e)<br></li>`;

    let overflow = false;
    let underflow = false;
    if (finalExp > 90) overflow = true;
    if (finalExp < -95) underflow = true;

    if (overflow) {
      arithSteps += `<li><b>Overflow detected:</b><br>`;
      arithSteps += `The exponent ${finalExp} exceeds the maximum representable exponent (90).<br>`;
      arithSteps += `Result rounds to ${finalSign ? "-" : "+"}Infinity.<br></li>`;
    }

    if (underflow) {
      arithSteps += `<li><b>Underflow detected:</b><br>`;
      arithSteps += `The exponent ${finalExp} is below the minimum representable exponent (-95).<br>`;
      arithSteps += `Result is denormalized (subnormal).<br></li>`;
    }

    //Encoding
    const resultObj = { display: finalSign + rounded.display, exponent: finalExp };
    const finalScientific = `${resultObj.display}e${resultObj.exponent}`;
    const conversionResult = convertToSinglePrecision(finalScientific);

    let displayText = '';
    if (conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity") {
      displayText = conversionResult.specialCase;
    } else if (conversionResult.specialCase === "qNaN") {
      displayText = "NaN";
    } else if (overflow) {
      displayText = finalSign ? "-Infinity" : "+Infinity";
    } else {
      displayText = `${resultObj.display} x 10^${resultObj.exponent}`;
      if (conversionResult.specialCase.includes("Underflow") || underflow) {
        displayText += " (Denormalized/Underflow)";
      }
    }
    document.getElementById("arith-result-decimal").innerHTML = displayText;
    document.getElementById("arith-result-binary").textContent = conversionResult.binaryResult;
    document.getElementById("arith-result-hex").textContent = conversionResult.hexResult;

    return arithSteps;

  } else {
    //SUBTRACTION
    const aligned = alignWithStrings(valA, expA, valB, expB, signA, signB);
    const roundedA = roundSignificand(aligned.sigA, roundingMethod);
    const roundedB = roundSignificand(aligned.sigB, roundingMethod);

    arithSteps += `<li><b>Step 2 (Align exponents to 10^${aligned.sharedExp}):</b><br>`;
    arithSteps += `A = ${aligned.sigA} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `B = ${aligned.sigB} x 10^${aligned.sharedExp}<br></li>`;

    const needsRounding = roundedA.needsRounding || roundedB.needsRounding;
    const digitCountA = roundedA.digitCount;
    const digitCountB = roundedB.digitCount;
    const roundingMsg = needsRounding
      ? `A has ${digitCountA} significant digit(s), B has ${digitCountB} significant digit(s), rounding needed.`
      : `A already has ${digitCountA} significant digit(s), B already has ${digitCountB} significant digit(s), both within the 7 digit limit, so neither needs rounding yet.`;

    arithSteps += `<li><b>Step 3 (Rounding method: ${roundingLabel}):</b><br>`;
    arithSteps += `${roundingMsg}<br>`;
    arithSteps += `A = ${roundedA.display} x 10^${aligned.sharedExp}${roundedA.needsRounding ? " (rounded off)" : ""}<br>`;
    arithSteps += `B = ${roundedB.display} x 10^${aligned.sharedExp}${roundedB.needsRounding ? " (rounded off)" : ""}<br></li>`;

    const sA = roundedA.display.startsWith("-") ? "-" : "";
    const sB = roundedB.display.startsWith("-") ? "-" : "";
    const vA = roundedA.display.replace(/^[+-]/, "");
    const vB = roundedB.display.replace(/^[+-]/, "");
    const opResult = performDecimalSubtraction(sA, sB, vA, vB, aligned.sharedExp);

    arithSteps += `<li><b>Step 4 (Operation: subtract):</b><br>`;
    arithSteps += `A = ${roundedA.display} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `B = ${roundedB.display} x 10^${aligned.sharedExp}<br>`;
    arithSteps += `R = ${opResult.display} x 10^${opResult.exponent}<br></li>`;

    //Keep scientific exponent separate from integer exponent
    let finalDisplay = opResult.display;
    let scientificExp = opResult.exponent;
    let finalDisplayForOutput = finalDisplay;
    let finalExpForDisplay = scientificExp;

    if (finalDisplay !== "0" && finalDisplay !== "-0") {
      const roundedResult = roundSignificand(finalDisplay, roundingMethod);
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

    let overflow = false;
    let underflow = false;
    if (scientificExp > 90) overflow = true;
    if (scientificExp < -95) underflow = true;

    if (overflow) {
      arithSteps += `<li><b>Overflow detected:</b><br>`;
      arithSteps += `The exponent ${scientificExp} exceeds the maximum representable exponent (90).<br>`;
      const sign = finalDisplay.startsWith("-") ? "-" : "";
      arithSteps += `Result rounds to ${sign ? "-" : "+"}Infinity.<br></li>`;
    }

    if (underflow) {
      arithSteps += `<li><b>Underflow detected:</b><br>`;
      arithSteps += `The exponent ${scientificExp} is below the minimum representable exponent (-95).<br>`;
      arithSteps += `Result is denormalized (subnormal).<br></li>`;
    }

    // Encoding
    const finalScientific = `${finalDisplayForOutput}e${scientificExp}`;
    const conversionResult = convertToSinglePrecision(finalScientific);

    let displayText = '';
    if (conversionResult.specialCase === "+Infinity" || conversionResult.specialCase === "-Infinity") {
      displayText = conversionResult.specialCase;
    } else if (conversionResult.specialCase === "qNaN") {
      displayText = "NaN";
    } else if (overflow) {
      const sign = finalDisplay.startsWith("-") ? "-" : "";
      displayText = sign ? "-Infinity" : "+Infinity";
    } else {
      displayText = `${finalDisplayForOutput} x 10^${scientificExp}`;
      if (conversionResult.specialCase.includes("Underflow") || underflow) {
        displayText += " (Denormalized/Underflow)";
      }
    }
    document.getElementById("arith-result-decimal").innerHTML = displayText;
    document.getElementById("arith-result-binary").textContent = conversionResult.binaryResult;
    document.getElementById("arith-result-hex").textContent = conversionResult.hexResult;

    return arithSteps;
  }
}