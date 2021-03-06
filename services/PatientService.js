/*jshint bitwise: false, camelcase: true, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true*/

/* globals require, module, console */

require("../models/Patient");
require("../models/Diagnosis");

var mongoose = require("mongoose"),
    request = require("request"),
    logger = require("../utils/Logger"),
    Patient = mongoose.model("Patient"),
    Diagnosis = mongoose.model("Diagnosis"),
    ProfileService = require("./ProfileService"),
    NotificationsService = require("./NotificationsService");

var PatientService = {};

/**
 * Recupera un paciente por su DNI
 * @param   {number}  patientDni el DNI del paciente a recuperar
 * @returns {promise} una promesa con el paciente
 */
PatientService.findByDni = function (patientDni) {
    "use strict";

    return Patient.find({
        DNI: patientDni
    }).exec().then(function (patient) {
        return patient[0];
    }, function (error) {
        logger.error("Ocurrió un error al buscar el paciente con DNI " + patientDni, error);
        return error;
    });
};

/**
 * Recupera toda la información de un paciente
 * @param   {number}  patientId el id del paciente
 * @returns {promise} una promesa con el total de datos de un paciente
 */
PatientService.getPatientDetail = function (patientId) {
    "use strict";
    return Patient.find({
        _id: patientId
    }).exec().then(function (patient) {
        return patient[0];
    }, function (error) {
        logger.error("Ocurrió un error al buscar los datos del paciente con ID " + patientId, error);
        return error;
    });

};

/**
 * Edita la información básica de un paciente
 * @param   {object}  updatedPatient el paciente con los datos actualizados
 * @returns {promise} una promesa con el paciente actualizado
 */
PatientService.updatePatientGeneralInfo = function (patientId, updatedPatient) {
    "use strict";

    return Patient.findOne({
        _id: patientId
    }).then(function (patient) {

        patient.DNI = updatedPatient.DNI;
        patient.name = updatedPatient.name;
        patient.phoneNumber= updatedPatient.phoneNumber;
        patient.generalDescription = updatedPatient.generalDescription;
        patient.birthDate = updatedPatient.birthDate;

        NotificationsService.createNotificationForPatientId(patientId, "Se actualizaron datos del perfil", "patient.detail.updated");

        return patient.save();

    }, function (error) {
        logger.error("Ocurrió un error al editar los datos del paciente con ID " + patientId, error);
        return error;
    });
};

PatientService.updatePatientContactInfo = function(patientId, updatedContactInfo){
    "use strict";

    return Patient.findOneAndUpdate({
        _id: patientId
    }, {
        $set: {
            contactInfo: updatedContactInfo
        }
    }, {
        new: true
    }).exec().then(function (patient) {
        return NotificationsService.createNotificationForPatient(patient, "Se actualizaron datos del perfil", "patient.detail.updated");
    }, function (error) {
        logger.error("Ocurrió un error al editar la informacion de contacto del paciente " + patientId, error);
        return error;
    });

};

PatientService.updatePatientHistory = function(patientId, updatedPatientHistory){
    "use strict";

    return Patient.findOneAndUpdate({
        _id: patientId
    }, {
        $set: {
            history: updatedPatientHistory
        }
    }, {
        new: true
    }).exec().then(function (patient) {
        return patient;
    }, function (error) {
        logger.error("Ocurrió un error al editar la informacion de la historia del paciente " + patientId, error);
        return error;
    });

};

/**
 * Agrega un paciente nuevo y le asocia un perfil administrador
 * @param   {object}  reqPatient  el paciente con los datos básicos
 * @param   {number}  adminUserId el id del usuario administrador del nuevo paciente
 * @returns {promise} una promesa con el paciente creado
 */
