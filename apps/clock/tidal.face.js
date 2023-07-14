(() => {

    function getFace(){

    const p = Math.PI/2;
    const PRad = Math.PI/180;
    const HIGHTIDE = Math.floor(Date.parse("2023-07-14T16:30:00")/1000);

    function tideangle(){
        t = (Math.floor(Date.now()/1000)-HIGHTIDE)%44714;
        return Math.floor(360*t/44714);

    }

    function dialmark(r) {
        const m = ['Hi','5','4','3','2','1','Lo','5','4','3','2','1'];
        g.setColor(3);
        g.setFont("Vector",16).setFontAlign(0,0);
        for (i=0;i<12;i++){
            var a = i*30*PRad;
            var x = 88+Math.sin(a)*r;
            var y = 98-Math.cos(a)*r;
            g.drawString(m[i],x,y);
            x = 88+Math.sin(a)*(r-11);
            y = 98-Math.cos(a)*(r-11);
            g.fillRect(x-1,y-1,x+1,y+1);
        }
        g.drawCircle(88,98,r-11);

    }

    function hand(angle, r1,r2, r3) {
        const a = angle*PRad;
        g.fillPoly([
            88+Math.sin(a)*r1,
            98-Math.cos(a)*r1,
            88+Math.sin(a+p)*r3,
            98-Math.cos(a+p)*r3,
            88+Math.sin(a)*r2,
            98-Math.cos(a)*r2,
            88+Math.sin(a-p)*r3,
            98-Math.cos(a-p)*r3]);
    }

    var lastPos;
    var currPos;

    function onMinute() {
        g.setColor(0);
        hand(lastpos, -12, 56, 7);
        currpos = tideangle();
        g.setColor(3);
        hand(currpos, -12, 56, 7);
        lastpos = currpos;
        g.setColor(0,0,0);
        g.fillCircle(88,98,2);
        g.flip();
      }

    function drawAll() {
        g.clearRect(0,20,175,175);
        // g.defColor(1,0x0f);
        currpos = lastpos = tideangle();
        // draw dial   
        dialmark(69);
        onMinute();
    }
    
    return {init:drawAll, tick:onMinute, tickpersec:false};
 }

return getFace;

})();
