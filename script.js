document.addEventListener("DOMContentLoaded", function () {

  var tabs = document.querySelectorAll(".task-tab");
  var panels = document.querySelectorAll(".task-panel");

  var tabIndex = 0;
  while (tabIndex < tabs.length) {
    attachTabHandler(tabs[tabIndex], tabs, panels);
    tabIndex = tabIndex + 1;
  }

  var computeBtn = document.getElementById("arith-compute-btn");
  if (computeBtn) {
    computeBtn.addEventListener("click", handleComputeClick);
  }
});

function attachTabHandler(tab, tabs, panels) {
  tab.addEventListener("click", function () {
    var targetTask = tab.dataset.task;

    var i = 0;
    while (i < tabs.length) {
      if (tabs[i] === tab) {
        tabs[i].classList.add("is-active");
      } else {
        tabs[i].classList.remove("is-active");
      }
      i = i + 1;
    }

    var j = 0;
    while (j < panels.length) {
      if (panels[j].dataset.panel === targetTask) {
        panels[j].classList.add("is-active");
      } else {
        panels[j].classList.remove("is-active");
      }
      j = j + 1;
    }
  });
}

function handleComputeClick() {
  var operandA = document.getElementById("arith-operand-a").value;
  var operandB = document.getElementById("arith-operand-b").value;
  var operation = document.getElementById("arith-operation").value;
  var roundingMethod = document.getElementById("arith-rounding").value;

  var errorEl = document.getElementById("arith-error");
  var stepsEl = document.getElementById("arith-steps");
  var decEl = document.getElementById("arith-result-decimal");
  var binEl = document.getElementById("arith-result-binary");
  var hexEl = document.getElementById("arith-result-hex");

  errorEl.textContent = "";
  stepsEl.innerHTML = "";

  try {
    var steps = [];
    var result;
    if (operation === "sub") {
      result = runSubtract(operandA, operandB, roundingMethod, steps);
    } else {
      result = runDivide(operandA, operandB, roundingMethod, steps);
    }

    var stepsHtml = "";
    var k = 0;
    while (k < steps.length) {
      stepsHtml = stepsHtml + "<li><strong>" + steps[k].title + ":</strong><br>" + steps[k].detail + "</li>";
      k = k + 1;
    }
    stepsEl.innerHTML = stepsHtml;

    decEl.textContent = result.decimalText;
    binEl.textContent = result.binaryText;
    hexEl.textContent = result.hexText;
    decEl.classList.remove("placeholder");
    binEl.classList.remove("placeholder");
    hexEl.classList.remove("placeholder");

  } catch (err) {
    errorEl.textContent = err.message;
    stepsEl.innerHTML = "<li class=\"step-item placeholder\">Fix the input above and compute again.</li>";
  }
}

// helper functions

function powerOfTen(exponent) {
  var result = 1n;
  var count = 0;
  while (count < exponent) {
    result = result * 10n;
    count = count + 1;
  }
  return result;
}

function bigIntToBinaryString(value, width) {
  var bits = value.toString(2);
  while (bits.length < width) {
    bits = "0" + bits;
  }
  return bits;
}

function binaryStringToBigInt(bits) {
  return BigInt("0b" + bits);
}

function isInfinity(parts) {
  return parts.special === "inf";
}

function digitCountOf(coefficient) {
  return coefficient.toString().length;
}

function scientificExponentOf(coefficient, exponent) {
  return exponent + digitCountOf(coefficient) - 1;
}

// Formats a coefficient and exponent as normalized scientific notation, for example 1245n at exponent -1 becomes "1.245 x 10^2".

function formatScientific(sign, coefficient, exponent) {
  var digits = coefficient.toString();
  var signText = sign ? "-" : "";
  var sciExp = scientificExponentOf(coefficient, exponent);
  var mantissa;
  if (digits.length === 1) {
    mantissa = digits;
  } else {
    mantissa = digits.charAt(0) + "." + digits.substring(1);
  }
  return signText + mantissa + " x 10^" + sciExp;
}

// Formats a plain magnitude value as a decimal string with no forced leading digit, reusing the same digit placement logic used for the final decimal output.

function formatMagnitude(coefficient, localExponent) {
  return decimalTextFromCoefficientExponent(0, coefficient, localExponent);
}

// Stage 1, decode input into sign, coefficient, exponent

