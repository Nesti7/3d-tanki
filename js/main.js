// Точка входа в игру
window.addEventListener('DOMContentLoaded', () => {
    // Проверка поддержки WebGL
    if (!checkWebGLSupport()) {
        alert('Ваш браузер не поддерживает WebGL. Пожалуйста, обновите браузер.');
        return;
    }

    // Инициализация игры
    window.game = new Game();

    console.log('🎮 3D Танчики загружены и готовы к игре!');
});

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch(e) {
        return false;
    }
}

