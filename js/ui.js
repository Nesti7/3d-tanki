// Управление UI
class UI {
    constructor(game) {
        this.game = game;

        // Экраны
        this.menuScreen = document.getElementById('menu');
        this.gameScreen = document.getElementById('game-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.pauseMenu = document.getElementById('pause-menu');

        // HUD элементы
        this.healthFill = document.getElementById('health-fill');
        this.healthText = document.getElementById('health-text');
        this.scoreValue = document.getElementById('score-value');
        this.waveValue = document.getElementById('wave-value');
        this.enemiesValue = document.getElementById('enemies-value');

        // Сообщения
        this.waveMessage = document.getElementById('wave-message');
        this.powerupMessage = document.getElementById('powerup-message');

        this.setupEventListeners();
        this.showMenu();
    }
    
    setupEventListeners() {
        // Выбор танка
        const tankCards = document.querySelectorAll('.tank-card');
        tankCards.forEach(card => {
            card.querySelector('.select-btn').addEventListener('click', () => {
                const tankType = card.getAttribute('data-type');
                this.startGame(tankType);
            });
        });

        // Кнопки Game Over
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.startGame(this.game.selectedTankType);
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMenu();
        });

        // Кнопки Паузы
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.togglePause();
        });

        document.getElementById('exit-btn').addEventListener('click', () => {
            this.game.state = 'menu';
            this.game.cleanup();
            this.showMenu();
        });
    }
    
    showMenu() {
        this.menuScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
    }
    
    showGame() {
        this.menuScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.pauseMenu.classList.add('hidden');
    }
    
    showGameOver() {
        this.gameoverScreen.classList.remove('hidden');
        
        // Обновление статистики
        document.getElementById('final-score').textContent = this.game.score;
        document.getElementById('final-wave').textContent = this.game.wave;
        document.getElementById('final-kills').textContent = this.game.kills;
        
        const bestScore = localStorage.getItem('bestScore') || 0;
        document.getElementById('best-score').textContent = bestScore;
    }
    
    showPauseMenu() {
        this.pauseMenu.classList.remove('hidden');
    }
    
    hidePauseMenu() {
        this.pauseMenu.classList.add('hidden');
    }
    
    startGame(tankType) {
        this.showGame();
        this.game.startGame(tankType);
    }
    
    updateHUD() {
        if (!this.game.player) return;
        
        // Здоровье
        const healthPercent = (this.game.player.health / this.game.player.maxHealth) * 100;
        this.healthFill.style.width = healthPercent + '%';
        this.healthText.textContent = `${Math.ceil(this.game.player.health)}/${this.game.player.maxHealth}`;
        
        // Визуальное предупреждение при низком здоровье
        if (healthPercent < 30) {
            this.healthFill.style.animation = 'healthPulse 0.5s ease-in-out infinite';
        } else {
            this.healthFill.style.animation = 'none';
        }
        
        // Очки
        this.scoreValue.textContent = this.game.score;
        
        // Волна
        this.waveValue.textContent = this.game.wave;
        
        // Враги
        this.enemiesValue.textContent = this.game.enemies.length;
    }
    
    showWaveMessage(text) {
        this.waveMessage.textContent = text;
        this.waveMessage.classList.remove('hidden');
        
        setTimeout(() => {
            this.waveMessage.classList.add('hidden');
        }, 2000);
    }
    
    showPowerupMessage(text) {
        this.powerupMessage.textContent = text;
        this.powerupMessage.classList.remove('hidden');
        
        setTimeout(() => {
            this.powerupMessage.classList.add('hidden');
        }, 1500);
    }
}

