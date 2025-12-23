// Класс вражеского танка
class EnemyTank {
    constructor(scene, type, x, z, arena) {
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
        this.scoreValue = this.stats.scoreValue;
        this.radius = 2.5;
        
        this.lastShotTime = 0;
        this.shootCooldown = 1 / this.fireRate;
        
        // AI параметры
        this.attackRange = 25;
        this.optimalDistance = 15;
        this.state = 'approach'; // approach, attack, retreat
        this.stateChangeTimer = 0;
        this.wanderAngle = Math.random() * Math.PI * 2;
        
        // Создание 3D модели
        this.group = new THREE.Group();
        this.createModel();
        
        this.group.position.set(x, 0, z);
        scene.add(this.group);
    }
    
    getStatsForType(type) {
        const stats = {
            light: {
                health: 50,
                speed: 8,
                damage: 10, // Снижено с 15 до 10
                fireRate: 1.2, // Снижено с 1.5 до 1.2
                color: 0xFF6B6B,
                scoreValue: 100
            },
            medium: {
                health: 80,
                speed: 6,
                damage: 15, // Снижено с 20 до 15
                fireRate: 1.0, // Снижено с 1.2 до 1.0
                color: 0xFF4444,
                scoreValue: 200
            },
            heavy: {
                health: 120,
                speed: 4,
                damage: 22, // Снижено с 30 до 22
                fireRate: 0.7, // Снижено с 0.8 до 0.7
                color: 0xFF0000,
                scoreValue: 300
            }
        };
        
        return stats[type] || stats.light;
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
        
        // Гусеницы
        const trackGeometry = new THREE.BoxGeometry(3, 1, 5.5);
        const trackMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        
        const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        leftTrack.position.set(-2.2, 0.5, 0);
        this.group.add(leftTrack);
        
        const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
        rightTrack.position.set(2.2, 0.5, 0);
        this.group.add(rightTrack);
        
        // Полоска здоровья над танком
        this.createHealthBar();
    }
    
