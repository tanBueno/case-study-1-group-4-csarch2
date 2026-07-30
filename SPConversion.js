function handleConversion() {
    const inputDecimal = document.getElementById("input-convert-decimal").value.trim();

    if (!inputDecimal){
        alert("Input a Decimal Number");
    return;
}


let binaryResult = "";
let hexResult = "";
let specialCase = "None";

//Special Cases
    const lowerInput = inputDecimal.toLowerCase();
    if (lowerInput === "nan") {
        binaryResult = "0 11111000000 00000000000000000000";
        hexResult = "0x7C000000";
        specialCase = "NaN";
    } else if (lowerInput === "infinity" || lowerInput === "+infinity") {
        binaryResult = "0 11110000000 00000000000000000000";
        hexResult = "0x78000000";
        specialCase = "+Infinity";
    } else if (lowerInput === "-infinity") {
        binaryResult = "1 11110000000 00000000000000000000";
        hexResult = "0xF8000000";
        specialCase = "-Infinity";
    } else if (parseFloat(inputDecimal) === 0) {
        let sign = inputDecimal.startsWith("-") ? "1" : "0";
        binaryResult = `${sign} 01100101000 00000000000000000000`; // Exponent 101, Coeff 0
        hexResult = sign === "1" ? "0xB2800000" : "0x32800000";
        specialCase = "Zero";
    } else {
//conversion logic
        let signBit = inputDecimal.startsWith("-") ? "1" : "0";
        let valStr = inputDecimal.replace("-", "");
        
        let decIndex = valStr.indexOf(".");
        let cStr = "";
        let q = 0;
        
        if (decIndex === -1) {
            cStr = valStr;
            q = 0;
        } else {
            cStr = valStr.replace(".", "");
            q = -(valStr.length - 1 - decIndex);
        }
        
        cStr = cStr.replace(/^0+/, "");
        //max 7 dec digits
        if (cStr.length > 7) {
            let diff = cStr.length - 7;
            cStr = cStr.substring(0, 7);
            q += diff;
        }
        
        let C = parseInt(cStr, 10);
        let E = q + 101;
        
        if (E < 0 || E > 191) {
            alert("Exponent out of bounds");
            return;
        }

        // 3. Bitwise Assembly
        let cBin = C.toString(2).padStart(24, '0');
        let eBin = E.toString(2).padStart(8, '0');
        
        let combination = "";
        let trailing = "";
        
        if (C >= 8388608) {
            combination = "11" + eBin + cBin[3];
            trailing = cBin.substring(4);
        } else {
            combination = eBin + cBin.substring(1, 4);
            trailing = cBin.substring(4);
        }
        
        binaryResult = `${signBit} ${combination} ${trailing}`;
        
        let rawBinary = signBit + combination + trailing;
        let hexNum = parseInt(rawBinary, 2).toString(16).toUpperCase();
        hexResult = "0x" + hexNum.padStart(8, '0');
    }

    //4. Push the results back to the HTML GUI
    document.getElementById("out-convert-binary").innerText = binaryResult;
    document.getElementById("out-convert-hex").innerText = hexResult;
    document.getElementById("out-convert-special").innerText = specialCase;
}
    document.getElementById("btn-convert").addEventListener("click", handleConversion);