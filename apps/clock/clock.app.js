var FACES = [];
var iface = 0;
var STOR = require("Storage");
STOR.list(/\.face\.js$/).forEach(face=>FACES.push(eval(require("Storage").read(face))));
var face = FACES[iface]();
var intervalRefSec;
var tickTimeout;
var ticks = 90;


function stopdraw() {
  if(intervalRefSec) {intervalRefSec=clearInterval(intervalRefSec);}
  if(tickTimeout) {tickTimeout=clearTimeout(tickTimeout);}
  g.clear();
}

function queueMinuteTick() {
  if (tickTimeout) clearTimeout(tickTimeout);
  tickTimeout = setTimeout(function() {
    tickTimeout = undefined;
    face.tick();
    queueMinuteTick();
  }, 60000 - (Date.now() % 60000));
}

function startdraw() {
  g.reset();
  face.init();
  if (face.tickpersec)
    intervalRefSec = setInterval(face.tick,1000);
  else 
    queueMinuteTick();
  DK08.drawWidgets();
}

global.SCREENACCESS = {
  withApp:true,
  request:function(){
    this.withApp=false;
    stopdraw();
  },
  release:function(){
    this.withApp=true;
    startdraw(); 
  }
}; 

function setControl(){
  function newFace(inc){
    var n = FACES.length-1;
    iface+=inc;
    iface = iface>n?0:iface<0?n:iface;
    stopdraw();
    face = FACES[iface]();
    startdraw();
  }
  DK08.on('dbltouch',(dir)=>{
    if (SCREENACCESS.withApp)newFace(1);
  });
}


DK08.loadWidgets();
g.clear();
startdraw();
setControl();


