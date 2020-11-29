(() => {

  function getFace(){
      
  function drawTime(d) {    
      function convert(n){
          var t0 = [" ","one","two","three","four","five","six","seven","eight","nine"];
          var t1 = ["ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
          var t20= ["twenty","thirty","forty","fifty"];
          if(n<10) return {top:" ",bot:t0[n]};
          else if(n<20) return {top:" ",bot:t1[n-10]};
          else if(n<60) return {top:t20[Math.floor(n/10)-2],bot:t0[n%10]};
          return "error";     
      }
      g.reset();
      g.clearRect(0,20,175,175);
      g.setColor(3);
      g.setFontAlign(0,-1);
      g.setFont("Vector",32);
      var txt = convert(d.getHours());
      g.setColor(1).drawString(txt.top,88,30);
      g.setColor(3).drawString(txt.bot,88,60);
      txt = convert(d.getMinutes());
      g.setColor(1).drawString(txt.top,88,90);
      g.setColor(3).drawString(txt.bot,88,120);
      g.flip();
    }

  function onSecond(){
     var t = new Date();
     if (t.getSeconds() === 0) {
        drawTime(t);
    }
  }

  function drawAll(){
     drawTime(new Date());
  }

  return {init:drawAll, tick:onSecond};
  }

return getFace;

})();