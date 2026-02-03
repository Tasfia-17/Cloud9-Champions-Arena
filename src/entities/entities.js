// Enemy class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 80 + Math.random() * 40;
        this.size = 15;
        this.type = this.getRandomType();
        this.attackCooldown = 0;
        this.animationFrame = 0;
        this.lastAttackTime = 0;
    }
    
    getRandomType() {
        const types = ['basic', 'fast', 'tank', 'shooter'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        switch(type) {
            case 'fast':
                this.speed *= 1.5;
                this.health *= 0.7;
                this.size = 12;
                this.color = '#ff6600';
                break;
            case 'tank':
                this.speed *= 0.6;
                this.health *= 2;
                this.size = 20;
                this.color = '#666666';
                break;
            case 'shooter':
                this.speed *= 0.8;
                this.health *= 1.2;
                this.attackRange = 200;
                this.color = '#ff0066';
                break;
            default:
                this.color = '#ff4444';
        }
        
        return type;
    }
    
    update(deltaTime, game) {
        if (!game.player) return;
        
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // AI behavior based on type
        if (this.type === 'shooter' && distance < this.attackRange) {
            // Shooter stays at range and shoots
            if (this.attackCooldown <= 0) {
                this.shootAtPlayer(game);
                this.attackCooldown = 2000;
            }
            
            // Move away if too close
            if (distance < 100) {
                this.x -= (dx / distance) * this.speed * deltaTime / 1000;
                this.y -= (dy / distance) * this.speed * deltaTime / 1000;
            }
        } else {
            // Move towards player
            if (distance > 0) {
                this.x += (dx / distance) * this.speed * deltaTime / 1000;
                this.y += (dy / distance) * this.speed * deltaTime / 1000;
            }
        }
        
        // Update cooldowns
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // Update animation
        this.animationFrame += deltaTime / 100;
        
        // Boundary check
        this.x = Math.max(this.size, Math.min(game.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(game.height - this.size, this.y));
    }
    
    shootAtPlayer(game) {
        const angle = Math.atan2(game.player.y - this.y, game.player.x - this.x);
        const projectile = new Projectile(
            this.x, this.y,
            Math.cos(angle) * 300,
            Math.sin(angle) * 300,
            15, 'enemy', this.color
        );
        game.projectiles.push(projectile);
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
        }
    }
    
    render(ctx) {
        if (this.health <= 0) return;
        
        ctx.save();
        
        // Enemy glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        
        // Pulsing animation for different types
        let pulseSize = this.size;
        if (this.type === 'fast') {
            pulseSize += Math.sin(this.animationFrame * 0.3) * 2;
        }
        
        // Draw enemy
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw type indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Orbitron';
        ctx.textAlign = 'center';
        
        const symbols = {
            'basic': '●',
            'fast': '▲',
            'tank': '■',
            'shooter': '◆'
        };
        
        ctx.fillText(symbols[this.type] || '●', this.x, this.y + 4);
        
        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = 30;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 10;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            ctx.fillStyle = '#00ff00';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        }
        
        ctx.restore();
    }
}

// Projectile class
class Projectile {
    constructor(x, y, vx, vy, damage, owner, color = '#00d4ff') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.owner = owner;
        this.color = color;
        this.size = 4;
        this.active = true;
        this.piercing = false;
        this.trail = [];
        this.maxTrailLength = 8;
    }
    
    update(deltaTime) {
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Move projectile
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        
        // Check bounds
        if (this.x < 0 || this.x > 1400 || this.y < 0 || this.y > 900) {
            this.active = false;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Draw trail
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        if (this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }
        
        // Draw projectile
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// PowerUp class
class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = this.getRandomType();
        this.size = 15;
        this.active = true;
        this.animationFrame = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    getRandomType() {
        const types = ['health', 'damage', 'speed', 'shield'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        switch(type) {
            case 'health':
                this.color = '#00ff00';
                this.symbol = '❤️';
                this.effect = (player) => {
                    player.health = Math.min(player.maxHealth, player.health + 30);
                };
                break;
            case 'damage':
                this.color = '#ff6600';
                this.symbol = '⚔️';
                this.effect = (player) => {
                    player.effects.push({
                        type: 'damage',
                        multiplier: 1.5,
                        duration: 8000
                    });
                };
                break;
            case 'speed':
                this.color = '#ffff00';
                this.symbol = '💨';
                this.effect = (player) => {
                    player.effects.push({
                        type: 'speed',
                        multiplier: 1.4,
                        duration: 6000
                    });
                };
                break;
            case 'shield':
                this.color = '#00d4ff';
                this.symbol = '🛡️';
                this.effect = (player) => {
                    player.invulnerable = true;
                    player.invulnerabilityTime = 3000;
                };
                break;
        }
        
        return type;
    }
    
    update(deltaTime) {
        this.animationFrame += deltaTime / 1000;
        
        // Floating animation
        this.y += Math.sin(this.animationFrame * 3 + this.bobOffset) * 0.5;
    }
    
    collect(player) {
        this.effect(player);
        this.active = false;
    }
    
    render(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // Pulsing glow effect
        const pulseIntensity = 0.5 + 0.5 * Math.sin(this.animationFrame * 4);
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15 * pulseIntensity;
        
        // Draw power-up
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.symbol, this.x, this.y + 5);
        
        // Rotating ring
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 200;
        this.vy = (Math.random() - 0.5) * 200;
        this.color = color;
        this.life = 1000;
        this.maxLife = 1000;
        this.size = Math.random() * 4 + 2;
        this.gravity = 50;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        this.vy += this.gravity * deltaTime / 1000;
        
        this.life -= deltaTime;
        
        // Fade out
        this.vx *= 0.98;
        this.vy *= 0.98;
    }
    
    render(ctx) {
        if (this.life <= 0) return;
        
        ctx.save();
        
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
