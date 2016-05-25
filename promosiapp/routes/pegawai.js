"use strict";

/* part 1*/
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'); //used to manipulate POST

/* part 2 */
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

/* part 3 */
//build the REST operations at the base for pegawai
//this will be accessible from http://localhost:3000/pegawai if the default route for / is left unchanged
router.route('/')
    //GET all blobs
    .get(function (req, res, next) {
        //retrieve all pegawai from Monogo
        mongoose.model('Pegawai').find({}, function (err, pegawai) {
            if (err) {
                return console.error(err);
            } else {
                //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                res.format({
                    //HTML response will render the index.jade file in the views/blobs folder. We are also setting "pegawai" to be an accessible variable in our jade view
                    html: function() {
                        res.render('pegawai/index', {
                            title: 'Daftar Pegawai',
                            "pegawai" : pegawai
                        });
                    },
                    //JSON response will show all pegawais in JSON format
                    json: function() {
                        res.json(infophotos);
                    }
                });
            }
        });
    })
    //POST a new pegawai
    .post(function (req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var nama = req.body.nama;
        var nip = req.body.nip;
        var tanggallahir = req.body.tanggallahir;
        var aktifkah = req.body.aktifkah;
        //call the create function for our database
        mongoose.model('Pegawai').create({
            nama : nama,
            nip : nip,
            tanggallahir : tanggallahir,
            aktifkah : aktifkah
        }, function (err, pegawaidata) {
            if (err) {
                res.send("There was a problem adding the information to the database.");
            } else {
                //Pegawai has been created
                console.log('POST creating new pegawaidata: ' + pegawaidata);
                res.format({
                    //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function() {
                        // If it worked, set the header so the address bar doesn't still say /addpegawai
                        res.location("pegawai");
                        // And forward to success page
                        res.redirect("/pegawai");
                    },
                    //JSON response will show the newly created pegawai
                    json: function() {
                        res.json(pegawaidata);
                    }
                });
            }
        })
    });

/* part 4 */
/* GET New Pegawai page. */
router.get('/new', function (req, res) {
    res.render('pegawai/new', { title: 'Tambah Pegawai Baru' });
});

/* part 5 */
// route middleware to validate :id
router.param('id', function (req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Pegawai').findById(id, function (err, pegawaidata) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function() {
                    next(err);
                 },
                json: function() {
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(pegawaidata);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next();
        }
    });
});

/* part 5 */
// route middleware to validate :date
router.param('date', function (req, res, next, date) {
    var len = date.length;
    if (len != 10) {
        console.log(date + ' is invalid');
        res.status(400)
        var err = new Error('Bad Request');
        err.status = 400;
        res.format({
            html: function() {
                next(err);
            },
            json: function() {
                res.json({message : err.status  + ' ' + err});
            }
        });
    } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(pegawaidata);
            // once validation is done save the new item in the req
        req.date = date;
            // go to the next thing
        next();
    }
});

/* part 6 */
router.route('/:id')
    .get(function (req, res) {
        mongoose.model('Pegawai').findById(req.id, function (err, pegawaidata) {
            if (err) {
                console.log('GET Error: There was a problem retrieving: ' + err);
            } else {
                console.log('GET Retrieving ID: ' + pegawaidata._id);
                var pegawaitanggallahir = pegawaidata.tanggallahir.toISOString();
                pegawaitanggallahir = pegawaitanggallahir.substring(0, pegawaitanggallahir.indexOf('T'))
                res.format({
                    html: function() {
                        res.render('pegawai/show', {
                            "pegawaitanggallahir" : pegawaitanggallahir,
                            "pegawaidata" : pegawaidata
                        });
                    },
                    json: function() {
                        res.json(pegawaidata);
                    }
                });
            }
        });
    });

/* part 7 */
//GET the individual pegawai by Mongo ID
router.get('/:id/edit', function (req, res) {
    //search for the pegawai within Mongo
    mongoose.model('Pegawai').findById(req.id, function (err, pegawaidata) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the pegawai
            console.log('GET Retrieving ID: ' + pegawaidata._id);
            //format the date properly for the value to show correctly in our edit form
            var pegawaitanggallahir = pegawaidata.tanggallahir.toISOString();
            pegawaitanggallahir = pegawaitanggallahir.substring(0, pegawaitanggallahir.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function() {
                    res.render('pegawai/edit', {
                        title: 'Pegawai ' + pegawaidata._id,
                        "pegawaitanggallahir" : pegawaitanggallahir,
                        "pegawaidata" : pegawaidata
                    });
                },
                 //JSON response will return the JSON output
                json: function() {
                    res.json(pegawaidata);
                }
            });
        }
    });
});