function detectInputType(raw) {
  var text = raw.trim();
  if (text === "") {
    return "invalid";
  }
  if (/^(0x|0X)?[0-9a-fA-F]{8}$/.test(text)) {
    return "hex";
  }
  var lower = text.toLowerCase();
  if (lower === "nan" || lower === "inf" || lower === "+inf" || lower === "infinity" || lower === "+infinity" || lower === "-inf" || lower === "-infinity") {
    return "decimal";
  }
  if (!isNaN(Number(text))) {
    return "decimal";
  }
  return "invalid";
}

function decimalStringToParts(text) {
  var trimmed = text.trim();
  var lower = trimmed.toLowerCase();

  if (lower === "nan") {
    return { special: "nan", sign: 0 };
  }
  if (lower === "inf" || lower === "+inf" || lower === "infinity" || lower === "+infinity") {
    return { special: "inf", sign: 0 };
  }
  if (lower === "-inf" || lower === "-infinity") {
    return { special: "inf", sign: 1 };
  }

  var num = Number(trimmed);
  if (isNaN(num)) {
    throw new Error("\"" + text + "\" is not a valid decimal number, 8 digit IEEE hex, or special value (inf, -inf, nan).");
  }
  if (num === 0) {
    var zeroSign = trimmed.charAt(0) === "-" ? 1 : 0;
    return { special: "zero", sign: zeroSign };
  }

  var sign = num < 0 ? 1 : 0;
  var absNum = Math.abs(num);

  var sciStr = absNum.toExponential();
  var sciParts = sciStr.split("e");
  var mantissaStr = sciParts[0];
  var sciExp = parseInt(sciParts[1], 10);

  var dotIndex = mantissaStr.indexOf(".");
  var cStr;
  var fractionDigitCount;
  if (dotIndex === -1) {
    cStr = mantissaStr;
    fractionDigitCount = 0;
  } else {
    cStr = mantissaStr.replace(".", "");
    fractionDigitCount = mantissaStr.length - dotIndex - 1;
  }

  var q = sciExp - fractionDigitCount;

  cStr = cStr.replace(/^0+/, "");
  if (cStr === "") {
    cStr = "0";
  }

  if (cStr.length > 7) {
    var diff = cStr.length - 7;
    cStr = cStr.substring(0, 7);
    q = q + diff;
  }

  var coefficient = BigInt(cStr);
  return { special: null, sign: sign, coefficient: coefficient, exponent: q };
}

function hexStringToParts(hexStr) {
  var clean = hexStr.trim().replace(/^0x/i, "");
  var uint32 = parseInt(clean, 16);

  var sign = 0;
  var rest = uint32;
  if (rest >= 2147483648) {
    sign = 1;
    rest = rest - 2147483648;
  }

  var restBits = rest.toString(2);
  while (restBits.length < 31) {
    restBits = "0" + restBits;
  }

  // The 31 non-sign bits split, in order, into the 5-bit combination
  // field, the 6-bit exponent continuation field, and the 20-bit
  // coefficient continuation field. These are contiguous, not
  // interleaved.
  var combination = restBits.substring(0, 5);
  var exponentContinuation = restBits.substring(5, 11);
  var coefficientContinuation = restBits.substring(11, 31);

  var topFour = combination.substring(0, 4);
  if (topFour === "1111") {
    var fifthBit = combination.charAt(4);
    if (fifthBit === "0") {
      return { special: "inf", sign: sign };
    } else {
      return { special: "nan", sign: sign };
    }
  }

  var topTwo = combination.substring(0, 2);
  var exponentTopBits;
  var msd;

  if (topTwo === "11") {
    exponentTopBits = combination.substring(2, 4);
    var lastBit = combination.charAt(4);
    msd = lastBit === "1" ? 9 : 8;
  } else {
    exponentTopBits = combination.substring(0, 2);
    var lowThreeBits = combination.substring(2, 5);
    msd = bcdBitsToDigit("0" + lowThreeBits);
  }

  var eBinFull = exponentTopBits + exponentContinuation;
  var eField = parseInt(eBinFull, 2);
  var exponent = eField - 101;

  var declet1 = coefficientContinuation.substring(0, 10);
  var declet2 = coefficientContinuation.substring(10, 20);
  var digitsGroup1 = decodeDeclet(declet1);
  var digitsGroup2 = decodeDeclet(declet2);

  var fullDigits = msd.toString() + digitsGroup1[0].toString() + digitsGroup1[1].toString() + digitsGroup1[2].toString() + digitsGroup2[0].toString() + digitsGroup2[1].toString() + digitsGroup2[2].toString();
  var coefficient = BigInt(fullDigits);

  if (eField === 0 && coefficient === 0n) {
    return { special: "zero", sign: sign };
  }

  return { special: null, sign: sign, coefficient: coefficient, exponent: exponent };
}

