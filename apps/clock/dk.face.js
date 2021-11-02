(() => {
    function getFace(){
        
        var lastmin=-1;
        function drawClock(){
          var d=Date();
          if (d.getMinutes()==lastmin) return;
          d=d.toString().split(' ');
          var min=d[4].substr(3,2);
          var sec=d[4].substr(-2);
          var tm=d[4].substring(0,5);
          var hr=d[4].substr(0,2);
          lastmin=min;
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
          g.drawString(dt,(w-g.stringWidth(dt))/2,110);
          g.flip();
        }

        function drawFirst(){
          lastmin=-1;
          drawClock();
        }

        return {init:drawFirst, tick:drawClock};
     }

    return getFace;

})();

