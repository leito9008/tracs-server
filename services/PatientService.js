/*jshint bitwise: false, camelcase: true, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true*/

/* globals require, module, console */

require("../models/Patient");

var mongoose = require("mongoose"),
    logger = require("../utils/Logger"),
    Patient = mongoose.model("Patient"),
    ProfileService = require("./ProfileService");

var PatientService = {};


/**
 * Recupera un paciente por su DNI
 * @param   {number}  patientDni el DNI del paciente a recuperar
 * @returns {promise} una promesa con el paciente
 */
PatientService.findByDni = function (patientDni) {
    "use strict";

    return Patient.find({DNI: patientDni}).exec().then(function (patient) {
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
    return Patient.find({_id:patientId}).exec().then(function (patient) {
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
PatientService.updatePatientDetail = function (updatedPatient) {
    "use strict";
    console.log(updatedPatient);
    return Patient.update({_id:updatedPatient.id}, {$set:{

                              DNI:updatedPatient.DNI,
                              name:updatedPatient.name,
                              phoneNumber:updatedPatient.phoneNumber,
                              generalDescription:updatedPatient.generalDescription,
                              birthDate: updatedPatient.birthDate

                        }

                                                   }).exec().then(function (patient) {

    return patient;
    }, function (error) {
        logger.error("Ocurrió un error al editar los datos del paciente con ID " + updatedPatient.id, error);
        return error;
    });

};

//Borrador para carga masiva de datos. Me los guarda pero tira un error por el .exec(). Despues lo termino de analizar
PatientService.bulkInsert = function(){

    var patients = [{name:'potato1',
                   birthDate: '2012-01-01T03:00:00.000Z',
                   DNI: "34567753"},
                  {name:'potato2',
                   birthDate: '2012-01-01T03:00:00.000Z',
                   DNI: "34567753"}];

/*Patient.collection.insert(patients, onInsert);

function onInsert(err, docs) {
    if (err) {
        return error;
        // TODO: handle error
    } else {
        console.info('%d potatoes were successfully stored.', docs.length);
        return docs;
    }
}*/

    Patient.collection.insert(patients).exec().then(function (insertedPatients){
            return insertedPatients;
}, function(error) {
    logger.error("Ocurrió un error al editar los datos del paciente con ID");
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

    return newPatient.save().then(function (patient) {
        var newProfile = {
            isAdmin: true,
            patient: patient._id,
            user: adminUserId
        };

        ProfileService.add(newProfile).then(null, function (error) {
            logger.error("No se pudo guardar el profile para el paciente con id " + patient._id, error);
        });
    }, function (error) {
        logger.error("No se pudo guardar el paciente con id " + newPatient._id, error);
        return error;
    });
};


module.exports = PatientService;