// Densely Packed Decimal (DPD) helpers, used to pack the 6 trailing
// coefficient digits into the 20-bit coefficient continuation field
// (two 10-bit declets of 3 digits each) and to unpack them again.
// These implement the standard Cowlishaw boolean equations, verified
// against the lecture's own worked example (digits 123 encode to
// 0010100011, digits 456 encode to 1001010110).

function digitToBcdBits(digit) {
  var bits = digit.toString(2);
  while (bits.length < 4) {
    bits = "0" + bits;
  }
  return bits;
}

function bcdBitsToDigit(bits) {
  return parseInt(bits, 2);
}

function boolToBit(value) {
  if (value) {
    return "1";
  }
  return "0";
}

function encodeDeclet(digitA, digitB, digitC) {
  var bitsA = digitToBcdBits(digitA);
  var bitsB = digitToBcdBits(digitB);
  var bitsC = digitToBcdBits(digitC);

  var a = bitsA.charAt(0) === "1";
  var b = bitsA.charAt(1) === "1";
  var c = bitsA.charAt(2) === "1";
  var d = bitsA.charAt(3) === "1";
  var e = bitsB.charAt(0) === "1";
  var f = bitsB.charAt(1) === "1";
  var g = bitsB.charAt(2) === "1";
  var h = bitsB.charAt(3) === "1";
  var i = bitsC.charAt(0) === "1";
  var j = bitsC.charAt(1) === "1";
  var k = bitsC.charAt(2) === "1";
  var m = bitsC.charAt(3) === "1";

  var p = b || (a && j) || (a && f && i);
  var q = c || (a && k) || (a && g && i);
  var r = d;
  var s = (f && (!a || !i)) || (!a && e && j) || (e && i);
  var t = g || (!a && e && k) || (a && i);
  var u = h;
  var v = a || e || i;
  var w = a || (e && i) || (!e && j);
  var x = e || (a && i) || (!a && k);
  var y = m;

  return boolToBit(p) + boolToBit(q) + boolToBit(r) + boolToBit(s) + boolToBit(t) + boolToBit(u) + boolToBit(v) + boolToBit(w) + boolToBit(x) + boolToBit(y);
}

function decodeDeclet(declet) {
  var p = declet.charAt(0) === "1";
  var q = declet.charAt(1) === "1";
  var r = declet.charAt(2) === "1";
  var s = declet.charAt(3) === "1";
  var t = declet.charAt(4) === "1";
  var u = declet.charAt(5) === "1";
  var v = declet.charAt(6) === "1";
  var w = declet.charAt(7) === "1";
  var x = declet.charAt(8) === "1";
  var y = declet.charAt(9) === "1";

  var a = (v && w) && (!s || t || !x);
  var b = p && (!v || !w || (s && !t && x));
  var c = q && (!v || !w || (s && !t && x));
  var d = r;
  var e = v && ((!w && x) || (!t && x) || (s && x));
  var f = (s && (!v || !x)) || (p && !s && t && v && w && x);
  var g = (t && (!v || !x)) || (q && !s && t && w);
  var h = u;
  var i = v && ((!w && !x) || (w && x && (s || t)));
  var j = (!v && w) || (s && v && !w && x) || (p && w && (!x || (!s && !t)));
  var k = (!v && x) || (t && !w && x) || (q && v && w && (!x || (!s && !t)));
  var m = y;

  var digitA = bcdBitsToDigit(boolToBit(a) + boolToBit(b) + boolToBit(c) + boolToBit(d));
  var digitB = bcdBitsToDigit(boolToBit(e) + boolToBit(f) + boolToBit(g) + boolToBit(h));
  var digitC = bcdBitsToDigit(boolToBit(i) + boolToBit(j) + boolToBit(k) + boolToBit(m));

  return [digitA, digitB, digitC];
}

function decodeOperand(raw) {
  var type = detectInputType(raw);
  if (type === "invalid") {
    throw new Error("\"" + raw + "\" is not a valid decimal number, 8 digit IEEE hex, or special value (inf, -inf, nan).");
  }
  var parts;
  if (type === "hex") {
    parts = hexStringToParts(raw);
  } else {
    parts = decimalStringToParts(raw);
  }
  parts.inputType = type;
  return parts;
}

