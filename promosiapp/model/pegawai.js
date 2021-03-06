var mongoose = require('mongoose');
var pegawaiSchema = new mongoose.Schema({
    nama: String,
    nip: Number,
    tanggallahir: { type: Date, default: Date.now },
    aktifkah: Boolean,
    gaji_total: {
        jumlah: Number,
        tanggal_hitung: Date
    },
    gajis:[{
        tanggal: { type: Date, default: Date.now },
        gaji_harian: Number
    }]
});
mongoose.model('Pegawai', pegawaiSchema);
