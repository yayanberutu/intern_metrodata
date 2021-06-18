var daftarAngka=new Array("","satu","dua","tiga","empat","lima","enam","tujuh","delapan","sembilan");
function terbilang(nilai){
    var temp='';
    var batas=3;
    var maxBagian = 5;
    var gradeNilai=new Array("","ribu","juta","milyar","triliun");
    nilai = this.hapusNolDiDepan(nilai);
    var nilaiTemp = ubahStringKeArray(batas, maxBagian, nilai);
    var j = nilai.length;
    var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    var h=0;
        for(var i = banyakBagian - 1; i >=0; i-- ){
            var nilaiSementara = parseInt(nilaiTemp[h]);
            if (nilaiSementara == 1 && i == 1){ 
                temp +="seribu ";
                }
            else {
                temp +=this.ubahRatusanKeHuruf(nilaiTemp[h])+" ";
                if(nilaiTemp[h] != "000"){
                    temp += gradeNilai[i]+" ";
                    }
                }
            h++;
            }
return temp;
}
function ubahStringKeArray(batas, maxBagian, kata){
    //batas 3, maxBagian 5, kata 1525
var temp= new Array(maxBagian);
var j = kata.length;
var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    for(var i = banyakBagian - 1; i >= 0 ; i--){ 
        var k = j - batas;
        if(k < 0) k = 0;
            temp[i]=kata.substring(k,j);
        j = k ;
        if (j == 0)
        break;
        }
 return temp;
 }
function ubahRatusanKeHuruf(nilai){ 
var batas = 2;
var maxBagian = 2;
var temp = this.ubahStringKeArray(batas, maxBagian, nilai);
var j = nilai.length;
var hasil="";
var banyakBagian = (j % batas) == 0 ? (j / batas) : Math.round(j / batas + 0.5);
    for(var i = 0; i < banyakBagian ;i++){
        if(temp[i].length > 1){
            if(temp[i].charAt(0) == '1'){
                if(temp[i].charAt(1) == '1') {
                    hasil += "sebelas";
                    }
                else if(temp[i].charAt(1) == '0') {
                    hasil += "sepuluh";
                    }
            else hasil += daftarAngka[temp[i].charAt(1) - '0']+ " belas ";
                }
            else if(temp[i].charAt(0) == '0'){
            hasil += daftarAngka[temp[i].charAt(1) - '0'] ;
            }
            else 
            hasil += daftarAngka[temp[i].charAt(0) - '0']+ " puluh " +daftarAngka[temp[i].charAt(1) - '0'] ;
            }
        else {
            if(i == 0 && banyakBagian !=1){
                if (temp[i].charAt(0) == '1') 
                    hasil+=" seratus ";
                else if (temp[i].charAt(0) == '0')
                    hasil+=" ";
                else hasil+= daftarAngka[parseInt(temp[i])]+" ratus ";
            }
            else hasil+= daftarAngka[parseInt(temp[i])];
            }
    }
return hasil;
}
function hapusNolDiDepan(nilai){
while(nilai.indexOf("0") == 0){
    nilai = nilai.substring(1, nilai.length);
    }
return nilai;
}