

// Initialize the game
function init() {
    var cvs = document.getElementById("gameCanvas");
      cvs.style.width='100%';
      cvs.style.height='100%';  
    //cvs.addEventListener("mousemove", mouseMove);
    cvs.addEventListener("click", mouseClick);
    global.canvas = cvs
    global.ctx = cvs.getContext("2d");
    
    resetRand()
    requestAnimationFrame(gameLoop);
}


// Main game loop
let secondsPassed;
let oldTimeStamp;
let fps;

function gameLoop(timeStamp) {
    
    var msPassed = 0;
    if (oldTimeStamp) {
      msPassed = timeStamp - oldTimeStamp;
    }
    var secondsPassed = msPassed / 1000;
    oldTimeStamp = timeStamp;
    var fps = Math.round(1 / secondsPassed);


    msPassed = Math.min(msPassed,50)

    update(msPassed);
    draw(fps);

    requestAnimationFrame(gameLoop);
}


// Initialize the game
init();

