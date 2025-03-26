const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

let levels = 1;
let strokes = 0;


class Level {
    constructor(jsonPath) {
        this.color = 'green';
        this.blockSize = 25; // Size of each block
        this.startX = 250; // Adjust starting position
        this.startY = 150;
        this.blocks = [];
        this.jsonPath = jsonPath;
    }

    async loadLevel() {
        try {
            const response = await fetch(this.jsonPath);
            const data = await response.json();
            this.blocks = data.blocks;
            //console.log('Level loaded with blocks:', this.blocks);
        } catch (error) {
            console.error("Error loading level data:", error);
        }
    }

    block(x, y) {
        ctx.fillStyle = 'green';
        ctx.fillRect(x, y, this.blockSize, this.blockSize);
    }

    drawLevel() {
        if (!this.blocks || this.blocks.length === 0) return; // Check if blocks is not undefined and has length
    
        for (let row = 0; row < this.blocks.length; row++) {
            for (let col = 0; col < this.blocks[row].length; col++) {
                if (this.blocks[row][col] === 1) {
                    let x = this.startX + col * this.blockSize;
                    let y = this.startY + row * this.blockSize;
                    this.block(x, y);
                }
            }
        }
    }
}

class Ball {
    constructor (x,y) {
        this.startX = x;  // Store starting position
        this.startY = y;
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = { x: 0, y: 0 };
    }
    draw() {
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    checkCollisionWithBlocks(blocks, level) {
        if (!blocks || blocks.length === 0) return;
        for (let row = 0; row < blocks.length; row++) {
            for (let col = 0; col < blocks[row].length; col++) {
                if (blocks[row][col] === 1) { // Check only solid blocks
                    let blockX = level.startX + col * level.blockSize;
                    let blockY = level.startY + row * level.blockSize;
                    let blockSize = level.blockSize;

                    // Collision detection (AABB - Axis Aligned Bounding Box)
                    if (
                        this.x + this.radius > blockX &&  // Ball right edge > Block left edge
                        this.x - this.radius < blockX + blockSize && // Ball left edge < Block right edge
                        this.y + this.radius > blockY && // Ball bottom > Block top
                        this.y - this.radius < blockY + blockSize // Ball top < Block bottom
                    ) {
                        // Determine which side the collision happened
                        let overlapX = Math.min(
                            Math.abs(this.x + this.radius - blockX), 
                            Math.abs(this.x - this.radius - (blockX + blockSize))
                        );
                        let overlapY = Math.min(
                            Math.abs(this.y + this.radius - blockY), 
                            Math.abs(this.y - this.radius - (blockY + blockSize))
                        );

                        // Resolve collision based on smallest overlap
                        if (overlapX < overlapY) {
                            this.speed.x *= -1; // Reflect X direction
                            this.x += this.speed.x * 2;
                        } else {
                            this.speed.y *= -1; // Reflect Y direction
                            this.y += this.speed.y * 2;
                        }
                    }
                }
            }
        }
    }

    checkCollisionWithHole(holeX, holeY) {
        let dx = this.x - holeX;
        let dy = this.y - holeY;
        let distance = Math.sqrt(dx * dx + dy * dy); // Euclidean distance
    
        if (distance <= (8 - this.radius)) {  // Hole radius (8) - Ball radius (5)
            
            return true;
        }
        return false;
    }

    update(level,holeX, holeY) {
        this.x += this.speed.x;
        this.y += this.speed.y;

        this.checkCollisionWithBlocks(level.blocks, level);

        if (this.checkCollisionWithHole(holeX, holeY)) {
            this.x = this.startX;
            this.y = this.startY;
            this.speed.x = 0;
            this.speed.y = 0;
            //console.log("Level Complete!");
            levels++;

            // Update game state based on current level
            if (levels === 1) {
                gameState = "level1Screen";
            } else if (levels === 2) {
                gameState = "level2Screen";
            } else if (levels === 3) {
                gameState = "level3Screen";
            } else if (levels === 4) {
                gameState = "level4Screen";
            } else if (levels === 5) {
                gameState = "level5Screen";
            } else if (levels === 6) {
                gameState = "level6Screen";
            } else if (levels === 7) {
                gameState = "level7Screen";
            } else if (levels === 8) {
                gameState = "level8Screen";
            } else if (levels === 9) {
                gameState = "level9Screen";
            } else if (levels === 10) {
                gameState = "gameOverScreen";
            } 
        }

        // Apply friction
        this.speed.x *= 0.95;
        this.speed.y *= 0.95;

        this.draw();
    }
}

class Club {
    constructor (x, y, ball) {
        this.angle = 0;
        this.ball = ball;
        this.length = 30;
        this.x = x;
        this.y = y;
        this.power = 0;
        this.maxPower = 20;
        this.alpha = 1
    }
    draw() {
        // Calculate club position based on angle
        this.x = this.ball.x + Math.cos(this.angle) * this.length;
        this.y = this.ball.y + Math.sin(this.angle) * this.length;

        // Draw the club as a rectangle
        ctx.save(); // Save canvas state
        ctx.translate(this.x, this.y); // Move to club position
        ctx.rotate(this.angle); // Rotate the club
        ctx.fillStyle = `rgba(0, 250, 0, ${this.alpha})`;
        ctx.fillRect(-40, +10, 20, 5); // Center the club
        ctx.restore(); // Restore canvas state
        //Draw the power bar
        ctx.fillText("power", 70, 530)
        ctx.strokeStyle = 'green'
        ctx.lineWidth = 2;
        ctx.strokeRect(90,400,50,100);
        ctx.fillRect(90,500,50,-this.power * 5)

    }