// Both operands must be entered in the same format, both decimal (this
// also covers the inf, -inf, nan spellings) or both 8 digit IEEE hex.
// Mixing formats (one decimal, one hex) is not allowed.

function checkSameInputType(A, B) {
  if (A.inputType !== B.inputType) {
    throw new Error("Operand A is " + A.inputType + " and Operand B is " + B.inputType + ". Both operands must use the same input format, either both decimal or both 8 digit IEEE hex.");
  }
}

// Builds a step describing how an 8 digit IEEE hex operand unpacks into
// its 32 bit binary layout (sign, combination field, trailing digits),
// and what that decodes to. Only called for operands actually entered
// as hex, since decimal input never needs unpacking.

function describeHexUnpack(label, rawInput, parts) {
  var reEncoded = encodeFromParts(parts);
  var meaning;
  if (parts.special === "nan") {
    meaning = "sign = " + parts.sign + ", special value = NaN";
  } else if (parts.special === "inf") {
    meaning = "sign = " + parts.sign + ", special value = Infinity";
  } else if (parts.special === "zero") {
    meaning = "sign = " + parts.sign + ", value = 0";
  } else {
    meaning = "sign = " + parts.sign + ", coefficient (decimal) = " + parts.coefficient.toString() + ", exponent = " + parts.exponent;
  }
  return {
    title: "Unpack " + label + " from hex to binary",
    detail: label + " entered as " + rawInput.trim() + "<br>Unpacked to binary: " + reEncoded.binaryText + " (sign | combination | trailing)<br>Decodes to: " + meaning
  };
}

function flipEffectiveSign(parts) {
  var flippedSign = parts.sign === 0 ? 1 : 0;
  if (parts.special === "zero") {
    return { special: "zero", sign: flippedSign };
  }
  if (parts.special === "inf") {
    return { special: "inf", sign: flippedSign };
  }
  if (parts.special === "nan") {
    return { special: "nan", sign: flippedSign };
  }
  return { special: null, sign: flippedSign, coefficient: parts.coefficient, exponent: parts.exponent };
}

function encodeFromParts(parts) {
  if (parts.special === "nan") {
    return encodeSpecial(parts.sign, "nan");
  }
  if (parts.special === "inf") {
    return encodeSpecial(parts.sign, "inf");
  }
  if (parts.special === "zero") {
    return encodeDecimal32(parts.sign, 0n, -101);
  }
  return encodeDecimal32(parts.sign, parts.coefficient, parts.exponent);
}

// Stage 2, normalizeIEEEBin, gives the working (sign, significand, exponent)
// triple used by the alignment and operate stages below.

function normalizeIEEEBin(parts) {
  return { sign: parts.sign, significand: parts.coefficient, exponent: parts.exponent };
}

// Stage 5 (rounding functions), defined early since alignOperands below
// needs to call them when an aligned operand runs past 7 significant digits.

function roundTruncate() {
  return false;
}

function roundRoundUp(sign, hasRemainder) {
  return sign === 0 && hasRemainder;
}

function roundRoundDown(sign, hasRemainder) {
  return sign === 1 && hasRemainder;
}

function roundNearestEven(remainder, half, keptValue) {
  if (remainder > half) {
    return true;
  }
  if (remainder < half) {
    return false;
  }
  return (keptValue % 2n) === 1n;
}

function applyRoundingMethod(mode, sign, remainder, half, keptValue) {
  var hasRemainder = remainder !== 0n;
  if (mode === "chop") {
    return roundTruncate();
  }
  if (mode === "roundup") {
    return roundRoundUp(sign, hasRemainder);
  }
  if (mode === "rounddown") {
    return roundRoundDown(sign, hasRemainder);
  }
  return roundNearestEven(remainder, half, keptValue);
}

// Rounding, alignment, and final normalization all reuse the same
// remainder-vs-half comparison logic (applyRoundingMethod above), applied
// directly at each call site below rather than through extra wrapper
// functions, since the two spots that need it (combining the smaller
// operand's alignment shift, and normalizeResult) each shape the numbers
// slightly differently.

// Stage 3, alignment happens directly inside runSubtract below (it needs
// access to both the scientific-exponent display and the working-precision
// scale together, so keeping it inline avoids duplicating that math).

// Stage 4a, subtractAligned, combines two exact integer coefficients that
// already share the same working exponent.

