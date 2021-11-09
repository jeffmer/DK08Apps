(() => {
    function getFace(){

         const scale = g.getWidth() / 176;

        const widget = 24;

        const viewport = {
          width: g.getWidth(),
          height: g.getHeight(),
        }

        const center = {
          x: viewport.width / 2,
          y: Math.round(((viewport.height - widget) / 2) + widget),
        }

        function d02(value) {
          return ('0' + value).substr(-2);
        }
        
        function drawClock() {
          g.reset();
          g.clearRect(0, widget, viewport.width, viewport.height);   
          var now = new Date(); 
          const hour = d02(now.getHours());
          const minutes = d02(now.getMinutes());
          const day = d02(now.getDate());
          const month = d02(now.getMonth() + 1);
          const year = now.getFullYear();       
          const month2 = now.toString().substr(4,3)
          const day2 = now.toString().substr(0,3)      
          g.setFontAlign(1, 0).setFont("Vector", 90 * scale);
          g.drawString(hour, center.x + 32 * scale, center.y - 31 * scale);
          g.drawString(minutes, center.x + 32 * scale, center.y + 46 * scale); 
          g.setColor(g.theme.fg2);      
          g.fillRect(center.x + 30 * scale, center.y - 72 * scale, center.x + 32 * scale, center.y + 74 * scale);   
          g.setColor(g.theme.fg);      
          g.setFontAlign(-1, 0).setFont("Vector", 16 * scale);
          g.drawString(year, center.x + 40 * scale, center.y - 62 * scale);
          g.drawString(month, center.x + 40 * scale, center.y - 44 * scale);
          g.drawString(day, center.x + 40 * scale, center.y - 26 * scale);
          g.drawString(month2, center.x + 40 * scale, center.y + 48 * scale);
          g.drawString(day2, center.x + 40 * scale, center.y + 66 * scale);
        }

    
        return {init:drawClock, tick:drawClock, tickpersec:false};
     }

    return getFace;

})();