    updatePower(increase) {
        if (increase) {
            this.power = Math.min(this.power + 0.5, this.maxPower); // Increase power but cap it
        }
    }

    hitBall() {
        let force = this.power; // Scale power to velocity
        this.ball.speed.x = Math.cos(this.angle - Math.PI/2) * force;
        this.ball.speed.y = Math.sin(this.angle - Math.PI/2) * force;
        this.power = 0; // Reset power after hit
    }

    
    update(direction) {
        let rotationSpeed = 0.05; // Adjust rotation speed
        if (direction === "left") {
            this.angle -= rotationSpeed;
        } else if (direction === "right") {
            this.angle += rotationSpeed;
        }
        if (Math.abs(this.ball.speed.x) > 0.05 || Math.abs(this.ball.speed.y) > 0.05) {
            this.alpha = 0;
        } else {
            this.alpha = 1; // Ensure the club is visible when the ball stops
        }
        this.draw();
    }
}

class Hole {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
    }
    
    draw() {
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}


const ball = new Ball(375, 500);
const club = new Club(ball.x - 10, ball.y + 10, ball);
const level1 = new Level('level1.json');
const level2 = new Level('level2.json');
const level3 = new Level('level3.json');
const level4 = new Level('level4.json');
const level5 = new Level('level5.json');
const level6 = new Level('level6.json');
const level7 = new Level('level7.json');
const level8 = new Level('level8.json');
const level9 = new Level('level9.json');
const holeLvl1 = new Hole(580,255);
const holeLvl2 = new Hole(580,255);
const holeLvl3 = new Hole(580,255);
const holeLvl4 = new Hole(600,520);
const holeLvl5 = new Hole(600,520);
const holeLvl6 = new Hole(600,520);
const holeLvl7 = new Hole(600,520);
const holeLvl8 = new Hole(600,520);
const holeLvl9 = new Hole(600,520);

const lines = [
    "BLACKPEBBLE GOLF...",
    "WHERE THE BUSINESS OF KEEPING THE POOR, POOR",
    "AND THE RICH, RICH, PLAYS OUT",
    "BLACKPEBBLE - GOLF - INITIALISED",
    "",
    "HIT ENTER TO PLAY",
    "  _______",
    " (.......)",
    "(.(o).(o).)    GOLF IS FOR WANKERS     USE LEFT/RIGHT ARROWS TO AIM",
    "|....^....|   /                          HOLD SPACE TO POWER UP",
    "|...___...| _/                         RELEASE SPACEBAR TO HIT BALL",
    " (.......)",
    "  (_____)",
    "___(_X_)___",
    "",
    "GAMES FOR DEGENS",
    "A DOOMERCORP FAN GAME - ARENA HANDLE - @doomercorp, @doomergin",
    "~TedsIndie 2025~   ARENA HANDLE - @5pam5pam",
    "PLAY or BE PLAYED!!!!!",
];

const lines2 = [
    "NOW GO AND DO SOMETHING USEFUL...",
    "LIKE.....",
    "- READ THE DOOMERCORP LORE PAPER",
    "- TIP A POOR PERSON",
    "- HELP A GRANNY CROSS THE ROAD",
    "- GROW SOME VEGETABLES",
    "- BANG A DRUM",
    "- PLAY FOLK MUSIC OUTSIDE A BANK",
    "- WRITE A 1000 WORD THESIS ON WHY BILL NOMATES IS A SHITHEAD",
    "- VISIT DOOMERCORP.COM",
    "AND, GOLF IS FOR WANKERS",
    "MASTURBATION IS FOR GOLFERS",
    "VISIT DOOMERCORP.COM",
    ".........",
    ".........",
    "GAMES FOR DEGENS",
    "A DOOMERCORP FAN GAME - ARENA HANDLE - @doomercorp, @doomergin",
    "CODE BY ~TedsIndie 2025~   ARENA HANDLE - @5pam5pam",
    "PLAY or BE PLAYED!!!!!",
];

let lineIndex = 0;
let charIndex = 0;
let lastTimeout = performance.now();
let timeoutDuration = 25;
let gameState = "introScreen";
let direction = null;

const keys = {
    KeyP: false,
    Space: false,
    Enter: false,
    ArrowLeft: false,
    ArrowRight: false,
};

function typeText(text) {
    let currentTime = performance.now();
    ctx.font = "16px Courier";
    ctx.fillStyle = "green";

    for (let i = 0; i < lineIndex; i++) {
        ctx.fillText(text[i], 50, 100 + i * 25);
    }

    if (lineIndex < text.length) {
        ctx.fillText(text[lineIndex].substring(0, charIndex), 50, 100 + lineIndex * 25);
        if (currentTime - lastTimeout >= timeoutDuration) {
            lastTimeout = currentTime;
            if (charIndex < text[lineIndex].length) {
                charIndex++;

            } else {
                charIndex = 0;
                lineIndex++;
            
            }
        }
    }
}

async function init() {
    await level1.loadLevel();
    await level2.loadLevel();
    await level3.loadLevel();
    await level4.loadLevel();
    await level5.loadLevel();
    await level6.loadLevel();
    await level7.loadLevel();
    await level8.loadLevel();
    await level9.loadLevel();
    gameLoop();
}



async function gameLoop() {
    if (gameState === "introScreen") {
        introScreen();
    } else if (gameState === "level1Screen") {
        level1Screen();
    } else if (gameState === "level2Screen") {
        level2Screen();
    } else if (gameState === "level3Screen") {
        level3Screen();
    } else if (gameState === "level4Screen") {
        level4Screen();
    } else if (gameState === "level5Screen") {
        level5Screen();
    } else if (gameState === "level6Screen") {
        level6Screen();
    } else if (gameState === "level7Screen") {
        level7Screen();
    } else if (gameState === "level8Screen") {
        level8Screen();
    } else if (gameState === "level9Screen") {
        level9Screen();
    } else if (gameState === "gameOverScreen") {
        gameOverScreen();
    } 
    requestAnimationFrame(gameLoop);
}



function introScreen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF", 50, 70);
    ctx.fillText("HIT ENTER TO PLAY", canvas.width/2,canvas.height/2 + 100);
    typeText(lines);
}

