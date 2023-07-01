//Accelerometer
//BMA223 SPI accelerometer
//AI1=D4;AI2=D3;ACS=D2;AMOSI=D30;AMISO=D31;ACLK=D29;APWR=D7;

function BMA223(){
  var acc;
  var stinterval;
  var activity = 0;

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
          writereg(0x21,0x03); //latch interrupt for 1 second
          writereg(0x10,0x0B); //Bandwidth 31.25 Hz
          writereg(0x28,0x03); //slope sensitivity
          setbit(0x16,0); // motion x enable
          setbit(0x16,1); // motion y enable
          setbit(0x19,2); // map it to INT1
          lowPowerMode(true);
        },100);     
    },100);
  }

  // values are 4 is face tap, 2 side tap, 1 bottom or top side tap
  setWatch(()=>{
      var rv = readreg(0x0b);
      var v = (rv&0x07);
      activity=110; 
      if(!stinterval) stepStart();
  },D4,{ repeat:true, debounce:false, edge:'rising' });


  function readXYZ(){
    function conv(i){
      return (i & 0x7F)-(i & 0x80);
    }
    return {
      x:8*conv(readreg(3)),
      y:8*conv(readreg(5)),
      z:8*conv(readreg(7))
    };
  }

  function stepStart(){
      stinterval = setInterval(()=>{
      var a = readXYZ();
      var sts = E.stepCount(a.x,a.y,a.z);
      --activity;
      if (activity<=0) stinterval = clearInterval( stinterval);
    },80);
}

  return {init:initAll, read:readXYZ, lowPower:lowPowerMode, active:()=> {return activity>0;}};
}