    createHealthBar() {
        const width = 4;
        const height = 0.3;
        
        // Фон полоски здоровья
        const bgGeometry = new THREE.PlaneGeometry(width, height);
        const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x330000 });
        this.healthBarBg = new THREE.Mesh(bgGeometry, bgMaterial);
        this.healthBarBg.position.y = 4;
        this.healthBarBg.rotation.x = -Math.PI / 4;
        this.group.add(this.healthBarBg);
        
        // Полоска здоровья
        const barGeometry = new THREE.PlaneGeometry(width, height);
        const barMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
        this.healthBar = new THREE.Mesh(barGeometry, barMaterial);
        this.healthBar.position.y = 4.01;
        this.healthBar.rotation.x = -Math.PI / 4;
        this.group.add(this.healthBar);
    }
    
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;
        this.healthBar.scale.x = healthPercent;
        this.healthBar.position.x = -(1 - healthPercent) * 2;
    }
    
    darkenColor(color, factor) {
        const c = new THREE.Color(color);
        return c.multiplyScalar(factor).getHex();
    }
    
    update(deltaTime, playerPosition) {
        if (!this.isAlive) return;
        
        const distanceToPlayer = this.group.position.distanceTo(playerPosition);
        
        // Простой AI
        this.updateAI(deltaTime, playerPosition, distanceToPlayer);
        
        // Поворот башни к игроку
        this.rotateTurretToTarget(playerPosition);
        
        // Обновление полоски здоровья
        this.updateHealthBar();
    }
    
    updateAI(deltaTime, playerPosition, distanceToPlayer) {
        const oldPosition = this.group.position.clone();
        
        // Смена состояния периодически для разнообразия
        this.stateChangeTimer += deltaTime;
        if (this.stateChangeTimer > 3) {
            this.stateChangeTimer = 0;
            
            if (distanceToPlayer > this.attackRange) {
                this.state = 'approach';
            } else if (distanceToPlayer < this.optimalDistance * 0.7) {
                this.state = 'retreat';
            } else {
                this.state = Math.random() > 0.5 ? 'attack' : 'strafe';
            }
            
            // Новый случайный угол для стрейфа
            this.wanderAngle = Math.random() * Math.PI * 2;
        }
        
        // Поведение в зависимости от состояния
        switch (this.state) {
            case 'approach':
                // Двигаться к игроку
                this.moveTowards(playerPosition, deltaTime);
                break;
                
            case 'retreat':
                // Отступать от игрока
                this.moveAway(playerPosition, deltaTime);
                break;
                
            case 'strafe':
                // Двигаться по кругу вокруг игрока
                this.strafe(playerPosition, deltaTime);
                break;
                
            case 'attack':
                // Стоять и стрелять (небольшое движение для уклонения)
                if (Math.random() < 0.3) {
                    const dodgeDir = new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        0,
                        (Math.random() - 0.5) * 2
                    ).normalize();
                    
                    this.group.position.x += dodgeDir.x * this.speed * deltaTime * 0.5;
                    this.group.position.z += dodgeDir.z * this.speed * deltaTime * 0.5;
                }
                break;
        }
        
        // Проверка столкновений
        if (this.arena.checkCollision(this.group.position, this.radius)) {
            this.group.position.copy(oldPosition);
            // Сменить направление при столкновении
            this.wanderAngle = Math.random() * Math.PI * 2;
            this.state = 'strafe';
        }
    }
    
    moveTowards(targetPos, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.group.position)
            .normalize();
        
        this.group.position.x += direction.x * this.speed * deltaTime;
        this.group.position.z += direction.z * this.speed * deltaTime;
    }
    
    moveAway(targetPos, deltaTime) {
        const direction = new THREE.Vector3()
            .subVectors(this.group.position, targetPos)
            .normalize();
        
        this.group.position.x += direction.x * this.speed * deltaTime;
        this.group.position.z += direction.z * this.speed * deltaTime;
    }
    
    strafe(targetPos, deltaTime) {
        const dirToPlayer = new THREE.Vector3()
            .subVectors(targetPos, this.group.position)
            .normalize();
        
        // Перпендикулярное направление
        const strafeDir = new THREE.Vector3(-dirToPlayer.z, 0, dirToPlayer.x);
        
        // Добавить немного движения к игроку
        const moveDir = dirToPlayer.multiplyScalar(0.3).add(strafeDir);
        
        this.group.position.x += moveDir.x * this.speed * deltaTime;
        this.group.position.z += moveDir.z * this.speed * deltaTime;
    }
    
    rotateTurretToTarget(targetPos) {
        const dx = targetPos.x - this.group.position.x;
        const dz = targetPos.z - this.group.position.z;
        
        // Добавляем компенсацию для правильной ориентации
        const angle = Math.atan2(dx, dz) - Math.PI / 2;
        
        this.turret.rotation.y = angle;
    }
    
    canShoot() {
        const currentTime = Date.now() / 1000;
        return currentTime - this.lastShotTime >= this.shootCooldown;
    }
    
    shoot(targetPos) {
        if (!this.canShoot()) return null;
        
        // Увеличенный шанс промахнуться для баланса
        if (Math.random() < 0.35) return null; // Увеличено с 0.2 до 0.35
        
        this.lastShotTime = Date.now() / 1000;
        
        const barrelEndPos = new THREE.Vector3();
        this.barrel.getWorldPosition(barrelEndPos);
        
        // Направление к игроку с небольшой неточностью
        const direction = new THREE.Vector3()
            .subVectors(targetPos, this.group.position)
            .normalize();
        
        // Добавить неточность для баланса
        const inaccuracy = 0.2; // Увеличено с 0.1 до 0.2
        direction.x += (Math.random() - 0.5) * inaccuracy;
        direction.z += (Math.random() - 0.5) * inaccuracy;
        direction.normalize();
        
        return new Projectile(this.scene, barrelEndPos, direction, 'enemy', this.damage, 35);
    }
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        this.health -= amount;
        
        // Визуальная реакция на урон
        this.flashDamage();
        
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }
    
    flashDamage() {
        // Кратковременное изменение цвета при получении урона
        this.group.traverse((child) => {
            if (child.material && child !== this.healthBar && child !== this.healthBarBg) {
                const originalColor = child.material.color.clone();
                child.material.color.set(0xFFFFFF);
                
                setTimeout(() => {
                    child.material.color.copy(originalColor);
                }, 100);
            }
        });
    }
    
    die() {
        this.isAlive = false;
        
        // Визуальный эффект смерти
        this.group.traverse((child) => {
            if (child.material) {
                child.material.color.multiplyScalar(0.3);
            }
        });
        
        // Анимация исчезновения
        const fadeOut = () => {
            this.group.position.y -= 0.05;
            if (this.group.position.y > -5) {
                requestAnimationFrame(fadeOut);
            }
        };
        setTimeout(fadeOut, 500);
    }
}

