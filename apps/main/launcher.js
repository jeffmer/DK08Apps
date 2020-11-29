launcher = function(items,title) {
  if (!items){ g.clear().flip(); return; }
  var w = g.getWidth()-9;
  var h = g.getHeight();
  var menuItems = Object.keys(items);
  var fontHeight=30;
  var selected = 0;
  var x = 20;
  var x2 = w-2;
  var y = 45;
  var y2 = 175;
  var cBg = 0; // background col
  var cFg = 3; // foreground col
  var cHighlightBg = 3;
  var cHighlightFg = 0;
  var l = {
    draw : function() {
      g.reset();
      g.setColor(1);
      g.setFont('Vector',32).setFontAlign(0,-1,0);
      if (title) {
        g.drawString(title,(x+x2)/2,10);
      }
      g.setColor(cFg);
      g.setFont('Vector',26).setFontAlign(0,0,0);
      var rows = 0|Math.min((y2-y) / fontHeight,menuItems.length);
      var idx = E.clip(selected-(rows>>1),0,menuItems.length-rows);
      var iy = y;
      var less = idx>0;
      while (rows--) {
        var name = menuItems[idx];
        var item = items[name];
        var hl = (idx==selected && !l.selectEdit);
        g.setColor(hl ? cHighlightBg : cBg);
        g.fillRect(x,iy,x2,iy+fontHeight-1);
        g.setColor(hl ? cHighlightFg : cFg);
        g.setFontAlign(0,-1,0);
        g.drawString(name,(x2+x)/2,iy);
        g.setColor(cFg);
        iy += fontHeight;
        idx++;
      }
      g.setFontAlign(-1,-1);
      var more = idx<menuItems.length;      
      g.setColor(more?-1:0);
      g.fillPoly([104,172,136,172,120,175]);
      g.flip();
    },
    select : function() {
      var item = items[menuItems[selected]];
      if ("function" == typeof item) {
        DK08.removeListener("endtouch",DK08.move);
        item(l);
      }
    },
    move : function(dir) {
      selected = (dir+selected)%menuItems.length;
      if (selected<0) selected += menuItems.length;
      l.draw();
    }
  };  
  DK08.move = function(p){
      l.move(1);
  };
  l.draw();
  DK08.on("endtouch",DK08.move);
  DK08.on("longtouch",(t)=>{
    if (!DK08.RUNNING){
      DK08.RUNNING = true;
      l.select();
    } else {
      reset();
    }
  });
  return l;  
};

