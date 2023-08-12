class Balloon{
    constructor( basePos, pos, ){
        this.basePos = basePos
        this.pos = pos
        this.vel = v(0,0)
        this.rad = randRange(.05,.1)
        
        this.a = this.rad
        this.b = randRange( 3e-3, 6e-3 )
        this.stepDelay = 20
        this.stepLen = .005
        this.spiral = []
        
        this.stemProgress = 0 // number of line segs in stem
        this.nStem = 100 // max number of line segs in stem
        this.stemComplete = false
        this.spiralComplete = false
        
        this.angleOffset = pi
        this.angle = this.angleOffset
        this.t = 0
    }
    
    stepDa(r){
        return 2e-1*this.rad / r
    }
    
    update(dt){
        this.t += dt
        
        //test
        this.angleOffset += 1e-4*dt
        
        // avoid other balloons
        this.vel  = this.vel.mul(1-(3e-2*dt)) //apply friction
        this.pos = this.pos.add(this.vel.mul(dt))
        global.balloons.forEach( o => {
            var d = o.pos.sub(this.pos)
            var d2 = d.getD2()
            if(d2 == 0) return // skip self
            var md2 = Math.pow(o.rad + this.rad,2)
            if( d2 > md2 ) return // skip far-away balloon
            
            // accel away
            var angle = d.getAngle()
            var f = 1e-8*dt/d2
            this.vel = this.vel.sub(vp(angle,f))
        })
        
        // grow if necessary
        if( this.spiralComplete ) return
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
        var r = this.a - (this.angle-this.angleOffset)*this.b
        
        if( r < .01 ){
            this.spiralComplete = true
            return
        }
        
        this.angle += this.stepDa(r)
        
        //var next = vp( this.angle,  r )
        var next = [this.angle,r]
        
        this.spiral.push( next )
    }
    
    draw(g){
        
        // debug 
        // draw bezier points
        var sp = this.getStemPoints()
        if( false ){
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
        for( var i = 0 ; i < this.stemProgress ; i++ ){
            var p = bezier(sp,i/this.nStem)
            g.lineTo( p.x, p.y )
        }
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
        if ( r > 0 ){
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
