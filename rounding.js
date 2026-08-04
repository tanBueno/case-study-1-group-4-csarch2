// Add 1 to the Least Significant Bit (LSB) of a binary string
function addOneToBinaryString(binStr) {
    let isNegative = binStr.startsWith("-");
    if (isNegative) binStr = binStr.substring(1);

    let parts = binStr.split(".");
    let intPart = parts[0];
    let fracPart = parts[1] || "";
    
    let combined = intPart + fracPart;
    let carry = 1;
    let result = "";

    for (let i = combined.length - 1; i >= 0; i--) {
        let sum = parseInt(combined[i]) + carry;
        if (sum === 2) {
            result = "0" + result;
            carry = 1;
        } else {
            result = sum.toString() + result;
            carry = 0;
        }
    }
    
    if (carry === 1) result = "1" + result;

    let finalStr = "";
    if (fracPart.length > 0) {
        finalStr = result.slice(0, -fracPart.length) + "." + result.slice(-fracPart.length);
    } else {
        finalStr = result;
    }
    
    return (isNegative ? "-" : "") + finalStr;
}

// Decimal Rounding Logic
function roundDecimal(val, digits) {
    const num = parseFloat(val);
    if (isNaN(num)) return { chop: "Invalid", up: "Invalid", down: "Invalid", even: "Invalid" };
    
    const m = Math.pow(10, digits);
    
    // floating point math errors for accurate rounding
    const safeNum = parseFloat(num.toFixed(10));
    
    const chop = Math.trunc(safeNum * m) / m;
    const up = Math.ceil(safeNum * m) / m;
    const down = Math.floor(safeNum * m) / m;
    
    const rawScaled = Math.abs(num) * m;
    const scaled = parseFloat(rawScaled.toFixed(8)); 
    const trunc = Math.floor(scaled);
    const frac = scaled - trunc;
    
    let roundedEven = trunc;
    if (frac > 0.5 || (frac === 0.5 && trunc % 2 !== 0)) {
        roundedEven += 1; 
    }
    const even = (num < 0 ? -roundedEven : roundedEven) / m;

    // preserve negative zero
    const formatResult = (value) => {
        const isNegativeZero = (value === 0 && val.trim().startsWith("-"));
        let formatted = value.toFixed(digits);
        return isNegativeZero ? "-" + formatted : formatted;
    };

    return {
        chop: formatResult(chop),
        up: formatResult(up),
        down: formatResult(down),
        even: formatResult(even)
    };
}

// Binary Rounding Logic
function roundBinary(valStr, digits) {
    let isNegative = valStr.startsWith("-");
    let cleanStr = isNegative ? valStr.substring(1) : valStr;

    let [intPart, fracPart] = cleanStr.split(".");
    if (!fracPart) fracPart = "";
    
    const isZero = (intPart.replace(/^0+/, "") === "" || intPart === "0") && 
                   (fracPart.replace(/0+$/, "") === "" || fracPart === "");

    if (fracPart.length <= digits) {
        let paddedFrac = fracPart.padEnd(digits, "0");
        let result = digits > 0 ? `${intPart}.${paddedFrac}` : intPart;
        if (isNegative && isZero) result = "-" + result;
        else if (isNegative && result !== "0") result = "-" + result;
        return { chop: result, up: result, down: result, even: result };
    }

    const keptFrac = fracPart.substring(0, digits);
    const roundBit = fracPart[digits];
    const stickyBit = fracPart.substring(digits + 1).includes("1") ? "1" : "0";
    
    let chopStr = digits > 0 ? `${intPart}.${keptFrac}` : intPart;
    let signedChop = (isNegative && chopStr !== "0") ? "-" + chopStr : chopStr;
    if (isNegative && isZero) signedChop = "-" + chopStr;
    
    const hasDiscardedOnes = roundBit === "1" || stickyBit === "1";
    
    let upStr = signedChop;
    let downStr = signedChop;
    let evenStr = signedChop;

    if (!isNegative && hasDiscardedOnes) upStr = addOneToBinaryString(signedChop);
    if (isNegative && hasDiscardedOnes) downStr = addOneToBinaryString(signedChop);
    if (roundBit === "1" && (stickyBit === "1" || keptFrac.endsWith("1") || (digits === 0 && intPart.endsWith("1")))) {
        evenStr = addOneToBinaryString(signedChop);
    }

    // preserve negative zero
    if (isNegative && isZero) {
        upStr = "-" + chopStr;
        downStr = "-" + chopStr;
        evenStr = "-" + chopStr;
    }

    return { chop: signedChop, up: upStr, down: downStr, even: evenStr };
}

document.addEventListener("DOMContentLoaded", () => {
    // Target the elements using the specific IDs
    const valueInput = document.getElementById("round-val");
    const formatSelect = document.getElementById("round-format");
    const targetDigitsInput = document.getElementById("round-digits");
    const roundBtn = document.getElementById("round-btn");
    
    const outChop = document.getElementById("out-chop");
    const outUp = document.getElementById("out-up");
    const outDown = document.getElementById("out-down");
    const outEven = document.getElementById("out-even");

    roundBtn.addEventListener("click", () => {
        const val = valueInput.value.trim();
        const format = formatSelect.value;
        const digits = parseInt(targetDigitsInput.value, 10);

        if (!val || isNaN(digits) || digits < 0) {
            alert("Please enter a valid number and a non-negative target for digits.");
            return;
        }

        let results;
        if (format === "Decimal") {
            results = roundDecimal(val, digits);
        } else {
            if (!/^-?[01]+(\.[01]+)?$/.test(val)) {
                alert("Please enter a valid binary number.");
                return;
            }
            results = roundBinary(val, digits);
        }

        outChop.textContent = results.chop;
        outUp.textContent = results.up;
        outDown.textContent = results.down;
        outEven.textContent = results.even;
    });
});