// Генератор арены
class Arena {
    constructor(scene, size = 150) { // Увеличено со 100 до 150
        this.scene = scene;
        this.size = size;
        this.obstacles = [];
        
        this.createArena();
    }
    
    createArena() {
        // Пол арены
        const floorGeometry = new THREE.PlaneGeometry(this.size, this.size);
        const floorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x228B22,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
        
        // Стены арены
        this.createWalls();
        
        // Препятствия
        this.createObstacles();
    }
    
    createWalls() {
        const wallHeight = 5;
        const wallThickness = 2;
        const wallMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        
        // Северная стена
        const northWall = this.createWall(
            this.size, wallHeight, wallThickness,
            0, wallHeight / 2, -this.size / 2,
            wallMaterial
        );
        
        // Южная стена
        const southWall = this.createWall(
            this.size, wallHeight, wallThickness,
            0, wallHeight / 2, this.size / 2,
            wallMaterial
        );
        
        // Западная стена
        const westWall = this.createWall(
            wallThickness, wallHeight, this.size,
            -this.size / 2, wallHeight / 2, 0,
            wallMaterial
        );
        
        // Восточная стена
        const eastWall = this.createWall(
            wallThickness, wallHeight, this.size,
            this.size / 2, wallHeight / 2, 0,
            wallMaterial
        );
    }
    
    createWall(width, height, depth, x, y, z, material) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const wall = new THREE.Mesh(geometry, material);
        wall.position.set(x, y, z);
        wall.userData.isWall = true;
        this.scene.add(wall);
        return wall;
    }
    
    createObstacles() {
        const obstacleCount = 12; // Увеличено с 8 до 12 для большей карты
        const obstacleSize = 5;
        const minDistance = 20; // Увеличено с 15 до 20
        
        for (let i = 0; i < obstacleCount; i++) {
            let x, z;
            let attempts = 0;
            
            // Генерируем позицию вдали от центра
            do {
                x = (Math.random() - 0.5) * (this.size - 20);
                z = (Math.random() - 0.5) * (this.size - 20);
                attempts++;
            } while (Math.sqrt(x * x + z * z) < minDistance && attempts < 50);
            
            // Случайная высота и размер
            const height = 3 + Math.random() * 4;
            const width = obstacleSize + Math.random() * 3;
            const depth = obstacleSize + Math.random() * 3;
            
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color().setHSL(Math.random() * 0.1, 0.5, 0.4)
            });
            
            const obstacle = new THREE.Mesh(geometry, material);
            obstacle.position.set(x, height / 2, z);
            obstacle.userData.isObstacle = true;
            obstacle.userData.width = width;
            obstacle.userData.depth = depth;
            
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }
    
    checkCollision(position, radius) {
        // Проверка столкновения со стенами
        const halfSize = this.size / 2 - 2;
        if (Math.abs(position.x) > halfSize - radius ||
            Math.abs(position.z) > halfSize - radius) {
            return true;
        }
        
        // Проверка столкновения с препятствиями
        for (const obstacle of this.obstacles) {
            const dx = Math.abs(position.x - obstacle.position.x);
            const dz = Math.abs(position.z - obstacle.position.z);
            
            const halfWidth = obstacle.userData.width / 2 + radius;
            const halfDepth = obstacle.userData.depth / 2 + radius;
            
            if (dx < halfWidth && dz < halfDepth) {
                return true;
            }
        }
        
        return false;
    }
    
    getSize() {
        return this.size;
    }
}