function level1Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 1", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level1.drawLevel(level1.blocks);
    holeLvl1.draw();
    ball.update(level1, holeLvl1.x, holeLvl1.y);
    club.update(direction);
}

function level2Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 2", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level2.drawLevel(level2.blocks);
    holeLvl2.draw();
    ball.update(level2, holeLvl2.x, holeLvl2.y);
    club.update(direction);
}

function level3Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 3", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level3.drawLevel(level3.blocks);
    holeLvl3.draw();
    ball.update(level3, holeLvl3.x, holeLvl3.y);
    club.update(direction);
}

function level4Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 4", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level4.drawLevel(level4.blocks);
    holeLvl4.draw();
    ball.update(level4, holeLvl4.x, holeLvl4.y);
    club.update(direction);
}

function level5Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 5", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level5.drawLevel(level5.blocks);
    holeLvl5.draw();
    ball.update(level5, holeLvl5.x, holeLvl5.y);
    club.update(direction);
}

function level6Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 6", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level6.drawLevel(level6.blocks);
    holeLvl6.draw();
    ball.update(level6, holeLvl6.x, holeLvl6.y);
    club.update(direction); 
}

function level7Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 7", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level7.drawLevel(level7.blocks);
    holeLvl7.draw();
    ball.update(level7, holeLvl7.x, holeLvl7.y);
    club.update(direction); 
}

