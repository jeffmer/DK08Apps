(() => {

    function getFace(){

    const p = Math.PI/2;
    const PRad = Math.PI/180;

    function seconds(angle, r) {
        const a = angle*PRad;
        const x = 88+Math.sin(a)*r;
        const y = 98-Math.cos(a)*r;
        if (angle % 90 == 0) {
            g.setColor(1);
            g.fillRect(x-4,y-4,x+4,y+4);
        } else if (angle % 30 == 0){
            g.setColor(3);
            g.fillRect(x-3,y-3,x+3,y+3);
        } else {
            g.setColor(3);
            g.fillRect(x-1,y-1,x+1,y+1);
        }
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

    var minuteDate;
    var secondDate;

    function onSecond() {
        g.setColor(0);
        hand(360*secondDate.getSeconds()/60, -5, 64, 3);
        if (secondDate.getSeconds() === 0) {
            hand(360*(minuteDate.getHours() + (minuteDate.getMinutes()/60))/12, -12, 50, 7);
            hand(360*minuteDate.getMinutes()/60, -12, 60, 7);
            minuteDate = new Date();
        }
        g.setColor(3);
        hand(360*(minuteDate.getHours() + (minuteDate.getMinutes()/60))/12, -12, 50, 7);
        hand(360*minuteDate.getMinutes()/60, -12, 60, 7);
        g.setColor(1);
        secondDate = new Date();
        hand(360*secondDate.getSeconds()/60, -5, 64, 3);
        g.setColor(0,0,0);
        g.fillCircle(88,98,2);
        g.flip();
      }

    function drawAll() {
        g.clearRect(0,20,175,175);
        g.defColor(1,0x0f);
        secondDate = minuteDate = new Date();
        // draw seconds   
        for (let i=0;i<60;i++)
            seconds(360*i/60, 69);
        onSecond();
    }
    
    return {init:drawAll, tick:onSecond};
 }

return getFace;

})();
