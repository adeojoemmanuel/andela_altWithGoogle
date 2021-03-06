var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, { native_parser: true });
var dotenv = require('dotenv');
var fs = require('fs');
var cloudinary = require('cloudinary').v2;
dotenv.load();


db.bind('altwithgoogle');

var service = {};

service.authenticate = authenticate;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
service.getall = getall;

module.exports = service;

// function getall(){
//     db.altwithgoogle.find({}, function(err, docs) {
//         if (err)  deferred.reject(err);
//         deferred.resolve(docs);
//         console.log(docs);
//     })
// }

function getall() {
    var deferred = Q.defer();
    db.altwithgoogle.find({}, function(err, user) {
        if (err) deferred.reject('unable to get datas');
        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            deferred.resolve();
        }
    });
    return deferred.promise;
}

// function getall(){
//     db.altwithgoogle.find({}).toArray(function(err, result) {
//         if (err)  deferred.reject(err);
//         deferred.resolve(result);
//         db.close();
//     });
// }

function authenticate(username, password) {
    var deferred = Q.defer();

    db.altwithgoogle.findOne({ username: username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve(jwt.sign({ sub: user._id }, config.secret));
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.altwithgoogle.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    // validation
    db.altwithgoogle.findOne({ username: userParam.username }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);
        if (user) {
            // username already exists
            deferred.reject('Username "' + userParam.username + '" is already taken');
        } else {
            createUser();
        }
    });

    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');
        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);
        db.altwithgoogle.insert(user, function (err, doc) {
            if (err) deferred.reject(err.name + ': ' + err.message);
            deferred.resolve();
        });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    // validation
    db.altwithgoogle.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.altwithgoogle.findOne(
                { username: userParam.username },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        // fields to update
        var set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
        };

        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.altwithgoogle.update(
            { _id: mongo.helper.toObjectID(_id) },
            { $set: set },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.altwithgoogle.remove(
        { _id: mongo.helper.toObjectID(_id) },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}

function fileUpload(imageName){
    cloudinary.config({
      cloud_name: 'fstack',
      api_key: '479317169528856',
      api_secret: '2ul4normShXpUBcXfcd0SXbVeEs'
    });

    var uploads = {};
    
    cloudinary.uploader.upload(imageName,{tags:'basic_sample'},function(err,image){
      console.log();
      console.log("** File Upload");
      if (err){ console.warn(err);}
      console.log("* public_id for the uploaded image is generated by Cloudinary's service.");
      console.log("* "+image.public_id);
      console.log("* "+image.url);
      waitForAllUploads("pizza",err,image);
    });
}