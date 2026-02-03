// Cloud9 Champions Arena - Enhanced Game Engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Game state
        this.gameState = 'championSelect';
        this.score = 0;
        this.kills = 0;
        this.timeLeft = 180;
        this.lastTime = performance.now();
        
        // Player
        this.player = null;
        this.selectedChampion = null;
        
        // Game objects
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        this.clouds = [];
        
        // Cloud9 theming
        this.c9Blue = '#00BFFF';
        this.c9White = '#FFFFFF';
        this.c9DarkBlue = '#0080CC';
        
        // Arena
        this.arenaCenter = { x: this.width / 2, y: this.height / 2 };
        this.stormRadius = Math.min(this.width, this.height) * 0.45;
        this.maxStormRadius = this.stormRadius;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // Timers
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateClouds();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.clicked = true;
            if (this.gameState === 'playing' && this.player) {
                this.player.startAttacking();
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.clicked = false;
            if (this.player) {
                this.player.stopAttacking();
            }
        });
    }
    
    generateClouds() {
        this.clouds = [];
        for (let i = 0; i < 12; i++) {
            this.clouds.push({
                x: Math.random() * (this.width + 300) - 150,
                y: Math.random() * this.height,
                size: Math.random() * 120 + 60,
                speed: Math.random() * 30 + 15,
                opacity: Math.random() * 0.6 + 0.3,
                bobSpeed: Math.random() * 0.02 + 0.01,
                bobOffset: Math.random() * Math.PI * 2
            });
        }
    }
    
    startGame(championName) {
        this.selectedChampion = championName;
        this.player = new Player(this.width / 2, this.height / 2, championName);
        this.gameState = 'playing';
        this.score = 0;
        this.kills = 0;
        this.timeLeft = 180;
        this.stormRadius = this.maxStormRadius;
        
        // Clear arrays
        this.enemies = [];
        this.projectiles = [];
        this.powerUps = [];
        this.particles = [];
        
        // Reset timers
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        
        // Update UI
        document.getElementById('currentChampion').textContent = championName;
        document.getElementById('championSelect').style.display = 'none';
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        const dt = deltaTime / 1000;
        
        // Update timer
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) {
            this.endGame();
            return;
        }
        
        // Update storm
        const stormProgress = 1 - (this.timeLeft / 180);
        this.stormRadius = this.maxStormRadius * (1 - stormProgress * 0.75);
        this.stormRadius = Math.max(80, this.stormRadius);
        
        // Update player
        if (this.player && this.player.health > 0) {
            this.player.update(deltaTime, this);
            
            // Storm damage
            const distFromCenter = this.getDistance(
                this.player.x, this.player.y,
                this.arenaCenter.x, this.arenaCenter.y
            );
            
            if (distFromCenter > this.stormRadius) {
                this.player.takeDamage(25 * dt);
            }
        } else if (this.player && this.player.health <= 0) {
            this.endGame();
            return;
        }
        
        // Spawn enemies
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > 1800) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // Spawn power-ups
        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer > 7000 && this.powerUps.length < 3) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }
        
        // Update game objects
        this.updateGameObjects(deltaTime);
        this.updateClouds(deltaTime);
        this.checkCollisions();
        this.updateUI();
    }
    
    spawnEnemy() {
        if (this.enemies.length >= 6) return;
        
        let x, y;
        const angle = Math.random() * Math.PI * 2;
        const distance = this.stormRadius + 80 + Math.random() * 120;
        x = this.arenaCenter.x + Math.cos(angle) * distance;
        y = this.arenaCenter.y + Math.sin(angle) * distance;
        
        // Keep in bounds
        x = Math.max(30, Math.min(this.width - 30, x));
        y = Math.max(30, Math.min(this.height - 30, y));
        
        this.enemies.push(new Enemy(x, y));
    }
    
    spawnPowerUp() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * (this.stormRadius - 60);
        const x = this.arenaCenter.x + Math.cos(angle) * distance;
        const y = this.arenaCenter.y + Math.sin(angle) * distance;
        
        this.powerUps.push(new PowerUp(x, y));
    }
    
    updateGameObjects(deltaTime) {
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this);
            
            if (enemy.health <= 0) {
                this.addParticles(enemy.x, enemy.y, this.c9Blue, 12);
                this.score += 150;
                this.kills++;
                this.enemies.splice(i, 1);
            }
        }
        
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update power-ups
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.update(deltaTime);
            
            if (!powerUp.active) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    updateClouds(deltaTime) {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * deltaTime / 1000;
            cloud.y += Math.sin(performance.now() * cloud.bobSpeed + cloud.bobOffset) * 0.3;
            
            if (cloud.x > this.width + cloud.size) {
                cloud.x = -cloud.size;
                cloud.y = Math.random() * this.height;
            }
        });
    }
    
    checkCollisions() {
        if (!this.player) return;
        
        // Player vs enemies
        this.enemies.forEach(enemy => {
            const distance = this.getDistance(this.player.x, this.player.y, enemy.x, enemy.y);
            if (distance < (this.player.size + enemy.size)) {
                this.player.takeDamage(20);
                enemy.takeDamage(40);
                this.addParticles(enemy.x, enemy.y, '#ff6666', 8);
                
                // Knockback
                const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
                enemy.x += Math.cos(angle) * 40;
                enemy.y += Math.sin(angle) * 40;
            }
        });
        
        // Projectiles vs enemies
        this.projectiles.forEach(projectile => {
            if (projectile.owner === 'player') {
                this.enemies.forEach(enemy => {
                    const distance = this.getDistance(projectile.x, projectile.y, enemy.x, enemy.y);
                    if (distance < (projectile.size + enemy.size)) {
                        enemy.takeDamage(projectile.damage);
                        if (!projectile.piercing) {
                            projectile.active = false;
                        }
                        this.addParticles(enemy.x, enemy.y, this.c9Blue, 6);
                    }
                });
            } else if (projectile.owner === 'enemy') {
                const distance = this.getDistance(projectile.x, projectile.y, this.player.x, this.player.y);
                if (distance < (projectile.size + this.player.size)) {
                    this.player.takeDamage(projectile.damage);
                    projectile.active = false;
                    this.addParticles(this.player.x, this.player.y, '#ff6666', 6);
                }
            }
        });
        
        // Player vs power-ups
        this.powerUps.forEach(powerUp => {
            const distance = this.getDistance(this.player.x, this.player.y, powerUp.x, powerUp.y);
            if (distance < (this.player.size + powerUp.size)) {
                powerUp.collect(this.player);
                this.score += 75;
                this.addParticles(powerUp.x, powerUp.y, powerUp.color, 15);
            }
        });
    }
    
    render() {
        // Cloud9 themed sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#B0E0E6');
        gradient.addColorStop(0.6, '#E0F6FF');
        gradient.addColorStop(1, '#F0F8FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Render clouds
        this.renderClouds();
        
        // Render Cloud9 logo in background
        this.renderC9Logo();
        
        // Render storm
        this.renderStorm();
        
        // Render game objects
        this.particles.forEach(particle => particle.render(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.render(this.ctx));
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        this.projectiles.forEach(projectile => projectile.render(this.ctx));
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render minimap
        this.renderMinimap();
    }
    
    renderClouds() {
        this.ctx.save();
        
        this.clouds.forEach(cloud => {
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = this.c9White;
            
            const x = cloud.x;
            const y = cloud.y;
            const size = cloud.size;
            
            // Draw fluffy cloud with C9 styling
            this.ctx.beginPath();
            this.ctx.arc(x - size * 0.4, y, size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(x + size * 0.4, y, size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(x, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
            this.ctx.arc(x - size * 0.7, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
            this.ctx.arc(x + size * 0.7, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
    renderC9Logo() {
        this.ctx.save();
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillStyle = this.c9Blue;
        this.ctx.font = 'bold 200px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('C9', this.width / 2, this.height / 2 + 60);
        this.ctx.restore();
    }
    
    renderStorm() {
        // Safe zone circle
        this.ctx.save();
        this.ctx.strokeStyle = this.c9Blue;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([8, 8]);
        this.ctx.beginPath();
        this.ctx.arc(this.arenaCenter.x, this.arenaCenter.y, this.stormRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Storm danger zone
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Cut out safe zone
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.beginPath();
        this.ctx.arc(this.arenaCenter.x, this.arenaCenter.y, this.stormRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
        
        this.ctx.restore();
    }
    
    renderMinimap() {
        const size = 140;
        const x = this.width - size - 25;
        const y = this.height - size - 25;
        
        // Minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(x, y, size, size);
        this.ctx.strokeStyle = this.c9Blue;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, size, size);
        
        // Storm circle
        const stormScale = (this.stormRadius / this.maxStormRadius) * (size / 2);
        this.ctx.strokeStyle = this.c9Blue;
        this.ctx.beginPath();
        this.ctx.arc(x + size/2, y + size/2, stormScale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Player dot
        if (this.player) {
            const px = x + (this.player.x / this.width) * size;
            const py = y + (this.player.y / this.height) * size;
            this.ctx.fillStyle = this.c9Blue;
            this.ctx.beginPath();
            this.ctx.arc(px, py, 4, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // Enemy dots
        this.enemies.forEach(enemy => {
            const ex = x + (enemy.x / this.width) * size;
            const ey = y + (enemy.y / this.height) * size;
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(ex, ey, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('timer').textContent = Math.ceil(this.timeLeft);
        document.getElementById('health').textContent = this.player ? Math.ceil(this.player.health) : 0;
        document.getElementById('kills').textContent = this.kills;
    }
    
    endGame() {
        this.gameState = 'gameOver';
        const survivalTime = 180 - this.timeLeft;
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('survivalTime').textContent = Math.ceil(survivalTime);
        document.getElementById('finalKills').textContent = this.kills;
        document.getElementById('gameOver').style.display = 'block';
        
        // Check for new record
        const currentRecord = localStorage.getItem('cloud9ArenaRecord') || 0;
        if (this.score > currentRecord) {
            localStorage.setItem('cloud9ArenaRecord', this.score);
            document.getElementById('newRecord').style.display = 'block';
        }
    }
    
    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
let game;
window.addEventListener('load', () => {
    game = new Game();
});

// Global functions
function selectChampion(championName) {
    game.startGame(championName);
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('championSelect').style.display = 'block';
    game.gameState = 'championSelect';
}
