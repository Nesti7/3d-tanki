// Система управления
class Controls {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            isDown: false,
            rightButtonDown: false,
            movementX: 0,
            movementY: 0
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Пауза на Escape
            if (e.code === 'Escape' && window.game && window.game.state === 'playing') {
                window.game.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Мышь
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Отслеживаем движение мыши при зажатой правой кнопке
            if (this.mouse.rightButtonDown) {
                this.mouse.movementX += e.movementX || 0;
                this.mouse.movementY += e.movementY || 0;
            }
        });

        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Левая кнопка
                this.mouse.isDown = true;
            } else if (e.button === 2) { // Правая кнопка
                this.mouse.rightButtonDown = true;
                this.mouse.movementX = 0;
                this.mouse.movementY = 0;
                // Захватываем курсор для поворота камеры
                document.body.requestPointerLock();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.isDown = false;
            } else if (e.button === 2) { // Правая кнопка
                this.mouse.rightButtonDown = false;
                // Освобождаем курсор
                if (document.pointerLockElement === document.body) {
                    document.exitPointerLock();
                }
            }
        });
        
        // Блокировка контекстного меню
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] === true;
    }
    
    isForward() {
        return this.isKeyPressed('KeyW');
    }
    
    isBackward() {
        return this.isKeyPressed('KeyS');
    }
    
    isLeft() {
        return this.isKeyPressed('KeyA');
    }
    
    isRight() {
        return this.isKeyPressed('KeyD');
    }

    // Стрелки клавиатуры
    isArrowUp() {
        return this.isKeyPressed('ArrowUp');
    }

    isArrowDown() {
        return this.isKeyPressed('ArrowDown');
    }

    isArrowLeft() {
        return this.isKeyPressed('ArrowLeft');
    }

    isArrowRight() {
        return this.isKeyPressed('ArrowRight');
    }

    isShoot() {
        return this.isKeyPressed('Space') || this.mouse.isDown;
    }

    // Альтернативное управление (стрелки)
    isForwardAlt() {
        return this.isArrowUp();
    }

    isBackwardAlt() {
        return this.isArrowDown();
    }

    isLeftAlt() {
        return this.isArrowLeft();
    }

    isRightAlt() {
        return this.isArrowRight();
    }

    // Правая кнопка мыши для поворота камеры
    isRightMouseDown() {
        return this.mouse.rightButtonDown;
    }

    getMouseMovement() {
        const movement = {
            x: this.mouse.movementX,
            y: this.mouse.movementY
        };
        // Сбрасываем движение после чтения
        this.mouse.movementX = 0;
        this.mouse.movementY = 0;
        return movement;
    }

    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    reset() {
        this.keys = {};
        this.mouse.isDown = false;
    }
}