function subtractAligned(coefficientBig, coefficientSmall, signBig, signSmall) {
  var rawValue;
  var resultSign;
  if (signBig === signSmall) {
    rawValue = coefficientBig + coefficientSmall;
    resultSign = signBig;
  } else if (coefficientBig >= coefficientSmall) {
    rawValue = coefficientBig - coefficientSmall;
    resultSign = signBig;
  } else {
    rawValue = coefficientSmall - coefficientBig;
    resultSign = signSmall;
  }
  return { rawValue: rawValue, resultSign: resultSign };
}

// Stage 4b, divideSignificands, exact long division using BigInt. The
// numerator is scaled up by extra decimal digits so the quotient always
// has enough digits to make a correct rounding decision later.

function divideSignificands(workingA, workingB) {
  var extraDigits = 10;
  var scale = powerOfTen(extraDigits);
  var scaledNumerator = workingA.significand * scale;
  var quotient = scaledNumerator / workingB.significand;
  var remainder = scaledNumerator - quotient * workingB.significand;
  var resultSign = workingA.sign === workingB.sign ? 0 : 1;
  var initialExponent = workingA.exponent - workingB.exponent - extraDigits;
  return { quotient: quotient, remainder: remainder, resultSign: resultSign, initialExponent: initialExponent };
}

// Stage 6, normalizeResult, caps the coefficient at 7 digits, handles
// overflow and underflow, and packs the final bit pattern.

function normalizeResult(sign, coefficient, exponent, mode, steps) {
  var digits = digitCountOf(coefficient);
  var finalCoefficient = coefficient;
  var finalExponent = exponent;

  if (digits > 7) {
    var extraDigits = digits - 7;
    var divisor = powerOfTen(extraDigits);
    var half = divisor / 2n;
    var kept = coefficient / divisor;
    var remainder = coefficient - kept * divisor;
    var inc = applyRoundingMethod(mode, sign, remainder, half, kept);
    finalCoefficient = inc ? kept + 1n : kept;
    finalExponent = exponent + extraDigits;
  }

  // Rounding up the very last digit can itself carry the coefficient past
  // 7 digits (for example 9999999 rounding up to 10000000), so check once
  // more and shed exactly one more digit if that happened. This never
  // needs its own rounding decision since the extra digit is always 0.
  if (finalCoefficient >= 10000000n) {
    finalCoefficient = finalCoefficient / 10n;
    finalExponent = finalExponent + 1;
  }

  if (finalCoefficient === 0n) {
    steps.push({ title: "Step 5 (Normalize result)", detail: "R = 0" });
    return encodeDecimal32(sign, 0n, -101);
  }

  var eField = finalExponent + 101;
  if (eField > 191) {
    steps.push({ title: "Overflow", detail: "Exponent " + finalExponent + " is out of range, result rounds to " + (sign ? "-" : "+") + "Infinity." });
    return encodeSpecial(sign, "inf");
  }
  if (eField < 0) {
    steps.push({ title: "Underflow", detail: "Exponent " + finalExponent + " is below the representable range, flushed to signed zero." });
    return encodeDecimal32(sign, 0n, -101);
  }

  steps.push({ title: "Step 5 (Normalize result)", detail: "R = " + formatScientific(sign, finalCoefficient, finalExponent) + " = " + (sign ? "-" : "") + formatMagnitude(finalCoefficient, finalExponent) });
  return encodeDecimal32(sign, finalCoefficient, finalExponent);
}

// Packing and formatting, mirrors SPConversion.js's own bit layout exactly.

