// Система улучшений (powerups)
class Powerup {
    constructor(scene, x, z) {
        this.scene = scene;
        this.isActive = true;
        this.lifetime = 10; // секунды
        this.age = 0;
        this.rotationSpeed = 2;
        
        // Случайный тип улучшения
        this.types = ['health', 'damage', 'speed', 'shield', 'triple_shot'];
        this.type = this.types[Math.floor(Math.random() * this.types.length)];
        
        // Создание визуала
        this.createModel(x, z);
    }
    
    createModel(x, z) {
        const config = this.getConfigForType();
        
        // Основная геометрия - куб или звезда
        let geometry;
        if (this.type === 'shield') {
            geometry = new THREE.OctahedronGeometry(1, 0);
        } else if (this.type === 'triple_shot') {
            geometry = new THREE.TetrahedronGeometry(1, 0);
        } else {
            geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        }
        
        const material = new THREE.MeshBasicMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 1.5, z);
        
        // Добавление свечения (внешняя оболочка)
        const glowGeometry = geometry.clone();
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: config.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glow.scale.set(1.3, 1.3, 1.3);
        this.mesh.add(this.glow);
        
        this.scene.add(this.mesh);
    }
    
    getConfigForType() {
        const configs = {
            health: {
                color: 0x00FF00,
                name: '💚 Восстановление здоровья!'
            },
            damage: {
                color: 0xFF4500,
                name: '💥 Увеличение урона!'
            },
            speed: {
                color: 0x00BFFF,
                name: '⚡ Увеличение скорости!'
            },
            shield: {
                color: 0x00FFFF,
                name: '🛡️ Защитный щит!'
            },
            triple_shot: {
                color: 0xFFD700,
                name: '🎯 Тройной выстрел!'
            }
        };
        
        return configs[this.type];
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Вращение
        this.mesh.rotation.y += this.rotationSpeed * deltaTime;
        this.mesh.rotation.x += this.rotationSpeed * deltaTime * 0.5;
        
        // Пульсация
        const scale = 1 + Math.sin(this.age * 3) * 0.1;
        this.mesh.scale.set(scale, scale, scale);
        
        // Вертикальное движение (левитация)
        this.mesh.position.y = 1.5 + Math.sin(this.age * 2) * 0.3;
        
        // Увеличение возраста
        this.age += deltaTime;
        
        // Исчезновение со временем
        if (this.age >= this.lifetime) {
            this.isActive = false;
        }
        
        // Эффект исчезновения в последние 2 секунды
        if (this.age >= this.lifetime - 2) {
            const fadeProgress = (this.lifetime - this.age) / 2;
            this.mesh.material.opacity = 0.8 * fadeProgress;
            this.glow.material.opacity = 0.3 * fadeProgress;
        }
    }
    
    apply(player) {
        switch (this.type) {
            case 'health':
                // Восстановление 50 HP
                player.heal(50);
                break;
                
            case 'damage':
                // Увеличение урона на 50% на 15 секунд
                player.powerupMultipliers.damage *= 1.5;
                setTimeout(() => {
                    player.powerupMultipliers.damage /= 1.5;
                }, 15000);
                break;
                
            case 'speed':
                // Увеличение скорости на 50% на 15 секунд
                player.powerupMultipliers.speed *= 1.5;
                setTimeout(() => {
                    player.powerupMultipliers.speed /= 1.5;
                }, 15000);
                break;
                
            case 'shield':
                // Щит, блокирующий один удар
                player.hasShield = true;
                player.createShield();
                break;
                
            case 'triple_shot':
                // Тройной выстрел на 10 секунд
                player.tripleShot = true;
                player.tripleShotEndTime = Date.now() + 10000;
                
                // Увеличение скорострельности для баланса
                player.powerupMultipliers.fireRate *= 1.3;
                setTimeout(() => {
                    player.powerupMultipliers.fireRate /= 1.3;
                }, 10000);
                break;
        }
    }
    
    getDisplayName() {
        return this.getConfigForType().name;
    }
}

