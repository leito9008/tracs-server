/*jshint bitwise: false, camelcase: true, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true*/

/* globals require, module */

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TreatmentSchema = new Schema({
    
    description: { type: String, required: true },
    sessions: {type : Schema.Types.ObjectId, ref : 'Session'},
    patient: {type : Schema.Types.ObjectId, ref : 'Patient'}
});

/*TreatmentSchema.prototype.getTreatments = function(){
    TreatmentSchema.find().populate('profile' 'patient').exec()
};*/


module.exports = mongoose.model("Treatment", TreatmentSchema);
