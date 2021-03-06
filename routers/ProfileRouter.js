/*jshint bitwise: false, camelcase: true, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true*/

/* globals require, module */

var express = require("express"),
    router = express.Router(),
    ProfileController = require("../controllers/ProfileController");

router.get("/userProfiles", ProfileController.findUserProfiles);
router.delete("/:idUser/:idPatient", ProfileController.removeProfile);
router.get("/:idPatient/:idUser", ProfileController.getProfile);
module.exports = router;
