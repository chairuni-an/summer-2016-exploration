var mongoose = require('mongoose');
var gajiSchema = new mongoose.Schema({
    tanggal: { type: Date, default: Date.now },
    gaji_harian: Number
});
mongoose.model('Gaji', gajiSchema);
var pegawaiSchema = new mongoose.Schema({
    nama: String,
    nip: Number,
    tanggallahir: { type: Date, default: Date.now },
    aktifkah: Boolean,
    gajis:[{
        gaji: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Gaji'
        }
    }]
});
mongoose.model('Pegawai', pegawaiSchema);
