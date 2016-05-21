var mongoose = require('mongoose');
var pegawaiSchema = new mongoose.Schema({
  nama: String,
  nip: Number,
  tanggallahir: { type: Date, default: Date.now },
  aktifkah: Boolean
});
mongoose.model('Pegawai', pegawaiSchema);
