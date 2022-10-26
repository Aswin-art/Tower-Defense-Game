/**@type {HTMLCanvasElement} */

const canvas = document.getElementById('game')
const ctx = canvas.getContext('2d')

const menuEl = document.getElementById('menu')
const pauseEl = document.getElementById('pause')
const gameoverEl = document.getElementById('gameover')

const playerInput = document.querySelector('.player-name')
const playBtn = document.querySelector('.play')
const totalTime = document.querySelector('.totalTime')
const totalScore = document.querySelector('.totalScore')
const totalResource = document.querySelector('.totalResource')

canvas.width = 900
canvas.height = 600

const cellSize = 100
const cellGap =  3
const defenderCost = 100
const grid = []
let canvasPosition = canvas.getBoundingClientRect()

const mouse = {
    position: {
        x: 0,
        y: 0,
    },
    width: 0.1,
    height: 0.1
}

function drawBoard(){
    let boards = []

    for(let row = 0; row < canvas.height; row += cellSize){
        for(let column = 0; column < canvas.width; column += cellSize){
            const position = {
                x: column,
                y: row
            }

            boards.push(new Board(position))
        }
    }

    return boards;
}

function collision(first, second){
    if(
        !(
            first.position.x > second.position.x + second.width ||
            first.position.x + first.width < second.position.x ||
            first.position.y > second.position.y + second.height ||
            first.position.y + first.height < second.position.y
        )
    ){
        return true
    }
}

function enemyHitDefender(enemy, defender){
    return enemy.position.x < defender.position.x + defender.width && enemy.position.y == defender.position.y
}

function drawDefender(position){
    return new Defender(position)
}

function drawEnemies(){
    const position = {
        x: canvas.width,
        y: Math.floor(Math.random() * 5 + 1) * cellSize
    }

    return new Enemy(position)
}

function drawShoot(defender){
    if(defender.shooting){
        const position = {
            x: defender.position.x + defender.width / 2,
            y: defender.position.y + defender.height / 2
        }

        const defenderPosition = defender

        return new Shoot(position, defenderPosition)
    }
}

function enemyEatDefender(enemy, defender){
    if(enemy.aspd > 50){
        defender.health -= 10
        enemy.aspd = 10
    }else{
        enemy.aspd++
    }
}

function detectEnemy(enemy, defender){
    return enemy.position.y == defender.position.y && enemy.position.x >= defender.position.x + defender.width
}

function ammoCrashEnemy(ammo, enemy){
    return ammo.position.x + ammo.width > enemy.position.x && ammo.defenderPosition.position.y == enemy.position.y
}

function enemyPass(enemy){
    return enemy.position.x < 0
}

class Defender{
    constructor(position){
        this.position = position
        this.width = cellSize
        this.height = cellSize
        this.health = 100
        this.shooting = false
        this.projectiles = []
        this.timerShoot = 0
    }

    draw(ctx){
        ctx.fillStyle = 'blue'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        ctx.font = '20px Arial'
        ctx.fillStyle = 'gold'
        ctx.fillText(Math.floor(this.health), this.position.x + 15, this.position.y + 30)
    }

    update(){
        this.shooting = false
    }
}

class Enemy{
    constructor(position){
        this.position = position
        this.speed = Math.random() * .2 + .4
        this.movement = this.speed
        this.width = cellSize
        this.height = cellSize
        this.health = 100
        this.maxHealth = this.health
        this.aspd = 10
    }

    stop(){
        this.movement = 0
    }

    move(){
        this.movement = this.speed
    }

    draw(ctx){
        ctx.fillStyle = 'red'
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
        ctx.font = '20px Arial'
        ctx.fillStyle = 'white'
        ctx.fillText(Math.floor(this.health), this.position.x + 15, this.position.y + 30)
    }

    update(){
        this.position.x -= this.movement
    }
}

class Shoot{
    constructor(position, defenderPosition){
        this.position = position
        this.defenderPosition = defenderPosition
        this.width = 10
        this.height = 10
        this.color = 'green'
        this.speed = 5
        this.power = 5
    }

    draw(ctx){
        ctx.fillStyle = this.color
        ctx.fillRect(this.position.x, this.position.y, this.width, this.height)
    }

    update(){
        this.position.x += this.speed
    }
}

class Board{
    constructor(position){
        this.position = position
        this.width = cellSize
        this.height = cellSize
    }

    draw(ctx){
        if(mouse.position.x && mouse.position.y && collision(this, mouse)){
            ctx.strokeStyle = 'black'
            ctx.strokeRect(this.position.x, this.position.y, this.width, this.height)
        }
    }

    update(){

    }
}

