"use strict";

/*** Initialization ***/
/** inits **/
var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'), //mongo connection
    bodyParser = require('body-parser'), //parses information from POST
    methodOverride = require('method-override'), //used to manipulate POST
    // Include the async package
    // Make sure you add "async" to your package.json -- I haven't -.-
    async = require("async"),
    Pegawai = mongoose.model('Pegawai');

/** set **/
router.use(bodyParser.urlencoded({ extended: true }))
router.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
    }
}))

/*** Bases ***/
/** REST operation base **/
//build the REST operations at the base for pegawai
//this will be accessible from http://localhost:3000/pegawai if the default route for / is left unchanged
router.route('/')
    //GET all pegawai
    .get(function (req, res, next) {
        //retrieve all pegawai from Monogo
        Pegawai.find({}, function (err, pegawai) {
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
        var tanggal_hitung = new Date();
        //call the create function for our database
        Pegawai.create({
            nama : nama,
            nip : nip,
            tanggallahir : tanggallahir,
            aktifkah : aktifkah,
            gaji_total: {
                jumlah: 0,
                tanggal_hitung: tanggal_hitung
            }
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

/** GET New Pegawai page. **/
router.get('/new', function (req, res) {
    res.render('pegawai/new', { title: 'Tambah Pegawai Baru' });
});

/*** Middleware ***/
/** route middleware to validate :id **/
router.param('id', function (req, res, next, id) {
    //console.log('validating ' + id + ' exists');
    //find the ID in the Database
    Pegawai.findById(id, function (err, pegawaidata) {
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

/** route middleware to validate :date **/
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

/** route middleware to validate :nips **/
router.param('nips', function (req, res, next, nips) {
    console.log(nips + ' is param');
    var nips_array = nips.split(',');
    console.log('length: ' + nips_array.length);
    req.nips = [];
    //TODO check why 13513010 can be found, I think it is because it is not error, just empty
    async.each(nips_array, function (nip, next) {
        Pegawai.findOne({nip: nip, aktifkah: true}, function (err, pegawai) {
            //if it isn't found, we are going to respond with 404
            if (err) {
                return next (err);
            } else {
                console.log(nip + ' was found');
                // once validation is done save the new item in the req
                if (pegawai !== null){
                    req.nips.push(nip);
                }
                next(null, pegawai);
            }
        });
    }, function (err) {
        if (err) {
            console.log(nip + ' was not found');
            res.status(404);
            var err = new Error('error baru: NIP Not Found');
            err.status = 404;
            res.format({
                html: function() {
                    next(err);
                 },
                json: function() {
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        }
        else {
            console.log("finished finding all nips");
            next();
            console.log("next");
        }
    });
});

/*** Process ***/
/** get /:id page **/
router.route('/:id')
    .get(function (req, res) {
        Pegawai.findById(req.id, function (err, pegawaidata) {
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

/** GET the individual pegawai by Mongo ID **/
router.get('/:id/edit', function (req, res) {
    //search for the pegawai within Mongo
    Pegawai.findById(req.id, function (err, pegawaidata) {
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

/** PUT to update a pegawai by ID **/
router.put('/:id/edit', function (req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var nama = req.body.nama;
    var nip = req.body.nip;
    var tanggallahir = req.body.tanggallahir;
    var aktifkah = req.body.aktifkah;
    //find the document by ID
    Pegawai.findById(req.id, function (err, pegawaidata) {
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

/** GET the individual pegawai by Mongo ID **/
router.get('/:id/addgaji', function (req, res) {
    //search for the pegawai within Mongo
    Pegawai.findById(req.id, function (err, pegawaidata) {
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

/** PUT to update a pegawai by ID, add gaji **/
router.post('/:id/addgaji', function (req, res) {
    // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
    var tanggal = req.body.tanggal;
    var gaji_harian = req.body.gaji_harian;
    //call the create function for our database
    Pegawai.findById(req.id, function (err, pegawai) {
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

/** DELETE a Pegawai by ID **/
router.delete('/:id/edit', function (req, res) {
    //find pegawai by ID
    Pegawai.findById(req.id, function (err, pegawaidata) {
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

/** API to count gaji, can be accessed via http://localhost:3000/pegawai/gaji/yyyy-mm-dd **/
router.get('/gaji/:date', function (req, res) {
    Pegawai.find({}, function (err, pegawais) {
        if (err) {
            console.log(err);
            process.exit(-1);
        } else{
            var gajipegawai = [];

            async.each(pegawais, function (pegawai, next) {
                    var gaji_total = 0;

                    pegawai.gajis.forEach(function (gaji) {
                        var requested_date = new Date(req.date);
                        if (gaji.tanggal.getTime() <= requested_date.getTime()) {
                            // include into the counting
                            gaji_total += gaji.gaji_harian;
                        }
                    });

                    var today = new Date();
                    pegawai.gaji_total = {
                        jumlah : gaji_total,
                        tanggal_hitung : today
                    };

                    pegawai.save(function (err, updatedPegawai) {
                        if (err) {
                            return next(err);
                        }

                        gajipegawai.push(updatedPegawai);
                        next(null, updatedPegawai);
                    });
              },
              // 3rd param is the function to call when everything's done
              function (err) {
                  if (err) {
                      console.log(err);
                      process.exit(-1);
                  }

                // All tasks are done now
                res.send(gajipegawai);
              }
            );
        }
    })
});

/** API to count gaji for specific pegawais, can be accessed via http://localhost:3000/pegawai/gaji/yyyy-mm-dd/nip1,nip2,nip3 **/
router.get('/gaji/:date/:nips', function (req, res) {
    console.log('in get nips');
    var gajipegawai = [];
    async.each(req.nips, function (nip, next) {
        Pegawai.findOne({nip: nip}, function (err, pegawai) {
            if (err) {
                console.log(err);
                process.exit(-1);
            }
            var gaji_total = 0;
            pegawai.gajis.forEach(function (gaji) {
                var requested_date = new Date(req.date);
                if (gaji.tanggal.getTime() <= requested_date.getTime()) {
                    // include into the counting
                    gaji_total += gaji.gaji_harian;
                }
            })
            var today = new Date();
            pegawai.gaji_total = {
                jumlah : gaji_total,
                tanggal_hitung : today
            };
            pegawai.save(function (err, updatedPegawai) {
                if (err) {
                    console.log(err);
                    process.exit(-1);
                }
                gajipegawai.push(updatedPegawai);
                next(null, updatedPegawai);
            });
        })
        },
        function (err) {
            if (err) {
                console.log(err);
                process.exit(-1);
            }

          res.send(gajipegawai);
        }

    )
    Pegawai.findOneAndUpdate({nip: req.nip}, function (err, pegawai) {
        if (err) {
            console.log(err);
            process.exit(-1);
        } else{
            var gaji_total = 0;
            pegawai.gajis.forEach(function (gaji) {
                var requested_date = new Date(req.date);
                if (gaji.tanggal.getTime() <= requested_date.getTime()) {
                    // include into the counting
                    gaji_total += gaji.gaji_harian;
                }
            })
            var today = new Date();
            pegawai.gaji_total = {
                jumlah : gaji_total,
                tanggal_hitung : today
            };
            console.log("here");
            pegawai.save(function (err, updatedPegawai) {
                if (err) {
                    console.log(err);
                    process.exit(-1);
                }
                console.log("there");
                res.send(updatedPegawai);
            });
        }
    })
});

/*** export ***/
module.exports = router;
