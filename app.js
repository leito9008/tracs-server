/* jshint bitwise: false, curly: true, eqeqeq: true, globals: false, freeze: true, immed: true, nocomma: true, newcap: true, noempty: true, nonbsp: true, nonew: true, quotmark: double, undef: true, unused: true, strict: true, latedef: true */

/* globals console, require, module, __dirname */

var // Config modules
    Database = require("./config/Database"),
    Application = require("./config/Application"),

    // Routes modules
    CommonRouter = require("./routers/CommonRouter"),
    SessionRouter = require("./routers/SessionRouter"),
    UserRouter = require("./routers/UserRouter"),
    TreatmentRouter = require ("./routers/TreatmentRouter"),
    PatientRouter = require("./routers/PatientRouter"),
    ProfileRouter = require("./routers/ProfileRouter"),
    ImAPatientRouter = require("./routers/ImAPatientRouter"),

    // Sockets modules
    ChatSocket = require("./sockets/ChatSocket"),

    // Environment configs
    config = require("./utils/Config");

// ===== DATABASE CONNECTION
var db = new Database({ connectionUrl : config.database_url });
db.connect();

// ===== APP SETUP
var app = new Application({path: __dirname, folder: "public"}, [
    {route: "/", handler: CommonRouter},
    {route: "/session", handler: SessionRouter},
    {route: "/user", handler: UserRouter},
    {route: "/treatment", handler: TreatmentRouter},
    {route: "/patient", handler: PatientRouter},
    {route: "/profile", handler: ProfileRouter},
    {route: "/imAPatient", handler: ImAPatientRouter},
]);

// ===== SOCKETS SETUP
var io = require("socket.io")(4000),
    chatSocket = new ChatSocket(io);

module.exports = app;
