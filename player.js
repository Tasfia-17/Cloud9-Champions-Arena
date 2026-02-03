// Enhanced Player class with Cloud9 theming
class Player {
    constructor(x, y, championName) {
        this.x = x;
        this.y = y;
        this.championName = championName;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 250; // Increased speed
        this.size = 20;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.88;
        this.acceleration = 1200; // Faster acceleration
        
        // Combat
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.attackRate = 200; // Faster attack rate
        
        // Abilities
        this.abilities = this.getChampionAbilities(championName);
        this.abilityCooldowns = { primary: 0, ultimate: 0 };
        
        // Animation
        this.animationFrame = 0;
        this.facing = 0;
        this.walkCycle = 0;
        this.isMoving = false;
        this.bounceOffset = 0;
        
        // Effects
        this.effects = [];
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        
        // Cloud9 colors
        this.c9Blue = '#00BFFF';
        this.c9White = '#FFFFFF';
    }
    
    getChampionAbilities(championName) {
        const abilities = {
            'Blaber': {
                primary: {
                    name: 'Lightning Dash',
                    cooldown: 2500,
                    icon: '⚡',
                    execute: (game) => this.lightningDash(game)
                },
                ultimate: {
                    name: 'Speed Boost',
                    cooldown: 7000,
                    icon: '🔥',
                    execute: (game) => this.speedBoost(game)
                },
                color: '#FFD700'
            },
            'Jojopyun': {
                primary: {
                    name: 'Arcane Blast',
                    cooldown: 2000,
                    icon: '🔮',
                    execute: (game) => this.arcaneBlast(game)
                },
                ultimate: {
                    name: 'Magic Shield',
                    cooldown: 8000,
                    icon: '🛡️',
                    execute: (game) => this.magicShield(game)
                },
                color: '#9966FF'
            },
            'Berserker': {
                primary: {
                    name: 'Rapid Fire',
                    cooldown: 3000,
                    icon: '🏹',
                    execute: (game) => this.rapidFire(game)
                },
                ultimate: {
                    name: 'Sniper Mode',
                    cooldown: 10000,
                    icon: '🎯',
                    execute: (game) => this.sniperMode(game)
                },
                color: '#FF6600'
            },
            'Zven': {
                primary: {
                    name: 'Healing Aura',
                    cooldown: 4000,
                    icon: '💚',
                    execute: (game) => this.healingAura(game)
                },
                ultimate: {
                    name: 'Team Buff',
                    cooldown: 12000,
                    icon: '✨',
                    execute: (game) => this.teamBuff(game)
                },
                color: '#00FF88'
            },
            'Fudge': {
                primary: {
                    name: 'Ground Slam',
                    cooldown: 3500,
                    icon: '💥',
                    execute: (game) => this.groundSlam(game)
                },
                ultimate: {
                    name: 'Tank Mode',
                    cooldown: 9000,
                    icon: '🛡️',
                    execute: (game) => this.tankMode(game)
                },
                color: '#4444FF'
            }
        };
        
        return abilities[championName] || abilities['Blaber'];
    }
    
    update(deltaTime, game) {
        const dt = deltaTime / 1000;
        
        // Handle input and movement
        this.handleInput(dt, game);
        
        // Apply physics
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Boundary collision
        if (this.x - this.size < 0) {
            this.x = this.size;
            this.vx = Math.abs(this.vx) * 0.3;
        }
        if (this.x + this.size > game.width) {
            this.x = game.width - this.size;
            this.vx = -Math.abs(this.vx) * 0.3;
        }
        if (this.y - this.size < 0) {
            this.y = this.size;
            this.vy = Math.abs(this.vy) * 0.3;
        }
        if (this.y + this.size > game.height) {
            this.y = game.height - this.size;
            this.vy = -Math.abs(this.vy) * 0.3;
        }
        
        // Update cooldowns
        this.abilityCooldowns.primary = Math.max(0, this.abilityCooldowns.primary - deltaTime);
        this.abilityCooldowns.ultimate = Math.max(0, this.abilityCooldowns.ultimate - deltaTime);
        this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
        
        // Update invulnerability
        if (this.invulnerable) {
            this.invulnerabilityTime -= deltaTime;
            if (this.invulnerabilityTime <= 0) {
                this.invulnerable = false;
            }
        }
        
        // Update effects
        this.effects = this.effects.filter(effect => {
            effect.duration -= deltaTime;
            return effect.duration > 0;
        });
        
        // Update animations
        this.animationFrame += deltaTime / 16;
        this.bounceOffset = Math.sin(this.animationFrame * 0.15) * 3;
        
        if (this.isMoving) {
            this.walkCycle += deltaTime * 0.015;
        }
        
        // Champion passives
        this.updatePassive(deltaTime);
        
        // Handle continuous attacking
        if (this.isAttacking && this.attackCooldown <= 0) {
            this.performAttack(game);
            this.attackCooldown = this.attackRate;
        }
        
        // Update ability UI
        this.updateAbilityUI();
    }
    
