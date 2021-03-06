/*jshint bitwise: false, camelcase: true, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true*/

/* globals require, module */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ProfileSchema = new Schema({
    
    description: String,
    isAdmin: { type: Boolean, required: true },
    isParent: {type: Boolean, required: true},
    patientNotes: [{type : Schema.Types.ObjectId, ref : "PatientNote"}],
    //notifications:[{type : Schema.Types.ObjectId, ref : "Notification"}],
    reports: [{type : Schema.Types.ObjectId, ref : "Report"}],
    accessRoles: [{type : Schema.Types.ObjectId, ref: "AccessRole"}],
    patient:{type : Schema.Types.ObjectId, ref : "Patient", required: true},
    user:{type : Schema.Types.ObjectId, ref : "User", required: true},
    latestPatientOpinion:{type : Schema.Types.ObjectId, ref : "PatientOpinion"}
    //chats:
});

module.exports = mongoose.model("Profile", ProfileSchema);
