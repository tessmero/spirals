class Balloon{
    constructor( basePos, pos ){
        
        // base of setm
        this.basePos = basePos
        
        // circle containing spiral (for physics)
        this.pos = pos
        this.vel = v(0,0)
        this.clockwise = (rand() > .5)
        this.angleOffset = pos.sub(basePos).getAngle()+pi
        this.startAngle = this.angleOffset
        this.avel = 0
        
        // archimedean spiral shape
        this.rad = randRange(.02,.1)
        this.a = this.rad 
        this.b = Math.max( 1e-3, this.rad * randRange( 1e-2, 8e-2 ) )
        
        // settings for twisting behavior
        // (regulate distance between stem and spiral)
        this.targetAngle = this.angleOffset
                +(rand()>.5?randRange(-.3,-.2):randRange(.2,.8))
                *(this.clockwise?1:-1)
        this.targetAngleMargin = .1
        
        
        // stem growth animation
        this.stemProgress = 0 // number of line segs in stem
        this.nStem = 100 // max number of line segs in stem
        this.stemComplete = false
        this.spiralComplete = false
        this.stemRetracting = false
        this.stemRetraction = 0 // radius of hidden portion of stem
        this.stemRetractionOffset = randRange(75,95) // center of hidden portion of stem
        this.angle = pi
        
        // sprial growth animation
        this.t = 0
        this.stepDelay = 20
        this.stepLen = 1e-1
        this.spiral = []
        
        // scale of outward force on other balloons
        this.fmul = Math.pow(this.rad,2)
        
        // counter for collision optimization
        this.collisionCheckOffsetIndex = 0
    }
    
    update(dt){
        this.t += dt
        
        // update pos
        this.angleOffset += this.avel*dt
        this.pos = this.pos.add(this.vel.mul(dt))
        
        // apply friction
        this.vel  = this.vel.mul(1-(3e-2*dt)) 
        if( ! this.stemRetracting ) this.avel *= 1-(3e-4*dt)
        
        // twist towards target angle
        if( this.stemComplete && (!this.stemRetracting) ){
            //console.log( this.stemSpace.toFixed(3),   this.targetStemSpace.toFixed(3) )
            var d = this.targetAngle - this.angleOffset
            if( Math.abs(d) > this.targetAngleMargin ){
                this.avel += 4e-7*dt*d
                this.vel = this.vel.add(vp(this.angleOffset-pio2,1e-6*dt*d))
            }
        }
        
        // get pushed by other balloons
        for( var i = 0 ; i < global.nCollisionChecks ; i++ ){
            
            // cycle over balloons
            this.collisionCheckOffsetIndex = (this.collisionCheckOffsetIndex+1)%global.balloons.length
            var o = global.balloons[this.collisionCheckOffsetIndex]
            if( !o.stemComplete ) continue // skip balloon in stem growth animation
            var d = o.pos.sub(this.pos)
            var d2 = d.getD2()
            if(d2 == 0) continue // skip self
            var md2 = Math.pow(o.rad + this.rad,2)
            var fm = .2
            if( d2 > md2*(1+fm) ) continue // skip distant balloon
            
            // accel self away from nearby balloon
            var angle = d.getAngle()
            var f = 2e-7*dt/d2*this.fmul*Math.max(8*pi,o.angle) * (d2<md2 ? 1 : .5*(1-(d2-md2)/(fm)) )
            this.vel = this.vel.sub(vp(angle,f))
        }
        
        // tend towards visible on-screen region
        var d = this.pos.sub(global.centerPos)
        if( (this.pos.x-this.rad < global.screenCorners[0].x) || (this.pos.x+this.rad > global.screenCorners[2].x) || (this.posy-this.rad < global.screenCorners[0].y) || (this.pos.y+this.rad > global.screenCorners[2].y)  ){
            var g = 1e-7
            var angle = this.pos.sub(global.centerPos).getAngle()
            var f = vp( angle, g*dt  )
            this.vel = this.vel.sub( f )
        }
        
        // animate stem or spiral growth
        while( this.t > this.stepDelay ){
            
            if( !this.stemComplete ){
                this.growStemOneStep()
            } else if (!this.spiralComplete) {
                this.growSpiralOneStep()
            }
            
            if( this.stemRetracting ) {
                this.retractStemOneStep()
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
        
        if( r < this.b*4 ){
            this.stemRetracting = true
            if( r < this.b ){
                this.spiralComplete = true
                return
            }        
        }
        
        this.angle +=  this.stepLen*this.rad / r
        
        //var next = vp( this.angle,  r )
        var next = [this.angle,r]
        
        this.spiral.push( next )
    }
    
    retractStemOneStep(){
        this.stemRetraction += 1
    }
    
    draw(g){
        
        // get stem shape
        var sp = this.getStemPoints()
        
        
        if( global.debugBezierPoints ){
            // debug 
            // draw bezier points
            g.fillStyle = 'red'
            sp.forEach( p => g.fillRect(p.x,p.y,.003,.003) )
        }
        
        
        
        // start drawing balloon
        g.strokeStyle = 'black'
        g.lineWidth = .001
        g.beginPath()
        
        // draw balloon shell
        //g.arc( this.pos.x, this.pos.y, this.rad, 0, twopi )
        
        // draw stem
        g.moveTo( this.basePos.x, this.basePos.y )
        if( this.stemRetraction == 0 ){
            for( var i = 0 ; i < this.stemProgress ; i++ ){
                var p = bezier(sp,i/this.nStem)
                g.lineTo( p.x, p.y )
            }
            
        } else {
            
            // draw stem with a portion missing in the middle
            var hiddenStart = this.stemRetractionOffset-this.stemRetraction 
            var hiddenEnd = this.stemRetractionOffset+this.stemRetraction 
            for( var i = 0 ; (i<this.stemProgress) && (i<hiddenStart) ; i++ ){
                var p = bezier(sp,i/this.nStem)
                g.lineTo( p.x, p.y )
            }
            var p = bezier(sp,hiddenEnd/this.nStem)
            g.moveTo( p.x, p.y )
            for( var i = hiddenEnd ; (i<this.stemProgress) && (i<this.nStem) ; i++ ){
                var p = bezier(sp,i/this.nStem)
                g.lineTo( p.x, p.y )
            }
            if( hiddenEnd >= this.nStem ){
                g.moveTo( ...this.getSpiralPos(0) )
            }
        }
        
        // draw internal spiral
        if( this.spiral.length > 0 ){
            for( var i = 0 ; i < this.spiral.length ; i++ ){
                g.lineTo( ...this.getSpiralPos(i) )
            }
        }
        g.stroke()
        
        // debug
        // draw line from base to spiral
        if( false ){
            g.strokeStyle = 'red'
            g.beginPath()
            g.moveTo( this.basePos.x, this.basePos.y )
            g.lineTo( this.pos.x, this.pos.y )
            g.stroke()
        }
        
        
        // debug 
        // draw starting angle
        if( false ) {
            g.font = ".01px Arial";
            g.textAlign = "center";
            g.textBaseline = 'middle';
            g.fillStyle = "red";
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
            g.fillText(this.angleOffset.toFixed(3), this.pos.x, this.pos.y-.01 );
            g.fillText(this.targetAngle.toFixed(3), this.pos.x, this.pos.y+.01 );
        }
    }
    
    // used in draw()
    // get bezier curve points defining stem shape
    getStemPoints(){
        var result = []
        
        // point where stem meets spiral
        var end = this.pos.add(vp(this.angleOffset,this.rad))
        
        // first point is base
        result.push( this.basePos )
        
        // random points
        for( var r = randRange(.7,.8) ; r < .9 ; r += randRange(.05,.2) ){
            var d = vp( end.sub(this.basePos).getAngle()+pio2, randRange(-.02,.02) )
            var c = va( this.basePos, end, r )
            result.push( c.add(d) )
        }
        
        // last two points end up tangent to the spiral
        var a = this.pos.add(vp(this.angleOffset+.5,this.rad))
        var angle = end.sub(a).getAngle()-.1
        if( !this.clockwise ) angle += pi
        result.push( end.add( vp(angle,.1) ) )
        result.push( end )
        
        return result
    }
    
    // used in draw()
    getSpiralPos(i){        
        var ar = this.spiral[i]
        var p = this.pos.add(vp((this.clockwise? 1 : -1)*ar[0]+this.angleOffset+pi,ar[1]))
        //var p = this.pos.add(this.spiral[i])
        
        return [p.x,p.y]
    }
}