    handleInput(dt, game) {
        let inputX = 0, inputY = 0;
        
        // Movement input
        if (game.keys['KeyW'] || game.keys['ArrowUp']) inputY -= 1;
        if (game.keys['KeyS'] || game.keys['ArrowDown']) inputY += 1;
        if (game.keys['KeyA'] || game.keys['ArrowLeft']) inputX -= 1;
        if (game.keys['KeyD'] || game.keys['ArrowRight']) inputX += 1;
        
        // Normalize diagonal movement
        if (inputX !== 0 && inputY !== 0) {
            inputX *= 0.707;
            inputY *= 0.707;
        }
        
        this.isMoving = inputX !== 0 || inputY !== 0;
        
        // Apply speed modifiers
        let currentSpeed = this.speed;
        if (this.championName === 'Blaber') currentSpeed *= 1.4; // Blaber is fastest
        
        this.effects.forEach(effect => {
            if (effect.type === 'speed') currentSpeed *= effect.multiplier;
        });
        
        // Apply acceleration
        if (this.isMoving) {
            this.vx += inputX * this.acceleration * dt;
            this.vy += inputY * this.acceleration * dt;
            
            // Cap max speed
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > currentSpeed) {
                this.vx = (this.vx / speed) * currentSpeed;
                this.vy = (this.vy / speed) * currentSpeed;
            }
            
            // Update facing direction
            this.facing = Math.atan2(inputY, inputX);
        }
        
        // Abilities
        if (game.keys['Space'] && this.abilityCooldowns.primary <= 0) {
            this.useAbility('primary', game);
        }
        
