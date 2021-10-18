(() => {
  function draw() {
    g.reset();
    var m = process.memory();
    var pc = Math.round(m.usage*100/m.total);
    g.setColor(3);
    g.setFont("6x8").setFontAlign(0,0).drawString(pc+"%", this.x+15, 10, true/*solid*/);
  }  
  WIDGETS["ram"]={area:"tl",width: 20,draw:draw};
})()