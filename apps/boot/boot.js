
function KickWd(){
    if(!BTN1.read())E.kickWatchdog();
}
var wdint=setInterval(KickWd,5000); // 5 secs
E.enableWatchdog(20, false); // 20 secs
E.kickWatchdog();
E.showMessage = function(msg,title) {}
var STOR = require("Storage");
if (STOR.read("main.js"))
    eval(STOR.read("main.js"));
V_TZ=STOR.readJSON(["setting.json"],1).timezone;
E.setTimeZone(V_TZ);
