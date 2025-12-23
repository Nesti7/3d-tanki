// Класс снарядов
class Projectile {
    constructor(scene, startPos, direction, owner, damage = 20, speed = 40) {
        this.scene = scene;
        this.owner = owner; // 'player' или 'enemy'
        this.damage = damage;
        this.speed = speed;
        this.isActive = true;
        this.lifetime = 5; // секунды
        this.age = 0;
        
        // Создание визуала снаряда
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: owner === 'player' ? 0xFFFF00 : 0xFF0000
        });
        this.mesh = new THREE.Mesh(geometry, material);
        
        this.mesh.position.copy(startPos);
        this.mesh.position.y = 1.5; // Высота снаряда
        
        this.direction = direction.clone().normalize();
        
        scene.add(this.mesh);
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Движение снаряда
        this.mesh.position.x += this.direction.x * this.speed * deltaTime;
        this.mesh.position.z += this.direction.z * this.speed * deltaTime;
        
        // Увеличение возраста
        this.age += deltaTime;
        
        // Деактивация по времени
        if (this.age >= this.lifetime) {
            this.isActive = false;
        }
    }
    
    destroy() {
        this.isActive = false;
    }
}

