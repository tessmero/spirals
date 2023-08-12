class Balloon{
    constructor( pos ){
        this.pos = pos
        this.vel = v(0,0)
        this.rad = randRange(.01,.1)
        
        this.a = this.rad
        this.b = randRange( 3e-3, 6e-3 )
        this.stepDelay = 20
        this.stepLen = .005
        this.spiral = []
        this.complete = false
        
        this.angleOffset = pi
        this.angle = this.angleOffset
        this.t = 0
    }
    
    stepDa(r){
        return 2e-1*this.rad / r
    }
    
    update(dt){
        this.t += dt
        
        
        // avoid other balloons
        this.vel  = this.vel.mul(1-(1e-2*dt)) //friction
        this.pos = this.pos.add(this.vel.mul(dt))
        global.balloons.forEach( o => {
            var d = o.pos.sub(this.pos)
            var d2 = d.getD2()
            if(d2 == 0) return // skip self
            var md2 = Math.pow(o.rad + this.rad,2)
            if( d2 > md2 ) return // skip far-away balloon
            var angle = d.getAngle()
            var f = 1e-8*dt/d2
            this.vel = this.vel.sub(vp(angle,f))
        })
        
        // grow internal spiral
        if( this.complete ) return
        while( this.t > this.stepDelay ){
            var r = this.a - (this.angle-this.angleOffset)*this.b
            
            if( r < .01 ){
                this.complete = true
                break
            }
            
            this.angle += this.stepDa(r)
            var next = vp( this.angle,  r )
            this.spiral.push( next )
            this.t -= this.stepDelay
            
        }
        
    }
    
    draw(g){
        g.strokeStyle = 'black'
        g.lineWidth = .001
        g.beginPath()
        g.arc( this.pos.x, this.pos.y, this.rad, 0, twopi )
        
        if( this.spiral.length > 0 ){
            var p = this.pos.add(this.spiral[0])
            g.moveTo( p.x, p.y )
            for( var i = 1 ; i < this.spiral.length ; i++ ){
                p = this.pos.add(this.spiral[i])
                g.lineTo( p.x, p.y )
            }
        }
        g.stroke()
    }
}
