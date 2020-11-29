//Accelerometer
//BMA223 SPI accelerometer
//AI1=D4;AI2=D3;ACS=D2;AMOSI=D30;AMISO=D31;ACLK=D29;APWR=D7;

function BMA223(){
  var acc;

  function readreg(r){
    return acc.send([0x80|r,0x00],D2)[1];
  }

  function writereg(r,v){
      acc.send([0x7f & r,v],D2);
  }

  function setbit(r,b){
      var v = readreg(r);
      writereg(r,v | 1<<b);
  }

  function resetbit(r,b){
    var v = readreg(r);
    writereg(r,v & ~(1<<b));
  }

  function lowPowerMode(b){
    if (b)
      setbit(0x11,6);
    else
      resetbit(0x11,6);
  }

  function initAll(){
    acc=new SPI();
    acc.setup({sck:D29,miso:D31,mosi:D30,mode:0});
    D2.reset();
    D7.reset();
    setTimeout(()=>{
        D7.set();
        D2.set();
        setTimeout(()=>{
          writereg(0x21,0x0E); //latch interrupt for 50ms
          setbit(0x16,5); // single tap enable
          setbit(0x19,5); // map it to INT1
          lowPowerMode(true);
        },100);     
    },100);
  }

  // values are 4 is face tap, 2 side tap, 1 bottom or top side tap
  setWatch(()=>{
      DK08.emit("tap",(readreg(0x0b)&0x7f)>>4);
  },D4,{ repeat:true, debounce:false, edge:'rising' });


  function readXYZ(){
    function conv(i){
      return (i & 0x7F)-(i & 0x80);
    }
    return {
      x:conv(readreg(3)),
      y:conv(readreg(5)),
      z:conv(readreg(7))
    };
  }

  return {init:initAll, read:readXYZ, lowPower:lowPowerMode};
}

/*
var ACCEL = ACC223();
ACCEL.init();

DK08.on("tap",(v)=>{
  console.log("Tap: "+v);
});
*/