PatientService.add = function (reqPatient, adminUserId) {
    "use strict";

    // Setea valores por defecto a los parámetros que no son obligatorios
    reqPatient.generalDescription = reqPatient.generalDescription || "";
    reqPatient.phoneNumber = reqPatient.phoneNumber || "";
    reqPatient.picture = reqPatient.picture || "https://en.opensuse.org/images/0/0b/Icon-user.png";

    // Crea un modelo a partir del objeto del request
    var newPatient = new Patient(reqPatient);

    var newProfile = {
        isParent: false,
        isAdmin: true,
        patient: newPatient._id,
        user: adminUserId,
        description: "Administrador"
    };
    return ProfileService.add(newProfile).then(function (profile) {

        newPatient.profiles.push(profile._id);
        return newPatient.save().then(function (patient) {
            return patient;
        }, function (error) {
            logger.error("No se pudo guardar el paciente con id " + newPatient._id, error);
            return error;
        });

    }, function (error) {
        logger.error("No se pudo guardar el profile para el paciente con id " + newPatient._id, error);
        return error;
    });
};

/**
 * Agrega un perfil a un paciente ya creado
 * @param   {object}  newProfile  el perfil que se le va a asignar al paciente dentro de newProfile.patient
 * @returns {promise} una promesa con el paciente modificado
 */
PatientService.addProfileToPatient = function (newProfile) {
    "use strict";

    return ProfileService.add(newProfile).then(function (profile) {

        return Patient.findOne({
            _id: profile.patient
        }).then(function (patient) {

            patient.profiles.push(profile._id);

            return NotificationsService.createNotificationForPatient(patient, "Hay un nuevo participante", "patient.profile.added");
        }, function (error) {
            logger.error("No se pudo obtener el paciente con id " + newProfile.patient, error);
            return error;
        });

    }, function (error) {
        logger.error("No se pudo guardar el profile " + newProfile, error);
        return error;
    });

};

/**
 * Modifica las personas cercanas de un paciente determinado
 * @param   {number}  patientId el ID del paciente a modificar
 * @param   {array}   updatedClosestContact los contactos que van a pasar a ser personas cercanas
 * @returns {promise} una promesa con el paciente modificado
 */
PatientService.updateClosestPeople = function (patientId, updatedClosestContacts) {
    "use strict";

    return Patient.findOneAndUpdate({
        _id: patientId
    }, {
        $set: {
            closestPeople: updatedClosestContacts
        }
    }, {
        new: true
    }).exec().then(function (patient) {
        return NotificationsService.createNotificationForPatient(patient, "Se actualizaron los contactos", "patient.contacts.updated");
    }, function (error) {
        logger.error("Ocurrió un error al editar las personas cercanas del paciente " + patientId, error);
        return error;
    });
};

/**
 * Recupera todas las notificaciones de un paciente
 * @param   {number}  patientId el id del paciente
 * @returns {promise} una promesa con el arreglo de notificaciones
 */
PatientService.getNotifications = function (patientId) {
    "use strict";

    return Patient.findOne({
        _id: patientId
    }).then(function (patient) {
        return patient.notifications;
    }, function (error) {
        logger.error("No se pudieron obtener las notificaciones para el paciente con id " + patientId, error);
        return error;
    });
};

/**
 * Crea una notificación para un paciente dado
 * @param   {number}  patientId    el id del paciente
 * @param   {object}  notification la notificacion
 * @returns {promise} una promesa con el paciente actualizado
 */
PatientService.addNotification = function (patientId, notification) {
    "use strict";

    return Patient.findOne({
        _id: patientId
    }).then(function (patient) {
        // Add the notification
        patient.notifications.push(notification);
        return patient.save();
    }, function (error) {
        logger.error("No se pudo recuperar el paciente con id " + patientId, error);
        return error;
    });
};

PatientService.deleteProfile = function (patientId,profileId){
    "use strict";
    return Patient.update({_id: patientId},{ $pullAll: {profiles: [profileId] } }).exec();
};

/**
 * Agrega una alerta georeferenciada hecha por el paciente
 * @param   {number} patientId Id del paciente que emite la alerta
 * @param   {object}    geoAlert  Objeto con los parametros de geolocalizacion de la alerta
 * @returns {promise} una promesa con el paciente actualizado
 */

