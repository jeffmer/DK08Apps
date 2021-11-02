(function(){
  var CHARGING = 2;

  function setWidth() {
    WIDGETS["bat"].width = 30 + (DK08.isPower()?16:0);
  }

  E.getBattery = function (){
    var v = DK08.batV();
    v = v<3.7?3.7:v;
    return Math.floor((v-3.7)*200);
  }

  function draw() {
    var s = 29;
    var x = this.x, y = this.y;
    if (DK08.isPower()) {
      g.setColor(CHARGING).drawImage(atob("DhgBHOBzgc4HOP////////////////////3/4HgB4AeAHgB4AeAHgB4AeAHg"),x,y,{scale:0.8});
      x+=16;
    }
    g.setColor(3);
    g.fillRect(x,y+2,x+s-4,y+17);
    g.clearRect(x+2,y+4,x+s-6,y+15);
    g.fillRect(x+s-3,y+9,x+s,y+11);
    g.setColor(CHARGING).fillRect(x+2,y+4,x+2+E.getBattery()*(s-6)/100,y+15);
    g.setColor(3);
  }

  DK08.on('power',function(charging) {
    setWidth();
    DK08.drawWidgets(); // relayout widgets
    g.flip();
  });

  WIDGETS["bat"]={area:"tr",width:40,draw:draw};
  setInterval(()=>WIDGETS["bat"].draw(), 120000); 
  setWidth();
})()

