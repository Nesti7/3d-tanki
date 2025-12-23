// Основной игровой движок
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.arena = null;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.sound = null;
        
        this.state = 'menu'; // menu, playing, paused, gameover
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        this.enemiesInWave = 0;
        this.enemiesKilledInWave = 0;
        this.maxEnemies = 8; // Максимум врагов одновременно на экране

        this.selectedTankType = 'medium';
        
        this.clock = new THREE.Clock();
        this.lastTime = 0;

        // Камера: углы для поворота
        this.cameraAngle = 0; // Горизонтальный угол камеры
        this.cameraDistance = 30; // Расстояние до танка
        this.cameraHeight = 25; // Высота камеры

        this.init();
    }
    
    init() {
        // Three.js сцена
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 150);
        
        // Камера
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: false // Оптимизация
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Ограничение для производительности
        
        // Освещение (простое для производительности)
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
        
        // Контроллы
        this.controls = new Controls();
        
        // Звуковая система
        this.sound = new SoundSystem();
        
        // Арена (размер 150 для большего пространства)
        this.arena = new Arena(this.scene, 150);
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => this.onWindowResize());
        
        // UI Manager
        this.ui = new UI(this);
        
        // Запуск игрового цикла
        this.animate();
    }
    
    startGame(tankType) {
        this.selectedTankType = tankType;
        this.state = 'playing';
        this.score = 0;
        this.wave = 1;
        this.kills = 0;
        
        // Очистка предыдущей игры
        this.cleanup();
        
        // Создание игрока
        this.player = new PlayerTank(this.scene, tankType, this.arena);
        
        // Позиция камеры
        this.updateCamera();
        
        // Первая волна
        this.startWave();
        
        // Обновление UI
        this.ui.updateHUD();
    }
    
    startWave() {
        this.enemiesInWave = 3 + this.wave * 2; // Увеличение с каждой волной
        this.enemiesInWave = Math.min(this.enemiesInWave, 10); // Максимум 10
        this.enemiesKilledInWave = 0;
        this.enemiesSpawned = 0;
        
        // Показать сообщение о волне
        this.ui.showWaveMessage(`ВОЛНА ${this.wave}`);
        
        // Спавн врагов с задержкой
        setTimeout(() => {
            this.spawnEnemies();
        }, 2000);
    }
    
    spawnEnemies() {
        this.enemiesSpawned = 0; // Счетчик спавненных врагов в этой волне
        this.scheduleNextEnemySpawn();
    }

    scheduleNextEnemySpawn() {
        // Не спавнить больше врагов, чем максимум одновременно
        if (this.enemies.length >= this.maxEnemies) {
            return;
        }

        // Если все враги волны уже спавнены, завершить
        if (this.enemiesSpawned >= this.enemiesInWave) {
            return;
        }

        // Спавнить следующего врага через 1-2 секунды
        const spawnDelay = 1000 + Math.random() * 1000;
        setTimeout(() => {
            this.spawnSingleEnemy();
            this.scheduleNextEnemySpawn(); // Запланировать следующего
        }, spawnDelay);
    }

    spawnSingleEnemy() {
        const arenaSize = this.arena.getSize();
        const spawnDistance = 50; // Увеличено с 30 до 50 для большей арены

        // Спавн по краям арены
        const angle = (this.enemiesSpawned / this.enemiesInWave) * Math.PI * 2;
        const x = Math.cos(angle) * spawnDistance;
        const z = Math.sin(angle) * spawnDistance;

        // Определяем тип танка врага в зависимости от волны
        let enemyType = 'light';
        if (this.wave >= 3) {
            enemyType = Math.random() > 0.7 ? 'medium' : 'light';
        }
        if (this.wave >= 5) {
            const rand = Math.random();
            if (rand > 0.8) enemyType = 'heavy';
            else if (rand > 0.5) enemyType = 'medium';
        }

        const enemy = new EnemyTank(this.scene, enemyType, x, z, this.arena);
        this.enemies.push(enemy);
        this.enemiesSpawned++;

        this.ui.updateHUD();
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Обновление игрока
        if (this.player && this.player.isAlive) {
            this.player.update(deltaTime, this.controls);
            
            // Стрельба
            if (this.controls.isShoot() && this.player.canShoot()) {
                const projectile = this.player.shoot();
                if (projectile) {
                    this.projectiles.push(projectile);
                    this.sound.playShoot();
                }
            }
        } else if (this.player && !this.player.isAlive) {
            // Game Over
            this.gameOver();
            return;
        }
        
        // Обновление врагов
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (!enemy.isAlive) {
                // Враг уничтожен
                this.scene.remove(enemy.group);
                this.enemies.splice(i, 1);
                this.enemiesKilledInWave++;
                this.kills++;
                this.score += enemy.scoreValue;
                
                // Шанс выпадения улучшения
                if (Math.random() < 0.3) {
                    const powerup = new Powerup(this.scene, enemy.group.position.x, enemy.group.position.z);
                    this.powerups.push(powerup);
                }
                
                continue;
            }
            
            enemy.update(deltaTime, this.player.group.position);
            
            // Стрельба врага
            if (enemy.canShoot()) {
                const projectile = enemy.shoot(this.player.group.position);
                if (projectile) {
                    this.projectiles.push(projectile);
                }
            }
        }
        
        // Обновление снарядов
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaTime);
            
            // Удаление устаревших снарядов
            if (!projectile.isActive) {
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Проверка столкновений
            this.checkProjectileCollisions(projectile, i);
        }
        
        // Обновление улучшений
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.update(deltaTime);
            
            if (!powerup.isActive) {
                this.scene.remove(powerup.mesh);
                this.powerups.splice(i, 1);
                continue;
            }
            
            // Проверка подбора игроком
            const dist = powerup.mesh.position.distanceTo(this.player.group.position);
            if (dist < 3) {
                powerup.apply(this.player);
                this.ui.showPowerupMessage(powerup.getDisplayName());
                this.sound.playPowerup();
                this.scene.remove(powerup.mesh);
                this.powerups.splice(i, 1);
            }
        }
        
        // Проверка завершения волны
        if (this.enemiesKilledInWave >= this.enemiesInWave && this.enemies.length === 0) {
            this.wave++;
            setTimeout(() => {
                this.startWave();
            }, 3000);
        }
        
        // Обновление камеры
        this.updateCamera();

        // Поворот камеры правой кнопкой мыши
        if (this.controls.isRightMouseDown()) {
            const mouseMovement = this.controls.getMouseMovement();
            const sensitivity = 0.002; // Чувствительность поворота
            this.cameraAngle -= mouseMovement.x * sensitivity;
        }
        
        // Обновление UI
        this.ui.updateHUD();
    }
    
    checkProjectileCollisions(projectile, index) {
        const pos = projectile.mesh.position;
        
        // Столкновение с игроком (вражеские снаряды)
        if (projectile.owner !== 'player' && this.player && this.player.isAlive) {
            const dist = pos.distanceTo(this.player.group.position);
            if (dist < 3) {
                this.player.takeDamage(projectile.damage);
                this.createExplosion(pos, 0xFF0000);
                this.sound.playHit();
                this.scene.remove(projectile.mesh);
                this.projectiles.splice(index, 1);
                return;
            }
        }
        
        // Столкновение с врагами (снаряды игрока)
        if (projectile.owner === 'player') {
            for (const enemy of this.enemies) {
                if (!enemy.isAlive) continue;
                
                const dist = pos.distanceTo(enemy.group.position);
                if (dist < 3) {
                    enemy.takeDamage(projectile.damage);
                    this.createExplosion(pos, 0xFFA500);
                    this.sound.playExplosion();
                    this.scene.remove(projectile.mesh);
                    this.projectiles.splice(index, 1);
                    return;
                }
            }
        }
    }
    
    createExplosion(position, color) {
        // Создание простого эффекта взрыва
        const particleCount = 8;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.2, 4, 4);
            const material = new THREE.MeshBasicMaterial({ color: color });
            const particle = new THREE.Mesh(geometry, material);
            
            particle.position.copy(position);
            
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 5 + Math.random() * 5;
            particle.velocity = new THREE.Vector3(
                Math.cos(angle) * speed,
                Math.random() * 3 + 2,
                Math.sin(angle) * speed
            );
            
            particle.lifetime = 0.5;
            particle.age = 0;
            
            particles.push(particle);
            this.scene.add(particle);
        }
        
        // Анимация частиц
        const animateParticles = () => {
            let allDead = true;
            
            for (const particle of particles) {
                particle.age += 0.016;
                
                if (particle.age < particle.lifetime) {
                    allDead = false;
                    
                    particle.position.x += particle.velocity.x * 0.016;
                    particle.position.y += particle.velocity.y * 0.016;
                    particle.position.z += particle.velocity.z * 0.016;
                    
                    particle.velocity.y -= 9.8 * 0.016; // Гравитация
                    
                    const opacity = 1 - (particle.age / particle.lifetime);
                    particle.material.opacity = opacity;
                    particle.material.transparent = true;
                }
            }
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            } else {
                for (const particle of particles) {
                    this.scene.remove(particle);
                }
            }
        };
        
        animateParticles();
    }
    
    updateCamera() {
        if (!this.player) return;

        const playerPos = this.player.group.position;

        // Позиция камеры относительно танка с поворотом
        const cameraX = playerPos.x + Math.sin(this.cameraAngle) * this.cameraDistance;
        const cameraZ = playerPos.z + Math.cos(this.cameraAngle) * this.cameraDistance;
        const cameraY = playerPos.y + this.cameraHeight;

        this.camera.position.set(cameraX, cameraY, cameraZ);
        this.camera.lookAt(playerPos.x, playerPos.y, playerPos.z);
    }
    
    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.ui.showPauseMenu();
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.ui.hidePauseMenu();
        }
    }
    
    gameOver() {
        this.state = 'gameover';
        
        this.sound.playGameOver();
        
        // Сохранение лучшего результата
        const bestScore = localStorage.getItem('bestScore') || 0;
        if (this.score > bestScore) {
            localStorage.setItem('bestScore', this.score);
        }
        
        this.ui.showGameOver();
    }
    
    cleanup() {
        // Очистка всех объектов
        if (this.player) {
            this.scene.remove(this.player.group);
            this.player = null;
        }
        
        for (const enemy of this.enemies) {
            this.scene.remove(enemy.group);
        }
        this.enemies = [];
        
        for (const projectile of this.projectiles) {
            this.scene.remove(projectile.mesh);
        }
        this.projectiles = [];
        
        for (const powerup of this.powerups) {
            this.scene.remove(powerup.mesh);
        }
        this.powerups = [];
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Глобальная переменная для доступа из других модулей
window.game = null;

