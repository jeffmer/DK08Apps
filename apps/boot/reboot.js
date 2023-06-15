
function do_reboot(){
  E.showMessage("Rebooting\n NOW");
  setInterval(()=>{
    if (!BTN1.read()) E.reboot();
    else E.showMessage("Release\n BTN");
  },1000);
}

DK08.on("dbltouch",(t)=>{
    do_reboot();
  });

setTimeout(()=>{
    E.showMessage("Double touch\n to reboot");
 },500);