function encodeDecimal32(sign, coefficient, exponent) {
  if (coefficient === 0n) {
    var zeroCombination = "00000";
    var zeroExponentContinuation = "000000";
    var zeroCoefficientContinuation = "0000000000 0000000000";
    var zeroBinary = (sign ? "1" : "0") + " " + zeroCombination + " " + zeroExponentContinuation + " " + zeroCoefficientContinuation;
    var zeroHex = binaryStringToHex(zeroBinary);
    var zeroDecimal = sign ? "-0" : "0";
    return { binaryText: zeroBinary, hexText: zeroHex, decimalText: zeroDecimal };
  }

  var eField = exponent + 101;
  var eBin = eField.toString(2);
  while (eBin.length < 8) {
    eBin = "0" + eBin;
  }

  // The coefficient is at most 7 decimal digits. Pad on the left with
  // zeros to exactly 7 digits, split off the most significant digit
  // (stored inside the combination field), and pack the remaining 6
  // digits into two 10-bit DPD declets for the coefficient continuation.
  var digitString = coefficient.toString();
  while (digitString.length < 7) {
    digitString = "0" + digitString;
  }
  var msd = parseInt(digitString.charAt(0), 10);
  var declet1 = encodeDeclet(parseInt(digitString.charAt(1), 10), parseInt(digitString.charAt(2), 10), parseInt(digitString.charAt(3), 10));
  var declet2 = encodeDeclet(parseInt(digitString.charAt(4), 10), parseInt(digitString.charAt(5), 10), parseInt(digitString.charAt(6), 10));
  var coefficientContinuation = declet1 + " " + declet2;

  var combination;
  if (msd >= 8) {
    var lastBit = msd === 9 ? "1" : "0";
    combination = "11" + eBin.substring(0, 2) + lastBit;
  } else {
    var msdBits = digitToBcdBits(msd);
    combination = eBin.substring(0, 2) + msdBits.substring(1);
  }
  var exponentContinuation = eBin.substring(2);

  var binaryText = (sign ? "1" : "0") + " " + combination + " " + exponentContinuation + " " + coefficientContinuation;
  var hexText = binaryStringToHex(binaryText);
  var decimalText = decimalTextFromCoefficientExponent(sign, coefficient, exponent);

  return { binaryText: binaryText, hexText: hexText, decimalText: decimalText };
}

function encodeSpecial(sign, kind) {
  var combination;
  var decimalText;
  if (kind === "inf") {
    combination = "11110";
    decimalText = sign ? "-Infinity" : "+Infinity";
  } else {
    combination = "11111";
    decimalText = "NaN";
  }
  var binaryText = (sign ? "1" : "0") + " " + combination + " " + "000000" + " " + "0000000000 0000000000";
  var hexText = binaryStringToHex(binaryText);
  return { binaryText: binaryText, hexText: hexText, decimalText: decimalText };
}

function binaryStringToHex(binaryText) {
  var bitsOnly = binaryText.split(" ").join("");
  var value = binaryStringToBigInt(bitsOnly);
  var hex = value.toString(16).toUpperCase();
  while (hex.length < 8) {
    hex = "0" + hex;
  }
  return "0x" + hex;
}

function decimalTextFromCoefficientExponent(sign, coefficient, exponent) {
  var digits = coefficient.toString();
  var signText = sign ? "-" : "";

  if (exponent >= 0) {
    var zerosToAdd = "";
    var count = 0;
    while (count < exponent) {
      zerosToAdd = zerosToAdd + "0";
      count = count + 1;
    }
    return signText + digits + zerosToAdd;
  }

  var fractionDigits = -exponent;
  if (digits.length <= fractionDigits) {
    var padding = "";
    var needed = fractionDigits - digits.length;
    var count2 = 0;
    while (count2 < needed) {
      padding = padding + "0";
      count2 = count2 + 1;
    }
    return signText + "0." + padding + digits;
  }

  var splitPoint = digits.length - fractionDigits;
  var wholePart = digits.substring(0, splitPoint);
  var fracPart = digits.substring(splitPoint);
  return signText + wholePart + "." + fracPart;
}

// runSubtract and runDivide. Each handles special cases
// first (NaN, Infinity combinations, zero combinations), then falls
// through to the generic 5 stage pipeline for finite nonzero operands.

