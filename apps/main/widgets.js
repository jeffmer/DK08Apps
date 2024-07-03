DK08.drawWidgets = function() {
    var w=g.getWidth(), h=g.getHeight();
    var pos = {
        tl:{x:10, y:1, r:0, c:0}, // if r==1, we're right->left
        tr:{x:w-10, y:1, r:1, c:0}
    };
    if (global.WIDGETS) {
      for (var wd of WIDGETS) {
        var p = pos[wd.area];
        if (!p) return;
        wd.x = p.x - p.r*wd.width;
        wd.y = p.y;
        p.x += wd.width*(1-2*p.r);
        p.c++;
      }
      g.reset();
      g.defColor(1,0x3C); //yellow
      g.clearRect(0,0,w-1,19);
      for (wd of WIDGETS) wd.draw(wd);
      g.flip();
      g.restoreColors();
    }
  };

  DK08.loadWidgets = function() {
    global.WIDGETS={};
    require("Storage").list(/\.wid\.js$/).forEach(widget=>eval(require("Storage").read(widget)));
  };
  