function level8Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black"; //
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 8", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level8.drawLevel(level8.blocks);
    holeLvl8.draw();
    ball.update(level8, holeLvl8.x, holeLvl8.y);
    club.update(direction); 
}

function level9Screen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF - HOLE 9", 50, 70);
    ctx.fillText("STROKES", 50, 150);
    ctx.fillText(strokes, 100, 200);

    level9.drawLevel(level9.blocks);
    holeLvl8.draw();
    ball.update(level9, holeLvl9.x, holeLvl9.y);
    club.update(direction); 
}

function gameOverScreen() {
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "50px pixelPurl";
    ctx.fillStyle = 'green';
    ctx.fillText("BLACKPEBBLE MINI GOLF", 50, 70);
    ctx.fillText("HIT ENTER TO PLAY AGAIN", canvas.width/2 - 100,canvas.height/2 + 150);
    ctx.fillText("TOTAL STROKES", 450, 150);
    ctx.fillText(strokes, 590, 210);
    typeText(lines2);
}

init();

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = true;
    }
    if (gameState === "introScreen") {
        if (e.code === 'Enter') {
            gameState = 'level1Screen';
        }
    }
    if (gameState === "level1Screen" || gameState === "level2Screen" || gameState === "level3Screen"
        || gameState === "level4Screen" || gameState === "level5Screen" || gameState === "level6Screen"
        || gameState === "level7Screen" || gameState === "level8Screen" || gameState === "level9Screen") {
        if (e.code === 'ArrowLeft') {
            direction = "left";
        }
        if (e.code === 'ArrowRight') {
            direction = "right";
        }
        if (e.code === 'Space' && club.power <= 100) {
            club.updatePower(true);
        }
    }
    if (gameState === "gameOverScreen") {
        if (e.code === 'Enter') {
            gameState = 'introScreen';
            lineIndex = 0;
            charIndex = 0;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code)) {
        keys[e.code] = false;
    }
    if (gameState === "level1Screen" || gameState === "level2Screen" || gameState === "level3Screen"
        || gameState === "level4Screen" || gameState === "level5Screen" || gameState === "level6Screen"
        || gameState === "level7Screen" || gameState === "level8Screen" || gameState === "level9Screen") {
        if (e.code === 'ArrowLeft') {
            direction = null;
        }
        if (e.code === 'ArrowRight') {
            direction = null;
        }
        if (e.code === 'Space') {
            club.hitBall();
            strokes++
            //console.log(strokes);
        }
    }
});
