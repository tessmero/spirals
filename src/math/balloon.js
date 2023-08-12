class Balloon{
    constructor( basePos, pos, ){
        
        // base of setm
        this.basePos = basePos
        
        // circle containing spiral (for physics)
        this.pos = pos
        this.vel = v(0,0)
        this.angleOffset = randRange(pio2,twopi-pio2)
        this.startAngle = this.angleOffset
        this.avel = 0
        
        // archimedean spiral shape
        this.rad = randRange(.02,.1)
        this.spiralClockwise = (rand() > .5)
        this.a = this.rad 
        this.b = this.rad * randRange( 1e-2, 3e-2 )
        
        // settings for twisting behavior
        // (regulate distance between stem and spiral)
        this.stemSpace = null
        this.lastStemSpace = null
        this.targetStemSpace = this.rad*.95
        this.targetStemSpaceMargin = this.rad*.05
        
        
        // stem growth animation
        this.stemProgress = 0 // number of line segs in stem
        this.nStem = 100 // max number of line segs in stem
        this.stemComplete = false
        this.spiralComplete = false
        this.angle = pi
        
        // sprial growth animation
        this.t = 0
        this.stepDelay = 20
        this.stepLen = 1e-1
        this.spiral = []
        
        // scale of outward force on other balloons
        this.fmul = Math.pow(this.rad,2)
    }
    
    update(dt){
        this.t += dt
        
        // update pos
        this.angleOffset += this.avel
        this.pos = this.pos.add(this.vel.mul(dt))
        
        // apply friction
        this.vel  = this.vel.mul(1-(3e-2*dt)) 
        this.avel *= 1-(3e-4*dt)
        
        // twist towards natural angle
        if( (this.stemComplete) && (this.stemSpace!=null) && (this.lastStemSpace!=null) ){
            //console.log( this.stemSpace.toFixed(3),   this.targetStemSpace.toFixed(3) )
            var d = this.stemSpace - this.targetStemSpace
            if( Math.abs(d) > this.targetStemSpaceMargin ){
                this.avel += 4e-4*dt*d
                this.vel = this.vel.add(vp(this.angleOffset-pio2,1e-4*dt*d))
            }
        }
        
        // get pushed by other balloons
        global.balloons.forEach( o => {
            var d = o.pos.sub(this.pos)
            var d2 = d.getD2()
            if(d2 == 0) return // skip self
            var md2 = Math.pow(o.rad + this.rad,2)
            if( d2 > md2 ) return // skip distant balloon
            
            // accel self away from intersecting balloon
            var angle = d.getAngle()
            var f = 2e-6*dt/d2*this.fmul
            this.vel = this.vel.sub(vp(angle,f))
        })
        
        // tend towards center of screen
        var g = 1e-8
        var angle = this.pos.sub(global.centerPos).getAngle()
        var f = vp( angle, g*dt  )
        this.vel = this.vel.sub( f )
        
        if( this.spiralComplete ) return
        
        // animate stem or spiral growth
        while( this.t > this.stepDelay ){
            
            if( !this.stemComplete ){
                this.growStemOneStep()
            } else {
                this.growSpiralOneStep()
            }
            this.t -= this.stepDelay
            
        }
        
    }
    
    growStemOneStep(){
        this.stemProgress += 1
        if( this.stemProgress >= this.nStem ) this.stemComplete = true
    }
    
    growSpiralOneStep(){
        var r = this.a - (this.angle-pi)*this.b
        
        if( r < .01 ){
            this.spiralComplete = true
            return
        }
        
        this.angle += this.stepLen*this.rad / r
        
        //var next = vp( this.angle,  r )
        var next = [this.angle,r]
        
        this.spiral.push( next )
    }
    
    draw(g){
        
        // get stem shape
        var sp = this.getStemPoints()
        if( false ){
            // debug 
            // draw bezier points
            g.fillStyle = 'red'
            sp.forEach( p => g.fillRect(p.x,p.y,.003,.003) )
        }
        
        g.strokeStyle = 'black'
        g.lineWidth = .001
        g.beginPath()
        
        
        // draw balloon shell
        //g.arc( this.pos.x, this.pos.y, this.rad, 0, twopi )
        
        // draw stem
        g.moveTo( this.basePos.x, this.basePos.y )
        var minD2 = 999
        for( var i = 0 ; i < this.stemProgress ; i++ ){
            var p = bezier(sp,i/this.nStem)
            var d2 = p.sub(this.pos).getD2()
            if( d2 < minD2 ) minD2 = d2
            g.lineTo( p.x, p.y )
        }
        this.lastStemSpace = this.stemSpace
        this.stemSpace = Math.sqrt(minD2)
        //var sp = this.pos.add(vp(pi,this.rad))// point where stem meets spiral
        //var end = va(this.basePos,sp,this.stemProgress/this.nStem)
        //g.moveTo( this.basePos.x, this.basePos.y )
        //g.lineTo( end.x, end.y )
        
        // draw internal spiral
        if( this.spiral.length > 0 ){
            for( var i = 0 ; i < this.spiral.length ; i++ ){
                g.lineTo( ...this.getSpiralPos(i) )
            }
        }
        g.stroke()
        
        
        // debug 
        // draw starting angle
        if( false ) {
            g.font = ".02px Arial";
            g.textAlign = "center";
            g.textBaseline = 'middle';
            g.fillStyle = "black";
            var x = .4
            var y = .4
            g.fillText(this.startAngle.toFixed(3), this.pos.x, this.pos.y );
        }
        
        // debug 
        // draw twisting details
        if( false ) {
            g.font = ".02px Arial";
            g.textAlign = "center";
            g.textBaseline = 'middle';
            g.fillStyle = "black";
            var x = .4
            var y = .4
            g.fillText(this.stemSpace.toFixed(3), this.pos.x, this.pos.y-.01 );
            g.fillText(this.targetStemSpace.toFixed(3), this.pos.x, this.pos.y+.01 );
        }
    }
    
    // used in draw()
    // get bezier curve points defining stem shape
    getStemPoints(){
        var result = []
        
        // first point is base
        result.push( this.basePos )
        
        // random point 
        var maxy = this.basePos.y
        var miny = this.pos.y-+this.rad
        var r = maxy-miny
        if ( true || (r > 0) ){
            result.push( v(
                    this.basePos.x + randRange(-r,r),
                    randRange(miny,maxy)))
        }
        
        // last two points end up tangent to the spiral
        var a = this.pos.add(vp(this.angleOffset+.5,this.rad))
        var end = this.pos.add(vp(this.angleOffset,this.rad))
        var angle = end.sub(a).getAngle()-.1
        result.push( end.add( vp(angle,.1) ) )
        result.push( end )
        
        return result
    }
    
    // used in draw()
    getSpiralPos(i){        
        var ar = this.spiral[i]
        var p = this.pos.add(vp(ar[0]+this.angleOffset+pi,ar[1]))
        //var p = this.pos.add(this.spiral[i])
        
        return [p.x,p.y]
    }
}