        if (game.keys['ShiftLeft'] && this.abilityCooldowns.ultimate <= 0) {
            this.useAbility('ultimate', game);
        }
    }
    
    useAbility(type, game) {
        const ability = this.abilities[type];
        if (ability && this.abilityCooldowns[type] <= 0) {
            ability.execute(game);
            this.abilityCooldowns[type] = ability.cooldown;
        }
    }
    
    startAttacking() {
        this.isAttacking = true;
    }
    
    stopAttacking() {
        this.isAttacking = false;
    }
    
    performAttack(game) {
        const angle = Math.atan2(game.mouse.y - this.y, game.mouse.x - this.x);
        const projectileSpeed = 500;
        let damage = 35;
        
        // Champion-specific modifications
        if (this.championName === 'Berserker') damage = 45;
        else if (this.championName === 'Jojopyun') damage = 30;
        
        // Apply damage effects
        this.effects.forEach(effect => {
            if (effect.type === 'damage') damage *= effect.multiplier;
        });
        
        const projectile = new Projectile(
            this.x + Math.cos(angle) * this.size,
            this.y + Math.sin(angle) * this.size,
            Math.cos(angle) * projectileSpeed,
            Math.sin(angle) * projectileSpeed,
            damage, 'player', this.abilities.color
        );
        
        // Jojopyun's piercing passive
        if (this.championName === 'Jojopyun') {
            projectile.piercing = true;
        }
        
        game.projectiles.push(projectile);
        
        // Muzzle flash
        game.addParticles(
            this.x + Math.cos(angle) * this.size,
            this.y + Math.sin(angle) * this.size,
            this.abilities.color, 4
        );
    }
    
    // Champion Abilities
    lightningDash(game) {
        const dashDistance = 180;
        const angle = Math.atan2(game.mouse.y - this.y, game.mouse.x - this.x);
        
        this.x += Math.cos(angle) * dashDistance;
        this.y += Math.sin(angle) * dashDistance;
        
        game.addParticles(this.x, this.y, '#FFD700', 20);
        
        // Damage enemies in path
        game.enemies.forEach(enemy => {
            if (game.getDistance(this.x, this.y, enemy.x, enemy.y) < 60) {
                enemy.takeDamage(50);
                game.addParticles(enemy.x, enemy.y, '#FFD700', 10);
            }
        });
    }
    
    speedBoost(game) {
        this.effects.push({
            type: 'speed',
            multiplier: 2.2,
            duration: 4000
        });
        game.addParticles(this.x, this.y, '#FFD700', 25);
    }
    
    arcaneBlast(game) {
        const numProjectiles = 5;
        const spreadAngle = Math.PI / 2.5;
        const baseAngle = Math.atan2(game.mouse.y - this.y, game.mouse.x - this.x);
        
        for (let i = 0; i < numProjectiles; i++) {
            const angle = baseAngle + (i - 2) * (spreadAngle / 4);
            const projectile = new Projectile(
                this.x, this.y,
                Math.cos(angle) * 450,
                Math.sin(angle) * 450,
                40, 'player', '#9966FF'
            );
            projectile.piercing = true;
            game.projectiles.push(projectile);
        }
    }
    
    magicShield(game) {
        this.invulnerable = true;
        this.invulnerabilityTime = 2500;
        game.addParticles(this.x, this.y, '#9966FF', 30);
    }
    
    rapidFire(game) {
        const numShots = 10;
        const interval = 80;
        
        for (let i = 0; i < numShots; i++) {
            setTimeout(() => {
                if (this.health > 0) {
                    const projectile = this.performAttack(game);
                }
            }, i * interval);
        }
    }
    
    sniperMode(game) {
        this.effects.push({
            type: 'sniper',
            duration: 6000
        });
        
        const angle = Math.atan2(game.mouse.y - this.y, game.mouse.x - this.x);
        const projectile = new Projectile(
            this.x, this.y,
            Math.cos(angle) * 800,
            Math.sin(angle) * 800,
            120, 'player', '#FF6600'
        );
        projectile.piercing = true;
        projectile.size = 10;
        game.projectiles.push(projectile);
    }
    
    healingAura(game) {
        this.health = Math.min(this.maxHealth, this.health + 50);
        game.addParticles(this.x, this.y, '#00FF88', 25);
        
        this.effects.push({
            type: 'healing',
            duration: 4000,
            healPerSecond: 15
        });
    }
    
    teamBuff(game) {
        this.effects.push({
            type: 'damage',
            multiplier: 1.8,
            duration: 8000
        });
        this.effects.push({
            type: 'speed',
            multiplier: 1.5,
            duration: 8000
        });
        game.addParticles(this.x, this.y, '#00FF88', 35);
    }
    
    groundSlam(game) {
        const slamRadius = 120;
        
        game.enemies.forEach(enemy => {
            const distance = game.getDistance(this.x, this.y, enemy.x, enemy.y);
            if (distance < slamRadius) {
                const damage = 80 * (1 - distance / slamRadius);
                enemy.takeDamage(damage);
                
                // Knockback
                const angle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.x += Math.cos(angle) * 70;
                enemy.y += Math.sin(angle) * 70;
            }
        });
        
        game.addParticles(this.x, this.y, '#4444FF', 30);
    }
    
    tankMode(game) {
        this.effects.push({
            type: 'tank',
            damageReduction: 0.6,
            duration: 6000
        });
        this.maxHealth += 40;
        this.health += 40;
        game.addParticles(this.x, this.y, '#4444FF', 25);
    }
    
    updatePassive(deltaTime) {
        // Zven's healing passive
        if (this.championName === 'Zven') {
            this.health = Math.min(this.maxHealth, this.health + 8 * deltaTime / 1000);
        }
        
        // Fudge's tank passive
        if (this.championName === 'Fudge') {
            this.maxHealth = 140;
        }
        
        // Update effect-based healing
        this.effects.forEach(effect => {
            if (effect.type === 'healing') {
                this.health = Math.min(this.maxHealth, this.health + effect.healPerSecond * deltaTime / 1000);
            }
        });
    }
    
    takeDamage(amount) {
        if (this.invulnerable) return;
        
        let finalDamage = amount;
        this.effects.forEach(effect => {
            if (effect.type === 'tank') {
                finalDamage *= (1 - effect.damageReduction);
            }
        });
        
        this.health -= finalDamage;
        
        // Brief invulnerability
        this.invulnerable = true;
        this.invulnerabilityTime = 150;
        
        if (this.health <= 0) {
            this.health = 0;
        }
    }
    
    updateAbilityUI() {
        const ability1Cooldown = this.abilityCooldowns.primary / this.abilities.primary.cooldown;
        const ability2Cooldown = this.abilityCooldowns.ultimate / this.abilities.ultimate.cooldown;
        
        const cooldown1 = document.getElementById('cooldown1');
        const cooldown2 = document.getElementById('cooldown2');
        
        if (cooldown1) {
            cooldown1.style.transform = `scaleY(${ability1Cooldown})`;
        }
        if (cooldown2) {
            cooldown2.style.transform = `scaleY(${ability2Cooldown})`;
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Invulnerability flashing
        if (this.invulnerable && Math.floor(Date.now() / 80) % 2) {
            ctx.globalAlpha = 0.7;
        }
        
        // Champion glow
        ctx.shadowColor = this.abilities.color;
        ctx.shadowBlur = 18;
        
        const drawY = this.y + this.bounceOffset;
        
        // Main body with Cloud9 styling
        ctx.fillStyle = this.abilities.color;
        ctx.beginPath();
        ctx.arc(this.x, drawY, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(this.x - 4, drawY - 4, this.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute eyes
        ctx.fillStyle = this.c9White;
        ctx.beginPath();
        ctx.arc(this.x - 7, drawY - 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 7, drawY - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye pupils
        ctx.fillStyle = '#000000';
        const eyeOffsetX = Math.cos(this.facing) * 2;
        const eyeOffsetY = Math.sin(this.facing) * 2;
        ctx.beginPath();
        ctx.arc(this.x - 7 + eyeOffsetX, drawY - 5 + eyeOffsetY, 2.5, 0, Math.PI * 2);
        ctx.arc(this.x + 7 + eyeOffsetX, drawY - 5 + eyeOffsetY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Happy mouth when moving
        if (this.isMoving) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.x, drawY + 3, 5, 0, Math.PI);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(this.x, drawY + 5, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Champion initial
        ctx.fillStyle = this.c9White;
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(this.championName[0], this.x, drawY - 10);
        
        // Walking animation feet
        if (this.isMoving) {
            const footOffset = Math.sin(this.walkCycle) * 4;
            ctx.fillStyle = this.abilities.color;
            ctx.beginPath();
            ctx.arc(this.x - 10, drawY + this.size - 3 + footOffset, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 10, drawY + this.size - 3 - footOffset, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Health bar
        const barWidth = 40;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = drawY - this.size - 15;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = this.c9White;
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Effect indicators
        this.effects.forEach((effect, index) => {
            const effectY = drawY + this.size + 18 + (index * 14);
            const effectX = this.x + Math.sin(this.animationFrame * 0.08 + index) * 6;
            
            ctx.fillStyle = this.getEffectColor(effect.type);
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            
            const symbols = {
                'speed': '💨',
                'healing': '💚',
                'damage': '⚔️',
                'tank': '🛡️',
                'sniper': '🎯'
            };
            
            ctx.fillText(symbols[effect.type] || '✨', effectX, effectY);
        });
        
        ctx.restore();
    }
    
    getEffectColor(effectType) {
        const colors = {
            'speed': '#FFD700',
            'healing': '#00FF88',
            'damage': '#FF6600',
            'tank': '#4444FF',
            'sniper': '#FF0066'
        };
        return colors[effectType] || this.c9White;
    }
}