function runSubtract(rawA, rawB, mode, steps) {
  var A = decodeOperand(rawA);
  var B = decodeOperand(rawB);
  checkSameInputType(A, B);

  if (A.inputType === "hex") {
    steps.push(describeHexUnpack("A", rawA, A));
  }
  if (B.inputType === "hex") {
    steps.push(describeHexUnpack("B", rawB, B));
  }

  if (A.special === "nan" || B.special === "nan") {
    steps.push({ title: "Special case", detail: "An operand is NaN, result is NaN." });
    return encodeSpecial(0, "nan");
  }

  var Beff = flipEffectiveSign(B);

  if (A.special === "inf" && Beff.special === "inf") {
    if (A.sign === Beff.sign) {
      steps.push({ title: "Special case", detail: "Infinity plus infinity of the same sign is Infinity." });
      return encodeSpecial(A.sign, "inf");
    }
    steps.push({ title: "Special case", detail: "Infinity minus infinity is undefined, result is NaN." });
    return encodeSpecial(0, "nan");
  }
  if (A.special === "inf") {
    steps.push({ title: "Special case", detail: "A is Infinity, result is Infinity with A's sign." });
    return encodeSpecial(A.sign, "inf");
  }
  if (Beff.special === "inf") {
    steps.push({ title: "Special case", detail: "B is Infinity, result is Infinity with the opposite of B's sign." });
    return encodeSpecial(Beff.sign, "inf");
  }

  if (A.special === "zero" && Beff.special === "zero") {
    if (A.sign === Beff.sign) {
      steps.push({ title: "Special case", detail: "Zero plus or minus zero of the same sign is zero." });
      return encodeDecimal32(A.sign, 0n, -101);
    }
    var tieSign = mode === "rounddown" ? 1 : 0;
    steps.push({ title: "Special case", detail: "Exact cancellation of equal magnitudes, result is zero." });
    return encodeDecimal32(tieSign, 0n, -101);
  }
  if (A.special === "zero") {
    steps.push({ title: "Special case", detail: "A is zero, result equals negative B." });
    return encodeFromParts(Beff);
  }
  if (Beff.special === "zero") {
    steps.push({ title: "Special case", detail: "B is zero, result equals A." });
    return encodeFromParts(A);
  }

  var workingA = normalizeIEEEBin(A);
  var workingBeff = normalizeIEEEBin(Beff);

  steps.push({ title: "Step 1 (Normalize)", detail: "A = " + formatScientific(A.sign, workingA.significand, workingA.exponent) + "<br>B = " + formatScientific(Beff.sign, workingBeff.significand, workingBeff.exponent)});

  var sciExpA = scientificExponentOf(workingA.significand, workingA.exponent);
  var sciExpBeff = scientificExponentOf(workingBeff.significand, workingBeff.exponent);
  var sharedSciExp = sciExpA >= sciExpBeff ? sciExpA : sciExpBeff;

  var big;
  var small;
  var bigSign;
  var smallSign;
  if (sciExpA >= sciExpBeff) {
    big = workingA;
    small = workingBeff;
    bigSign = A.sign;
    smallSign = Beff.sign;
  } else {
    big = workingBeff;
    small = workingA;
    bigSign = Beff.sign;
    smallSign = A.sign;
  }

  var bigLocalExponent = big.exponent - sharedSciExp;
  var smallLocalExponent = small.exponent - sharedSciExp;
  var alignedBigText = formatMagnitude(big.significand, bigLocalExponent);
  var alignedSmallText = formatMagnitude(small.significand, smallLocalExponent);

  steps.push({ title: "Step 2 (Align exponents to 10^" + sharedSciExp + ")", detail: "A = " + (bigSign ? "-" : "") + alignedBigText + " x 10^" + sharedSciExp + "<br>B = " + (smallSign ? "-" : "") + alignedSmallText + " x 10^" + sharedSciExp });

  // Every valid decimal32 operand already has at most 7 significant
  // digits (that is enforced back in decodeOperand), so there is nothing
  // to round away here. Rounding only becomes necessary on the result of
  // the operation, in Step 5 below. Confirm and show that plainly.
  steps.push({ title: "Step 3 (Rounding method: " + mode + ")", detail: "A already has " + digitCountOf(big.significand) + " significant digit(s), B already has " + digitCountOf(small.significand) + " significant digit(s), both within the 7 digit limit, so neither needs rounding yet.<br>A = " + formatScientific(bigSign, big.significand, big.exponent) + "<br>B = " + formatScientific(smallSign, small.significand, small.exponent) });

  // Combine at full exact precision: use whichever raw exponent is
  // smaller as the common scale (scaling the other operand's coefficient
  // up by an exact power of ten never loses a digit), so the result R is
  // exact before Step 5 rounds it. This avoids double-rounding the result.
  // Note this is independent of which operand was labeled "big" above,
  // since that labeling was by scientific exponent (digit count and
  // exponent combined) for the Step 1 to 3 display, not by raw exponent.
  var commonExponent = workingA.exponent < workingBeff.exponent ? workingA.exponent : workingBeff.exponent;
  var scaledACoefficient = workingA.significand * powerOfTen(workingA.exponent - commonExponent);
  var scaledBeffCoefficient = workingBeff.significand * powerOfTen(workingBeff.exponent - commonExponent);
  var combined = subtractAligned(scaledACoefficient, scaledBeffCoefficient, A.sign, Beff.sign);
  var rText = formatMagnitude(combined.rawValue, commonExponent);
  steps.push({ title: "Step 4 (Operation: subtract)", detail: "A = " + (A.sign ? "-" : "") + formatMagnitude(scaledACoefficient, commonExponent) + "<br>B = " + (Beff.sign ? "-" : "") + formatMagnitude(scaledBeffCoefficient, commonExponent) + "<br>R = " + (combined.resultSign ? "-" : "") + rText });

  if (combined.rawValue === 0n) {
    var zeroSign = mode === "rounddown" ? 1 : 0;
    steps.push({ title: "Step 5 (Normalize result)", detail: "R = 0" });
    return encodeDecimal32(zeroSign, 0n, -101);
  }

  return normalizeResult(combined.resultSign, combined.rawValue, commonExponent, mode, steps);
}

