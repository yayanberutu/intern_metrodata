var daftarAngka = new Array("", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE");

function terbilang(nilai) {
    var temp = '';
    var batas = 3;
    var maxBagian = 5;
    var gradeNilai = new Array("HUNDRED", "THOUSAND", "MILLION", "BILLION", "TRILLION");
    nilai = this.hapusNolDiDepan(nilai);
    var nilaiTemp = ubahStringKeArray(batas, maxBagian, nilai);
    var j = nilai.length;
    var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    var h = 0;
    for (var i = banyakBagian - 1; i >= 0; i--) {
        var nilaiSementara = parseInt(nilaiTemp[h]);
        temp += this.ubahRatusanKeHuruf(nilaiTemp[h]) + " ";
        if (nilaiTemp[h] != "000") {
            temp += gradeNilai[i] + " ";
        }

        h++;
    }
    return temp;
}

function ubahStringKeArray(batas, maxBagian, kata) {
    var temp = new Array(maxBagian);
    var j = kata.length;
    var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    for (var i = banyakBagian - 1; i >= 0; i--) {
        var k = j - batas;
        if (k < 0) k = 0;
        temp[i] = kata.substring(k, j);
        j = k;
        if (j == 0)
            break;
    }
    return temp;
}

function ubahRatusanKeHuruf(nilai) {
    var batas = 2;
    var maxBagian = 2;
    var temp = this.ubahStringKeArray(batas, maxBagian, nilai);
    var j = nilai.length;
    var hasil = "";
    var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    for (var i = 0; i < banyakBagian; i++) {
        if (temp[i].length > 1) {
            if (temp[i].charAt(0) == '1') {
                if (temp[i].charAt(1) == '0') {
                    hasil += "TEN";
                } else if (temp[i].charAt(1) == '1') {
                    hasil += "ELEVEN";
                } else if (temp[i].charAt(1) == '2') {
                    hasil += "TWELVE";
                } else if (temp[i].charAt(1) == '3') {
                    hasil += "THIRTEEN";
                } else if (temp[i].charAt(1) == '4') {
                    hasil += "FOURTEEN";
                } else if (temp[i].charAt(1) == '5') {
                    hasil += "FIFTEEN";
                } else if (temp[i].charAt(1) == '6') {
                    hasil += "SIXTEEN";
                } else if (temp[i].charAt(1) == '7') {
                    hasil += "SEVENTEEN";
                } else if (temp[i].charAt(1) == '8') {
                    hasil += "EIGHTEEN";
                } else if (temp[i].charAt(1) == '9') {
                    hasil += "NINETEEN";
                }
            } else if (temp[i].charAt(0) == '0') {
                hasil += daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '2') {
                hasil += "TWENTY " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '3') {
                hasil += "THIRTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '4') {
                hasil += "FOURTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '5') {
                hasil += "FIFTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '6') {
                hasil += "SIXTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '7') {
                hasil += "SEVENTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '8') {
                hasil += "EIGHTEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            } else if (temp[i].charAt(1) == '9') {
                hasil += "NINETEEN " + daftarAngka[temp[i].charAt(1) - '0'];
            }
        } else {
            if (i == 0 && banyakBagian != 1) {
                if (temp[i].charAt(0) == '0')
                    hasil += " ";
                else hasil += daftarAngka[parseInt(temp[i])] + " HUNDRED ";
            } else hasil += daftarAngka[parseInt(temp[i])];
        }
    }
    return hasil;
}

function hapusNolDiDepan(nilai) {
    while (nilai.indexOf("0") == 0) {
        nilai = nilai.substring(1, nilai.length);
    }
    return nilai;
}