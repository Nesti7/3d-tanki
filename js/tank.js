// Класс танка игрока
class PlayerTank {
    constructor(scene, type, arena) {
        this.scene = scene;
        this.arena = arena;
        this.type = type;
        this.isAlive = true;
        
        // Характеристики в зависимости от типа
        this.stats = this.getStatsForType(type);
        this.maxHealth = this.stats.health;
        this.health = this.maxHealth;
        this.speed = this.stats.speed;
        this.damage = this.stats.damage;
        this.fireRate = this.stats.fireRate;
        this.radius = 2.5;
        
        this.lastShotTime = 0;
        this.shootCooldown = 1 / this.fireRate;
        
        // Модификаторы от улучшений
        this.powerupMultipliers = {
            damage: 1,
            speed: 1,
            fireRate: 1
        };
        this.hasShield = false;
        this.tripleShot = false;
        this.tripleShotEndTime = 0;
        
        // Создание 3D модели
        this.group = new THREE.Group();
        this.createModel();
        
        this.group.position.set(0, 0, 0);
        scene.add(this.group);
    }
    
    getStatsForType(type) {
        const stats = {
            light: {
                health: 800,
                speed: 15,
                damage: 25,
                fireRate: 2.5,
                color: 0x00BFFF
            },
            medium: {
                health: 1200,
                speed: 10,
                damage: 30,
                fireRate: 2,
                color: 0x32CD32
            },
            heavy: {
                health: 1800,
                speed: 7,
                damage: 40,
                fireRate: 1.5,
                color: 0xFF4500
            }
        };
        
        return stats[type] || stats.medium;
    }
    
    createModel() {
        // Корпус танка
        const bodyGeometry = new THREE.BoxGeometry(4, 1.5, 5);
        const bodyMaterial = new THREE.MeshBasicMaterial({ color: this.stats.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        this.group.add(body);
        
        // Башня
        const turretGeometry = new THREE.BoxGeometry(2.5, 1.2, 2.5);
        const turretMaterial = new THREE.MeshBasicMaterial({ 
            color: this.darkenColor(this.stats.color, 0.7)
        });
        this.turret = new THREE.Mesh(turretGeometry, turretMaterial);
        this.turret.position.y = 2;
        this.group.add(this.turret);
        
        // Пушка
        const barrelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        this.barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        this.barrel.rotation.z = Math.PI / 2;
        this.barrel.position.set(1.5, 0, 0);
        this.turret.add(this.barrel);
        
        // Гусеницы (декоративные)
        const trackGeometry = new THREE.BoxGeometry(3, 1, 5.5);
        const trackMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        
        const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        leftTrack.position.set(-2.2, 0.5, 0);
        this.group.add(leftTrack);
        
        const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        rightTrack.position.set(2.2, 0.5, 0);
        this.group.add(rightTrack);
        
        // Щит (если активен)
        this.createShield();
    }
    
    createShield() {
        if (this.shieldMesh) {
            this.turret.remove(this.shieldMesh);
        }
        
        if (this.hasShield) {
            const shieldGeometry = new THREE.SphereGeometry(4, 16, 16);
            const shieldMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.3,
                wireframe: true
            });
            this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
            this.group.add(this.shieldMesh);
        }
    }
    
    darkenColor(color, factor) {
        const c = new THREE.Color(color);
        return c.multiplyScalar(factor).getHex();
    }
    
