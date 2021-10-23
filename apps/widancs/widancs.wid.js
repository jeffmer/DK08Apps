
(() => {

  var s = require("Storage").readJSON("widancs.json",1)||{settings:{enabled:false, category:[1,2,4]}};
  var ENABLED = s.settings.enabled;
  var CATEGORY = s.settings.category;

  var notifyqueue = [];
  var current = {cat:0,uid:0};
  
  var screentimeout;
  var inalert = false;

  function release_screen(){
    screentimeout= setTimeout(() => { 
        SCREENACCESS.release(); 
        screentimeout = undefined; 
        inalert=false; 
        next_notify();
    }, 500);
  } 

  function displaymsg(m){
    //we may already be displaying a prompt, so clear it
    E.showAlert();
    if (screentimeout) clearTimeout(screentimeout);
    SCREENACCESS.request();
    DK08.buzz().then(()=>{
      DK08.backlight(); 
      E.showAlert(m.message,m.title).then(()=>{
        NRF.ancsAction(current.uid,current.cat==1);
        release_screen();
      });
    });
  }

  var notifyTO;
  function getnotify(d){
    if (d.event!="add") return;
    if (notifyTO) clearTimeout(notifyTO);
    if(!CATEGORY.includes(d.category)) return; 
    var len = notifyqueue.length;
    if (d.category == 1) { // it's a call so pre-empt
        if (inalert) {notifyqueue.push(current); inalert=false;}
        notifyqueue.push({cat:d.category, uid:d.uid});
    } else if (len<32)
        notifyqueue[len] = {cat:d.category, uid:d.uid};
    notifyTO = setTimeout(next_notify,1000);
  }

  function next_notify(){
    if(notifyqueue.length==0 || inalert) return;
    inalert=true;
    current = notifyqueue.pop();
    NRF.ancsGetNotificationInfo(current.uid).then(
      (m)=>{displaymsg(m);}
    ).catch(function(e){
      inalert = false;
      next_notify();
      E.showMessage("ANCS: "+e,"ERROR");
    });
  }

  var stage = 0;    
  //grey, pink, lightblue, yellow, green
  function draw(){
    var colors = new Uint16Array([3,3,1,1,2,0]);
    var img = E.toArrayBuffer(atob("GBgBAAAABAAADgAAHwAAPwAAf4AAP4AAP4AAP4AAHwAAH4AAD8AAB+AAA/AAAfgAAf3gAH/4AD/8AB/+AA/8AAf4AAHwAAAgAAAA"));
    g.setColor(colors[stage]);
    g.drawImage(img,this.x,0,{scale:0.75});
 }
    
  WIDGETS["ancs"] ={area:"tl", width:24,draw:draw};
    
  function changed(){
    stage = NRF.getSecurityStatus().connected ? 4 : 3;
    DK08.drawWidgets(); //gets colors right
  }
  
  if (ENABLED && typeof SCREENACCESS!='undefined') {
    E.on("ANCS", getnotify);
    NRF.on('connect',changed);
    NRF.on('disconnect',changed);
    NRF.setServices({},{ancs:true});
    stage = NRF.getSecurityStatus().connected ? 4 : 3;
  }
  
})();