/* part 8 */
//PUT to update a pegawai by ID
router.put('/:id/edit', function (req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var nama = req.body.nama;
    var nip = req.body.nip;
    var tanggallahir = req.body.tanggallahir;
    var aktifkah = req.body.aktifkah;
    //find the document by ID
    mongoose.model('Pegawai').findById(req.id, function (err, pegawaidata) {
        //update it
        pegawaidata.update({
            nama : nama,
            nip : nip,
            tanggallahir : tanggallahir,
            aktifkah : aktifkah
        }, function (err, pegawaidataID) {
            if (err) {
                res.send("There was a problem updating the information to the database: " + err);
            }
            else {
                //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                res.format({
                    html: function() {
                        res.redirect("/pegawai/" + pegawaidata._id);
                    },
                    //JSON responds showing the updated values
                    json: function() {
                        res.json(pegawaidata);
                    }
                });
            }
        })
    });
});

/* part 7 */
//GET the individual pegawai by Mongo ID
router.get('/:id/addgaji', function (req, res) {
    //search for the pegawai within Mongo
    mongoose.model('Pegawai').findById(req.id, function (err, pegawaidata) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the pegawai
            console.log('GET Retrieving ID: ' + pegawaidata._id);
            //format the date properly for the value to show correctly in our edit form
            //var pegawaitanggallahir = pegawaidata.tanggallahir.toISOString();
            //pegawaitanggallahir = pegawaitanggallahir.substring(0, pegawaitanggallahir.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function() {
                    res.render('pegawai/newgaji', {
                        title: 'Pegawai ' + pegawaidata._id,
                        "pegawaidata" : pegawaidata
                    });
                },
                //JSON response will return the JSON output
                json: function() {
                    res.json(pegawaidata);
                }
            });
        }
    });
});

/* part 9 */
//PUT to update a pegawai by ID, add gaji
router.post('/:id/addgaji', function (req, res) {
    // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    var tanggal = req.body.tanggal;
    var gaji_harian = req.body.gaji_harian;
    //call the create function for our database
    mongoose.model('Pegawai').findById(req.id, function (err, pegawai) {
        pegawai.update({
            $push: {
                'gajis': {
                    tanggal: tanggal,
                    gaji_harian: gaji_harian
                }
            }
        }, function (err, pegawaiID) {});
    });
    res.format({
        //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
        html: function() {
            // If it worked, set the header so the address bar doesn't still say /adduser
            res.location("pegawai");
            // And forward to success page
            res.redirect("/pegawai");
        },
        //JSON response will show the newly created gaji
        json: function() {
            res.json(gaji);
        }
    });
});

/* part 10 */
//DELETE a Pegawai by ID
router.delete('/:id/edit', function (req, res) {
    //find pegawai by ID
    mongoose.model('Pegawai').findById(req.id, function (err, pegawaidata) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            pegawaidata.remove(function (err, pegawaidata) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + pegawaidata._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function() {
                               res.redirect("/pegawai");
                         },
                         //JSON returns the item with the message that is has been deleted
                        json: function() {
                               res.json({message : 'deleted',
                                   item : pegawaidata
                               });
                        }
                    });
                }
            });
        }
    });
});

/* part 4 */
/* API to count gaji, can be accessed via http://localhost:3000/pegawai/gaji/yyyy-mm-dd */
router.get('/gaji/:date', function (req, res) {
    var year = req.date.substring(0, 4);
    var month = req.date.substring(5, 7);
    var day = req.date.substring(8, 10);
    mongoose.model('Pegawai').find({}, function (err, pegawais) {
        if (err) {
            return console.error(err);
        } else{
            var gajipegawai = [];
            pegawais.forEach(function (pegawai) {
                var gaji_total = 0;
                pegawai.gajis.forEach(function (gaji) {
                    var requested_date = new Date(year, month, day, 0, 0, 0, 0);
                    var gaji_date = new Date(gaji.tanggal);
                    if (gaji_date.getTime() <= requested_date.getTime()) {
                        // include into the counting
                        gaji_total += gaji.gaji_harian;
                    }
                })
                gajipegawai.push({
                    nama : pegawai.nama,
                    nip : pegawai.nip,
                    gaji_total: gaji_total
                });
            });
            res.send(gajipegawai);
        }
    })
});

/* part 11 */
module.exports = router;