function runDivide(rawA, rawB, mode, steps) {
  var A = decodeOperand(rawA);
  var B = decodeOperand(rawB);
  checkSameInputType(A, B);

  if (A.inputType === "hex") {
    steps.push(describeHexUnpack("A", rawA, A));
  }
  if (B.inputType === "hex") {
    steps.push(describeHexUnpack("B", rawB, B));
  }

  var resultSign = A.sign === B.sign ? 0 : 1;

  if (A.special === "nan" || B.special === "nan") {
    steps.push({ title: "Special case", detail: "An operand is NaN, result is NaN." });
    return encodeSpecial(0, "nan");
  }
  if ((A.special === "zero" && B.special === "zero") || (isInfinity(A) && isInfinity(B))) {
    steps.push({ title: "Special case", detail: "Zero divided by zero, or infinity divided by infinity, is undefined, result is NaN." });
    return encodeSpecial(0, "nan");
  }
  if (isInfinity(A)) {
    steps.push({ title: "Special case", detail: "A is Infinity, B is finite, result is Infinity." });
    return encodeSpecial(resultSign, "inf");
  }
  if (isInfinity(B)) {
    steps.push({ title: "Special case", detail: "B is Infinity, A is finite, result is zero." });
    return encodeDecimal32(resultSign, 0n, -101);
  }
  if (A.special === "zero") {
    steps.push({ title: "Special case", detail: "A is zero, B is nonzero, result is zero." });
    return encodeDecimal32(resultSign, 0n, -101);
  }
  if (B.special === "zero") {
    steps.push({ title: "Special case", detail: "Division by zero, result is Infinity." });
    return encodeSpecial(resultSign, "inf");
  }

  var workingA = normalizeIEEEBin(A);
  var workingB = normalizeIEEEBin(B);

  steps.push({ title: "Step 1 (Normalize)", detail: "A = " + formatScientific(A.sign, workingA.significand, workingA.exponent) + "<br>B = " + formatScientific(B.sign, workingB.significand, workingB.exponent) });

  var sciExpA = scientificExponentOf(workingA.significand, workingA.exponent);
  var sciExpB = scientificExponentOf(workingB.significand, workingB.exponent);
  steps.push({ title: "Step 2 (Compute exponent difference)", detail: "Quotient exponent starts at " + sciExpA + " - " + sciExpB + " = " + (sciExpA - sciExpB) });

  var divResult = divideSignificands(workingA, workingB);
  var digitCount = digitCountOf(divResult.quotient);
  var rawQuotientText = formatMagnitude(divResult.quotient, divResult.initialExponent);
  steps.push({ title: "Step 3 (Operation: divide)", detail: "A = " + formatMagnitude(workingA.significand, workingA.exponent) + "<br>B = " + formatMagnitude(workingB.significand, workingB.exponent) + "<br>R (before rounding) = " + rawQuotientText });

  var extraDigits = digitCount - 7;
  var sig7;
  var exp;

  if (extraDigits > 0) {
    var divisor = powerOfTen(extraDigits);
    var half = divisor / 2n;
    var kept = divResult.quotient / divisor;
    var intRemainder = divResult.quotient - kept * divisor;
    exp = divResult.initialExponent + extraDigits;

    var effectiveRemainder = intRemainder;
    if (intRemainder === half && divResult.remainder !== 0n) {
      effectiveRemainder = half + 1n;
    }

    var inc = applyRoundingMethod(mode, resultSign, effectiveRemainder, half, kept);
    sig7 = kept;
    if (inc) {
      sig7 = sig7 + 1n;
    }
  } else {
    sig7 = divResult.quotient;
    exp = divResult.initialExponent;
  }

  steps.push({ title: "Step 4 (Rounding method: " + mode + ")", detail: "R (before rounding) = " + rawQuotientText + "<br>R (rounded to 7 digits) = " + (resultSign ? "-" : "") + formatMagnitude(sig7, exp) });

  return normalizeResult(resultSign, sig7, exp, mode, steps);
}
