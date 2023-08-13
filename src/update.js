


function update(dt) {    
    fitToContainer()
    global.t += dt
    
    // reset periodically
    global.resetCountdown -= dt
    if( global.resetCountdown < 0 ){
        global.balloons = []
        global.spawnCountdown = 0
        global.resetCountdown = global.resetDelay
    }
    
    //spawn new Ballons
    if( (global.balloons.length < global.nBalloons) && (global.spawnCountdown<=0) ){
        global.spawnCountdown = randRange( ...global.spawnDelay )
        var pos = v( randRange(.4,.6), randRange(.4,.6) )
        var d = pos.sub(global.centerPos)
        
        if( true ){
            // nearest point on edge of screen
            var np = ( Math.abs(d.x) > Math.abs(d.y) ) ?
                      v(  global.screenCorners[(d.x<0) ? 0 : 2].x, pos.y)
                    : v(  pos.x, global.screenCorners[(d.y<0) ? 0 : 2].y)
            
            // push away from center
            var a = np.sub(global.centerPos).getAngle()
            var basePos = np.add(vp(a,.2))
        } else {
            
            // point below screen
            var basePos = v(global.centerPos.x,1.5)
        }
        
        global.balloons.push( new Balloon( basePos, pos ) )
    } else {
        global.spawnCountdown -= dt
    }
    
    // update balloons
    global.balloons.forEach( b => b.update(dt) )
    
    // remove OOB baloons
    global.balloons = global.balloons.filter( b => {
        var result = (b.pos.x>-1) && (b.pos.x<2) 
                  && (b.pos.y>-1) && (b.pos.y<2)
        if( !result ){
            console.log("remove oob ball")
            console.log( global.balloons.length )
        }
        return result
    })
    
}





var lastCanvasOffsetWidth = -1;
var lastCanvasOffsetHeight = -1;
function fitToContainer(){
    
    var cvs = global.canvas
    if( (cvs.offsetWidth!=lastCanvasOffsetWidth) || (cvs.offsetHeight!=lastCanvasOffsetHeight) ){
        
      cvs.width  = cvs.offsetWidth;
      cvs.height = cvs.offsetHeight;
        
        var padding = 0; // (extra zoom IN) thickness of pixels CUT OFF around edges
        var dimension = Math.max(cvs.width, cvs.height) + padding*2;
        global.canvasScale = dimension;
        global.canvasOffsetX = (cvs.width - dimension) / 2;
        global.canvasOffsetY = (cvs.height - dimension) / 2;
    global.ctx.setTransform(global.canvasScale, 0, 0, 
        global.canvasScale, global.canvasOffsetX, global.canvasOffsetY);
        
        var xr = -global.canvasOffsetX / global.canvasScale
        var yr = -global.canvasOffsetY / global.canvasScale
        global.screenCorners = [v(xr,yr),v(1-xr,yr),v(1-xr,1-yr),v(xr,1-yr)]
    }
}