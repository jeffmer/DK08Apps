(() => {

    function getFace(){

    function drawTime() {
        var d = new Date();
        g.reset();
        var da = d.toString().split(" ");
        var time = da[4].substr(0, 5).split(":");
        var hours = time[0],
          minutes = time[1];
        g.clearRect(0,20,175,175);
        g.setColor(3);
        g.setFontAlign(0,-1);
        g.setFont("Vector",90);
        g.drawString(hours,88,20,true);
        g.drawString(minutes,88,96,true);
        g.flip();
      }

    return {init:drawTime, tick:drawTime, tickpersec:false};
    
    }

  return getFace;

})();