

var g;

const DK08 = {
    ON_TIME:5000,
    RUNNING:false,
    touchTO:null,
    bltTO:null,
    buzz: (v)=> {
      v = v? v:100;
      D6.set();
      return Promise(resolve=>{
        setTimeout(()=>{
          D6.reset();
          resolve(true);
        },v);
      });
    },
    batV: () => {
        pinMode(D5,"analog",true);
        var v = 4.20/0.29*analogRead(D5);
        pinMode(D5,"input",true); //power saving?
        return v;
    },
    isPower:()=>{return D24.read();},
    setLCDTimeout:(v)=>{DK08.ON_TIME=v<5?5:v;},
    backlight:()=>{
        g.backlight(true);
        if (DK08.bltTO) clearTimeout(DK08.bltTO);
        DK08.bltTO = setTimeout(function(){ 
          g.backlight(false);
          DK08.bltTO=null;
        },DK08.ON_TIME);
    }
};

setWatch(()=>{
  DK08.emit("power",D24.read());
},D24,{repeat:true,debounce:500});

if (STOR.read("st7301.js")) {
  eval(STOR.read("st7301.js"));
  g =  ST7301();
  DK08.on("touch", DK08.backlight);
  DK08.backlight();
}

if (STOR.read("widgets.js")) {
  eval(STOR.read("widgets.js"));
}

if (STOR.read("accel.js")) {
  eval(STOR.read("accel.js"));
  var ACCEL=BMA223();
  ACCEL.init();
}

setWatch(function(e){
    if (e.state){
         DK08.emit("touch",e.time);
         DK08.touchTO=setTimeout(()=>{DK08.emit("longtouch",e.time);DK08.touchTO=null;},2000);
         if ((e.time-e.lastTime)<0.5) DK08.emit("dbltouch",e.time);
    }
    if (!e.state && DK08.touchTO) {
      clearTimeout(DK08.touchTO);
       DK08.touchTO=null;
       DK08.emit("endtouch",e.time);
    } 
},BTN1,{ repeat:true, debounce:false, edge:'both' });

E.showMessage = function(msg,title) {
    g.clear(1); // clear screen
    g.setFont("Vector",18).setFontAlign(0,0);
    var W = g.getWidth();
    var H = g.getHeight()-26;
    if (title) {
      g.drawString(title,W/2,18);
      var w = (g.stringWidth(title)+12)/2;
      g.fillRect((W/2)-w,26,(W/2)+w,26);
    }
    var lines = g.wrapString(msg,W-2);
    var offset = 26+(H - lines.length*18)/2 ;
    lines.forEach((line,y)=>g.drawString(line,W/2,offset+y*18));
    g.flip();
};

E.showAlert = function(msg,title) {
  if (DK08.alert) {DK08.removeListener("dbltouch",DK08.alert); DK08.alert=undefined;}
  if (!msg) return Promise.resolve();  
  E.showMessage(msg,title); 
  var RES = null;
  DK08.alert = function(){
        DK08.removeListener("dbltouch",DK08.alert); 
        DK08.alert=undefined;
        return RES(true);
       };    
  return new Promise(resolve=>{
    RES = resolve;
    DK08.on("dbltouch",DK08.alert);
  });
};

var appmenu = {
  "Clock" : function(){if(STOR.read("clock.app.js")) eval(STOR.read("clock.app.js"))}, 
  "Heart" : function(){if(STOR.read("heart.app.js")) eval(STOR.read("heart.app.js"))}, 
  "SetTime":function(){if(STOR.read("bletime.js")) eval(STOR.read("bletime.js"))}, 
  "Reboot" : function() { E.reboot();}
  };
  
if (STOR.read("launcher.js")) {
  eval(STOR.read("launcher.js"));
  setTimeout(()=>{
    g.fast(false);
    g.clear();
    launcher(appmenu,"DK08");
  },1000);
}


