(() => {

    function getFace(){

    function drawSteps() {
        var stps = E.totalSteps();
        g.reset();
        g.clearRect(0,20,175,175);
        g.setColor(3);
        g.setFontAlign(0,0);
        g.setFont("Vector",48);
        g.drawString(stps,88,98,true);
      }

      TICKS = 0;

      function drawActive(){
        secs = (new Date()).getSeconds();
        if (TICKS == 0) drawSteps();
        else {++TICKS; if (TICKS>10) TICKS =0;}
        g.setColor(ACCEL.active()?1:0)
        g.fillRect(160,160,170,170)
        g.flip();
      }

    return {init:drawActive, tick:drawActive, tickpersec:true};
    
    }

  return getFace;

})();