(() => {
    function getFace(){
        
        function drawClock(){
          var d=Date();
          d=d.toString().split(' ');
          var min=d[4].substr(3,2);
          var sec=d[4].substr(-2);
          var tm=d[4].substring(0,5);
          var hr=d[4].substr(0,2);
          g.reset();
          g.clearRect(0,20,175,175);
          var w=g.getWidth();
          g.setColor(3);
          g.setFontVector(62);
          g.drawString(tm,4+(w-g.stringWidth(tm))/2,50);
          g.setFontVector(28);
          g.setColor(1);
          g.defColor(1,0x0f);
          var dt=d[0]+" "+d[1]+" "+d[2];//+" "+d[3];
          g.drawString(dt,(w-g.stringWidth(dt))/2,130);
          g.flip();
        }

        return {init:drawClock, tick:drawClock, tickpersec:false};
     }

    return getFace;

})();