    update(deltaTime, controls) {
        if (!this.isAlive) return;
        
        const moveSpeed = this.speed * this.powerupMultipliers.speed;
        const oldPosition = this.group.position.clone();

        // Движение (WASD + стрелки)
        if (controls.isForward() || controls.isForwardAlt()) {
            this.group.position.z -= moveSpeed * deltaTime;
        }
        if (controls.isBackward() || controls.isBackwardAlt()) {
            this.group.position.z += moveSpeed * deltaTime * 0.6; // Назад медленнее
        }
        if (controls.isLeft() || controls.isLeftAlt()) {
            this.group.position.x -= moveSpeed * deltaTime;
        }
        if (controls.isRight() || controls.isRightAlt()) {
            this.group.position.x += moveSpeed * deltaTime;
        }
        
        // Проверка столкновений
        if (this.arena.checkCollision(this.group.position, this.radius)) {
            this.group.position.copy(oldPosition);
        }
        
        // Поворот башни к мыши
        this.rotateTurretToMouse(controls.getMousePosition());
        
        // Обновление тройного выстрела
        if (this.tripleShot && Date.now() > this.tripleShotEndTime) {
            this.tripleShot = false;
        }
    }
    
    rotateTurretToMouse(mousePos) {
        // Конвертация позиции мыши в world coordinates
        const vector = new THREE.Vector3(mousePos.x, mousePos.y, 0.5);
        vector.unproject(window.game.camera);
        
        const dir = vector.sub(window.game.camera.position).normalize();
        const distance = -window.game.camera.position.y / dir.y;
        const pos = window.game.camera.position.clone().add(dir.multiplyScalar(distance));
        
        // Вычисляем разницу между позицией курсора и танком
        const dx = pos.x - this.group.position.x;
        const dz = pos.z - this.group.position.z;
        
        // Вычисляем угол с компенсацией начальной ориентации
        // Пушка изначально направлена по оси X, поэтому добавляем PI/2
        const angle = Math.atan2(dx, dz) - Math.PI / 2;
        
        this.turret.rotation.y = angle;
    }
    
    canShoot() {
        const currentTime = Date.now() / 1000;
        const cooldown = this.shootCooldown / this.powerupMultipliers.fireRate;
        return currentTime - this.lastShotTime >= cooldown;
    }
    
    shoot() {
        if (!this.canShoot()) return null;
        
        this.lastShotTime = Date.now() / 1000;
        
        const barrelEndPos = new THREE.Vector3();
        this.barrel.getWorldPosition(barrelEndPos);
        
        // Вычисляем направление на основе угла поворота башни
        // Добавляем PI/2 для компенсации начальной ориентации пушки
        const angle = this.turret.rotation.y + Math.PI / 2;
        const direction = new THREE.Vector3(
            Math.sin(angle),
            0,
            Math.cos(angle)
        ).normalize();
        
        const damage = this.damage * this.powerupMultipliers.damage;
        
        // Отдача пушки (визуальный эффект)
        this.barrel.position.x = 1.2;
        setTimeout(() => {
            if (this.barrel) this.barrel.position.x = 1.5;
        }, 100);
        
        if (this.tripleShot) {
            // Тройной выстрел
            const projectiles = [];
            
            // Центральный снаряд
            projectiles.push(new Projectile(
                this.scene, 
                barrelEndPos, 
                direction, 
                'player', 
                damage
            ));
            
            // Левый снаряд
            const leftDir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.2);
            projectiles.push(new Projectile(
                this.scene, 
                barrelEndPos, 
                leftDir, 
                'player', 
                damage
            ));
            
            // Правый снаряд
            const rightDir = direction.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.2);
            projectiles.push(new Projectile(
                this.scene, 
                barrelEndPos, 
                rightDir, 
                'player', 
                damage
            ));
            
            // Добавляем все снаряды в игру
            if (window.game) {
                window.game.projectiles.push(projectiles[1]);
                window.game.projectiles.push(projectiles[2]);
            }
            
            return projectiles[0];
        } else {
            // Обычный выстрел
            return new Projectile(this.scene, barrelEndPos, direction, 'player', damage);
        }
    }
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        if (this.hasShield) {
            // Щит поглощает урон
            this.hasShield = false;
            this.createShield();
            return;
        }
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }
    
    die() {
        this.isAlive = false;
        
        // Визуальный эффект смерти (затемнение)
        this.group.traverse((child) => {
            if (child.material) {
                child.material.color.multiplyScalar(0.3);
            }
        });
    }
}

