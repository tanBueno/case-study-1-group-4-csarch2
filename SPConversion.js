function handleConversion() {
    const inputDecimal = document.getElementById("input-convert-decimal").value.trim().toLowerCase();
//error check
    if (!inputDecimal) {
        alert("Input a Decimal Number");
        return;
    }

    let binaryResult = "";
    let hexResult = "";
    let specialCase = "None";
//special cases
    if (inputDecimal === "nan") {
        binaryResult = "0 11111 000000 00000000000000000000";
        hexResult = "0x7C000000";
        specialCase = "NaN";
    } else if (inputDecimal === "infinity" || inputDecimal === "+infinity"|| inputDecimal === "Infinity"|| inputDecimal === "+Infinity") {
        binaryResult = "0 11110 000000 00000000000000000000";
        hexResult = "0x78000000";
        specialCase = "+Infinity";
    } else if (inputDecimal === "-infinity"|| inputDecimal === "-Infinity") {
        binaryResult = "1 11110 000000 00000000000000000000";
        hexResult = "0xF8000000";
        specialCase = "-Infinity";
    } else if (parseFloat(inputDecimal) === 0 && !inputDecimal.includes("e")) {
        specialCase = "Zero";
        
        if (inputDecimal.startsWith("-")) {
            binaryResult = "1 01000 100101 00000000000000000000";
            hexResult = "0xA2A00000";
        } else {
            binaryResult = "0 01000 100101 00000000000000000000";
            hexResult = "0x22A00000";
        }
    } else {
        let parts = inputDecimal.split('e');
        let base = parts[0];
        let exp;

        if (parts.length > 1) {
            exp = parseInt(parts[1], 10);
        } else {
            exp = 0;
        }

    //deetermine the sign bit
        let signBit;
        if (base.startsWith("-")) {
            signBit = "1";
        } else {
            signBit = "0";
        }

        base = base.replace("-", "").replace("+", "");//remove the signs

        let decIndex = base.indexOf(".");// find the decimal point
        let cStr = "";

        if (decIndex === -1) {
            cStr = base;//if no dec point its just the base
        } else {
            cStr = base.replace(".", "");// if there is, remove it 
            exp -= (base.length - 1 - decIndex); //decrease the exp by the munber of move
        }
        
        cStr = cStr.replace(/^0+/, ""); //strip leasing zero from the coef
        if (cStr === "") cStr = "0";

        if (cStr.length < 7) { // if there are fewer than 7 digits add zero to the right
            let diff = 7 - cStr.length;
            cStr = cStr.padEnd(7, '0');
            exp -= diff;
        } else if (cStr.length > 7) {// if theres morethan 7 calculate the excess and add to the exponent
            let diff = cStr.length - 7;
            cStr = cStr.substring(0, 7);
            exp += diff;
        }

        let E = exp + 101; //exponent
        if (E < 0 || E > 191) {
            alert("Exponent out of bounds");
            return;
        }

        let eBin = E.toString(2).padStart(8, '0');// convert the Exp into binary and pad the leftside with 0
        let expMSBs = eBin.substring(0, 2); //msb
        let expCont = eBin.substring(2, 8); //exp cont
        
        let MSD = parseInt(cStr[0], 10);//get the msb, convertt to int 
        let msdBin = MSD.toString(2).padStart(4, '0');//convert back to 4 bin string
        
        let combination = "";
        if (MSD < 8) { 
            combination = expMSBs + msdBin.substring(1, 4);
        } else {       
            combination = "11" + expMSBs + msdBin[3];
        }

        let group1 = cStr.substring(1, 4);// split the final 6 digits of the coef into 2 strngs with 3 digigts each
        let group2 = cStr.substring(4, 7);

        let rawCoefCont = encodeDPD(group1) + encodeDPD(group2);
        let visualCoefCont = encodeDPD(group1) + " " + encodeDPD(group2);
         //formatting result
        binaryResult = signBit + " " + combination + " " + expCont + " " + visualCoefCont;
        
       let rawBinary = signBit + combination + expCont + rawCoefCont;
        let hexNum = parseInt(rawBinary, 2).toString(16).toUpperCase();
        hexResult = "0x" + hexNum.padStart(8, '0');
    }

    // push the result to the html
    document.getElementById("out-convert-binary").innerText = binaryResult;
    document.getElementById("out-convert-hex").innerText = hexResult;
    document.getElementById("out-convert-special").innerText = specialCase;
}

//hlper function to encode 3 decimal digits into 10 bits denseley packed
function encodeDPD(digitStr) {
    let d1 = parseInt(digitStr[0], 10).toString(2).padStart(4, '0');//convert each of the 3 dec digits into 4bit bin strings
    let d2 = parseInt(digitStr[1], 10).toString(2).padStart(4, '0');
    let d3 = parseInt(digitStr[2], 10).toString(2).padStart(4, '0');
    //maps each 12 bin digits to an individual letter variable
    let a = d1[0], b = d1[1], c = d1[2], d = d1[3];
    let e = d2[0], f = d2[1], g = d2[2], h = d2[3];
    let i = d3[0], j = d3[1], k = d3[2], m = d3[3];

    let aei = a + e + i;//combine the msb of all theree digits to make a 3 bit flag
    
    switch(aei) {//denseley packed lookup table
        case "000": return b+c+d + f+g+h + "0" + j+k+m;
        case "001": return b+c+d + f+g+h + "100" + m;
        case "010": return b+c+d + j+k+h + "101" + m;
        case "011": return b+c+d + "10"+h + "111" + m;
        case "100": return j+k+d + f+g+h + "110" + m;
        case "101": return f+g+d + "11"+h + "111" + m;
        case "110": return j+k+d + "00"+h + "111" + m;
        case "111": return "00"+d + "11"+h + "111" + m;
        default: return "0000000000";
    }
}

document.getElementById("btn-convert").addEventListener("click", handleConversion);