PatientService.addGeoAlert = function (patientId, geoAlert) {
    "use strict";

    return Patient.findOne({
        _id: patientId
    }).populate({
        path: "profiles",
        model: "Profile",
        populate: {
            path: "user",
            model: "User"
        }
    }).exec().then(function (patient) {
        var pushData = {
            tokens: [],
            payload: {
                "patient": {
                    _id: patient._id,
                    name: patient.name,
                    picture: patient.picture,
                    phoneNumber: patient.phoneNumber
                },
                "coordinates": {
                    latitude: geoAlert.coords.latitude,
                    longitude: geoAlert.coords.longitude
                }
            }
        };
        // Recupera los tokens push de casa usuario participante
        // para mandarle una notificacion
        pushData.tokens = patient.profiles.map(function(profile) {
            return profile.user.pushToken;
        });

        var options = {
            url: "https://api.ionic.io/push/notifications",
            method: "POST",
            json: true,
            headers: {
                // Ionic API KEY
                "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIyNjA4MDA2My02ZDllLTQyYmItOWUwZS0yZDgyZWVhNTlkNTgifQ.86oRYuBnyk2UXsX1SMGKeOBlJjOzhlFvP0uYRJmgwM8"
            },
            body: {
                "tokens": pushData.tokens,
                "profile": "tracs_push",
                "notification": {
                    "title": "Alerta de paciente",
                    "message": patient.name + " necesita ayuda!!",
                    "android": {
                        "message": patient.name + " necesita ayuda!!",
                        "payload": pushData.payload
                    }
                }
            }
        };

        logger.info("Enviando push a los dispositivos", pushData.tokens);
        request(options);

        patient.geoAlert.push(geoAlert);
        return NotificationsService.createNotificationForPatient(patient, "Hay una nueva alerta del paciente", "patient.geoAlert.added", {
            latitude: geoAlert.coords.latitude,
            longitude: geoAlert.coords.longitude
        });
    }, function (error) {
        logger.error("No se pudo recuperar el paciente con id " + patientId, error);
        return error;
    });

};

/**
 * Agrega un nuevo diagnostico al paciente. Esta entrada pasar a figurar como latestDiagnosis
 * @param   {object} reqDiagnosis informacion del diagnostico a agregar
 * @returns {promise} una promesa con el ultimo diagnostico agregado
 */
PatientService.addPatientDiagnosis = function(reqDiagnosis){
    "use strict";

    var newDiagnosis = new Diagnosis(reqDiagnosis);

    return newDiagnosis.save().then(function(diagnosis){

        NotificationsService.createNotificationForPatientId(diagnosis.patient, "Se ha modificado el diagnóstico del paciente", "patient.diagnosis.updated");

        return Patient.findOne({_id: diagnosis.patient}).then(function(patient){

            patient.latestDiagnosis = diagnosis._id;
            return patient.save();

            //NotificationsService.createNotificationForPatientId(diagnosis.patient, "Se ha modificado el diagnóstico del paciente", "patient.diagnosis.updated");

        },function (error) {
            logger.error("No se pudo recuperar el paciente con id " + diagnosis.patient, error);
            return error;
        });
    },function (error) {
        logger.error("No se pudo guardar el diagnostico ", error);
        return error;
    });
};


// Borrador para carga masiva de datos
PatientService.bulkInsert = function () {
    "use strict";

    function onInsert(err, docs) {
        if (err) {
            console.log("Exploto todo");
            // TODO: handle error
        } else {
            console.info("%d potatoes were successfully stored.", docs.length);
            return docs;
        }
    }

    var patients = [{
            name: "potato1",
            birthDate: "2012-01-01T03:00:00.000Z",
            DNI: "34567753"
        },
        {
            name: "potato2",
            birthDate: "2012-01-01T03:00:00.000Z",
            DNI: "34567753"
        }];

    Patient.collection.insert(patients, onInsert);

    /*  Patient.collection.insert(patients).exec().then(function (insertedPatients){
              return insertedPatients;
      }, function(error) {
      logger.error("Ocurrió un error al editar los datos del paciente con ID");
          return error;
      });*/
};

module.exports = PatientService;