class EventHandler{
    constructor(game){
        document.addEventListener('mousemove', (e) => {
            mouse.position.x = e.x - canvasPosition.x
            mouse.position.y = e.y - canvasPosition.y
        })

        document.addEventListener('mouseleave', (e) => {
            mouse.position.x = undefined
            mouse.position.y = undefined
        })

        document.addEventListener('click', (e) => {
            const position = {
                x: mouse.position.x - (mouse.position.x % cellSize),
                y: mouse.position.y - (mouse.position.y % cellSize)
            }

            for(let i = 0; i < game.defenders.length; ++i){
                if(game.defenders[i].position.x == position.x && game.defenders[i].position.y == position.y){
                    return
                }
            }

            if(game.resources >= defenderCost){
                game.defenders.push(drawDefender(position))
                game.resources -= defenderCost
            }
        })

        document.addEventListener('keydown', (e) => {
            switch(e.key){
                case 'Escape':
                    if(pause){
                        pause = false
                        closePauseScreen()
                    }else{
                        pause = true
                        pauseScreen()
                    }
                    break;
            }
        })
    }
}

class Game{
    constructor(){
        this.boards = []
        this.defenders = []
        this.enemies = []
        this.ammos = []

        this.setup()
    }

    setup(){
        this.resources = 300
        this.boards = drawBoard()
        new EventHandler(this)
    }

    draw(ctx){
        [...this.boards, ...this.defenders, ...this.enemies, ...this.ammos].forEach(item => item.draw(ctx))
    }

    update(){
        [...this.boards, ...this.defenders, ...this.enemies, ...this.ammos].forEach(item => item.update())

        if(timeSpawnEnemies > 200){
            this.enemies.push(drawEnemies())
            timeSpawnEnemies = 0
        }

        this.enemies.forEach(enemy => {
            if(enemyPass(enemy)){
                gameover = true
                gameOverScreen()
            }
        })

        this.enemies.forEach((enemy) => {
            this.defenders.forEach((defender, index) => {
                if(enemyHitDefender(enemy, defender)){
                    enemy.stop()
                    enemyEatDefender(enemy, defender)
                    if(defender.health <= 0){
                        enemy.move()
                        this.defenders.splice(index, 1)
                    }
                }
            })
        })

        this.defenders.forEach(defender => {
            this.enemies.forEach(enemy => {
                if(detectEnemy(enemy, defender)){
                    defender.shooting = true
                    if(defender.timerShoot > 50){
                        this.ammos.push(drawShoot(defender))
                        defender.timerShoot = 0
                    }

                    defender.timerShoot++
                }else{
                    defender.shooting = false
                }
            })
        })

        this.ammos.forEach((ammo, index) => {
            if(ammo.position.x > canvas.width){
                this.ammos.splice(index, 1)
            }
        })

        this.ammos.forEach((ammo, ammoIndex) => {
            this.enemies.forEach((enemy, enemyIndex) => {
                if(ammoCrashEnemy(ammo, enemy)){
                    enemy.health -= ammo.power
                    this.ammos.splice(ammoIndex, 1)
                }
            })
        })

        this.enemies.forEach((enemy, index) => {
            if(enemy.health <= 0){
                this.enemies.splice(index, 1)
                this.resources += 100
                score += 10
            }
        })
    }
}

const game = new Game()
let pause = true
let gameover = true
let time = 0
let score = 0
let timeSpawnEnemies = 0

setInterval(() => {
    if(pause || gameover){
        return
    }

    time++
}, 1000)

function animate(){
    if(pause || gameover){
        return
    }else{
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        game.update()
        game.draw(ctx)

        totalScore.innerHTML = score
        totalTime.innerHTML = time
        totalResource.innerHTML = game.resources
    
        timeSpawnEnemies++
        requestAnimationFrame(animate)
    }
}

function play(){
    if(playerInput.value){
        localStorage.setItem('name', playerInput.value)
        pause = false
        gameover = false
        menuEl.style.display = 'none'
        animate()
    }

    return
}

function pauseScreen(){
    pauseEl.style.display = 'flex'
}

function closePauseScreen(){
    pauseEl.style.display = 'none'
    animate()
}

function gameOverScreen(){
    gameoverEl.style.display = 'flex'
}

function closeGameOverScreen(){
    gameoverEl.style.display = 'none'
    gameover = false
    animate()
}

playerInput.addEventListener('input', function(){
    if(playerInput.value){
        playBtn.style.backgroundColor = 'salmon'
        playBtn.style.pointerEvents = 'all'
    }else{
        playBtn.style.backgroundColor = 'rgba(250, 128, 114, .7)'
        playBtn.style.pointerEvents = 'none'

    }
})

playBtn.addEventListener('click', play)