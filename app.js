// 俄罗斯方块游戏核心逻辑

// 游戏常量配置
const COLS = 10;           // 游戏网格列数
const ROWS = 20;           // 游戏网格行数
const BLOCK_SIZE = 20;     // 方块大小（像素）
const INITIAL_SPEED = 1000; // 初始下落速度（毫秒）
const SPEED_INCREMENT = 50; // 每级速度增量
const LINES_PER_LEVEL = 10; // 每消除多少行升一级

// 7种经典方块定义（形状、颜色）
const TETROMINOES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00ffff' // 青色
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#ffff00' // 黄色
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#9c27b0' // 紫色
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00ff88' // 绿色
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#ff6b6b' // 红色
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#3f51b5' // 深蓝色
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#ffa726' // 橙色
    }
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

// 游戏状态变量
let canvas, ctx;           // 主游戏画布
let nextCanvas, nextCtx;   // 下一个方块预览画布
let board;                 // 游戏网格
let currentPiece;          // 当前方块
let nextPiece;             // 下一个方块
let score = 0;             // 当前分数
let level = 1;             // 当前等级
let lines = 0;             // 消除行数
let gameState = 'idle';    // 游戏状态: idle, playing, paused, gameover
let gameLoop = null;       // 游戏循环定时器
let dropSpeed = INITIAL_SPEED; // 当前下落速度
let clearAnimationRows = []; // 正在消除动画的行

// DOM元素
let scoreElement, levelElement, linesElement;
let gameOverOverlay, finalScoreElement;
let startBtn, pauseBtn, restartBtn, playAgainBtn;

// 初始化游戏
function initGame() {
    // 获取画布和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextCanvas');
    nextCtx = nextCanvas.getContext('2d');
    
    // 获取DOM元素
    scoreElement = document.getElementById('score');
    levelElement = document.getElementById('level');
    linesElement = document.getElementById('lines');
    gameOverOverlay = document.getElementById('gameOverOverlay');
    finalScoreElement = document.getElementById('finalScore');
    
    // 获取按钮元素
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    restartBtn = document.getElementById('restartBtn');
    playAgainBtn = document.getElementById('playAgainBtn');
    
    // 添加按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    playAgainBtn.addEventListener('click', restartGame);
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);
    
    // 初始化游戏网格
    initBoard();
    
    // 绘制初始网格
    drawBoard();
    
    // 隐藏游戏结束遮罩
    gameOverOverlay.classList.remove('show');
}

// 初始化游戏网格
function initBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = null;
        }
    }
}

// 绘制游戏网格
function drawBoard() {
    // 清空画布
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 0.5;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }
    
    // 绘制已固定的方块
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(col, row, board[row][col]);
            }
        }
    }
    
    // 绘制当前方块
    if (currentPiece) {
        drawPiece(currentPiece);
    }
    
    // 如果有消除动画，绘制闪烁效果
    if (clearAnimationRows.length > 0) {
        drawClearAnimation();
    }
}

// 绘制单个方块
function drawBlock(col, row, color) {
    const x = col * BLOCK_SIZE;
    const y = row * BLOCK_SIZE;
    
    // 绘制方块主体
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    
    // 绘制方块高光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 4);
    ctx.fillRect(x + 1, y + 1, 4, BLOCK_SIZE - 2);
    
    // 绘制方块阴影效果
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + BLOCK_SIZE - 5, y + 5, 4, BLOCK_SIZE - 6);
    ctx.fillRect(x + 5, y + BLOCK_SIZE - 5, BLOCK_SIZE - 6, 4);
}

// 绘制当前方块
function drawPiece(piece) {
    const shape = piece.shape;
    const color = piece.color;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardCol = piece.x + col;
                const boardRow = piece.y + row;
                if (boardRow >= 0) {
                    drawBlock(boardCol, boardRow, color);
                }
            }
        }
    }
}

// 绘制下一个方块预览
function drawNextPiece() {
    // 清空预览画布
    nextCtx.fillStyle = '#0a0a0a';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const shape = nextPiece.shape;
        const color = nextPiece.color;
        
        // 计算居中偏移
        const offsetX = (nextCanvas.width - shape[0].length * BLOCK_SIZE) / 2;
        const offsetY = (nextCanvas.height - shape.length * BLOCK_SIZE) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * BLOCK_SIZE;
                    const y = offsetY + row * BLOCK_SIZE;
                    
                    // 绘制方块主体
                    nextCtx.fillStyle = color;
                    nextCtx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
                    
                    // 绘制高光
                    nextCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                    nextCtx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, 4);
                    nextCtx.fillRect(x + 1, y + 1, 4, BLOCK_SIZE - 2);
                }
            }
        }
    }
}

// 绘制消除动画
function drawClearAnimation() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    clearAnimationRows.forEach(row => {
        ctx.fillRect(0, row * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
    });
}

// 创建随机方块
function createPiece(type) {
    const tetromino = TETROMINOES[type];
    return {
        shape: tetromino.shape.map(row => [...row]),
        color: tetromino.color,
        x: Math.floor((COLS - tetromino.shape[0].length) / 2),
        y: 0
    };
}

// 获取随机方块类型
function getRandomPieceType() {
    return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
}

// 生成新方块
function spawnPiece() {
    // 如果有下一个方块，使用它
    currentPiece = nextPiece || createPiece(getRandomPieceType());
    nextPiece = createPiece(getRandomPieceType());
    
    // 更新预览
    drawNextPiece();
    
    // 检查游戏结束条件（新方块无法放置）
    if (!isValidMove(currentPiece)) {
        gameOver();
    }
}

// 检查移动是否有效
function isValidMove(piece, offsetX = 0, offsetY = 0, newShape = null) {
    const shape = newShape || piece.shape;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = piece.x + col + offsetX;
                const newY = piece.y + row + offsetY;
                
                // 检查边界
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return false;
                }
                
                // 检查与已固定方块的碰撞
                if (newY >= 0 && board[newY][newX]) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

// 旋转方块
function rotatePiece() {
    if (gameState !== 'playing' || !currentPiece) return;
    
    const shape = currentPiece.shape;
    const rows = shape.length;
    const cols = shape[0].length;
    
    // 创建旋转后的形状（顺时针旋转90度）
    const rotated = [];
    for (let col = 0; col < cols; col++) {
        rotated[col] = [];
        for (let row = rows - 1; row >= 0; row--) {
            rotated[col].push(shape[row][col]);
        }
    }
    
    // 尝试旋转，如果不行则尝试墙踢
    if (isValidMove(currentPiece, 0, 0, rotated)) {
        currentPiece.shape = rotated;
    } else if (isValidMove(currentPiece, -1, 0, rotated)) {
        currentPiece.x -= 1;
        currentPiece.shape = rotated;
    } else if (isValidMove(currentPiece, 1, 0, rotated)) {
        currentPiece.x += 1;
        currentPiece.shape = rotated;
    } else if (isValidMove(currentPiece, -2, 0, rotated)) {
        currentPiece.x -= 2;
        currentPiece.shape = rotated;
    } else if (isValidMove(currentPiece, 2, 0, rotated)) {
        currentPiece.x += 2;
        currentPiece.shape = rotated;
    }
    
    drawBoard();
}

// 移动方块
function movePiece(direction) {
    if (gameState !== 'playing' || !currentPiece) return;
    
    let offsetX = 0;
    let offsetY = 0;
    
    switch (direction) {
        case 'left':
            offsetX = -1;
            break;
        case 'right':
            offsetX = 1;
            break;
        case 'down':
            offsetY = 1;
            break;
    }
    
    if (isValidMove(currentPiece, offsetX, offsetY)) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        drawBoard();
    } else if (direction === 'down') {
        // 无法继续下落，固定方块
        lockPiece();
    }
}

// 硬降落（直接落到底部）
function hardDrop() {
    if (gameState !== 'playing' || !currentPiece) return;
    
    while (isValidMove(currentPiece, 0, 1)) {
        currentPiece.y += 1;
    }
    
    lockPiece();
}

// 固定方块到网格
function lockPiece() {
    const shape = currentPiece.shape;
    const color = currentPiece.color;
    
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardRow = currentPiece.y + row;
                const boardCol = currentPiece.x + col;
                
                if (boardRow >= 0) {
                    board[boardRow][boardCol] = color;
                }
            }
        }
    }
    
    // 检查并清除完整行
    checkLines();
    
    // 生成新方块
    spawnPiece();
    
    drawBoard();
}

// 检查并清除完整行
function checkLines() {
    let clearedLines = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== null)) {
            // 标记该行进行消除动画
            clearAnimationRows.push(row);
            clearedLines++;
        }
    }
    
    if (clearedLines > 0) {
        // 显示消除动画
        setTimeout(() => {
            // 移除标记的行并让上方行下落
            clearAnimationRows.forEach(row => {
                board.splice(row, 1);
                board.unshift(new Array(COLS).fill(null));
            });
            clearAnimationRows = [];
            
            // 更新分数和等级
            updateScore(clearedLines);
            drawBoard();
        }, 200);
    }
}

// 更新分数
function updateScore(linesCleared) {
    // 分数计算：消除行数越多，分数越高
    const scoreTable = [0, 100, 300, 500, 800];
    score += scoreTable[linesCleared] * level;
    lines += linesCleared;
    
    // 检查升级
    const newLevel = Math.floor(lines / LINES_PER_LEVEL) + 1;
    if (newLevel > level) {
        level = newLevel;
        dropSpeed = Math.max(100, INITIAL_SPEED - (level - 1) * SPEED_INCREMENT);
        resetGameLoop();
    }
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 开始游戏
function startGame() {
    if (gameState === 'playing') return;
    
    // 重置游戏状态
    score = 0;
    level = 1;
    lines = 0;
    dropSpeed = INITIAL_SPEED;
    gameState = 'playing';
    
    // 更新显示
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    
    // 重新初始化网格
    initBoard();
    
    // 生成初始方块
    nextPiece = createPiece(getRandomPieceType());
    spawnPiece();
    
    // 隐藏游戏结束遮罩
    gameOverOverlay.classList.remove('show');
    
    // 启动游戏循环
    startGameLoop();
    
    // 绘制游戏
    drawBoard();
}

// 暂停/继续游戏
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pauseBtn.textContent = '继续';
        stopGameLoop();
    } else if (gameState === 'paused') {
        gameState = 'playing';
        pauseBtn.textContent = '暂停';
        startGameLoop();
    }
}

// 重新开始游戏
function restartGame() {
    stopGameLoop();
    pauseBtn.textContent = '暂停';
    startGame();
}

// 游戏结束
function gameOver() {
    gameState = 'gameover';
    stopGameLoop();
    
    // 显示最终分数
    finalScoreElement.textContent = score;
    
    // 显示游戏结束遮罩
    gameOverOverlay.classList.add('show');
}

// 启动游戏循环
function startGameLoop() {
    if (gameLoop) return;
    
    gameLoop = setInterval(() => {
        if (gameState === 'playing') {
            movePiece('down');
        }
    }, dropSpeed);
}

// 停止游戏循环
function stopGameLoop() {
    if (gameLoop) {
        clearInterval(gameLoop);
        gameLoop = null;
    }
}

// 重置游戏循环（用于速度变化）
function resetGameLoop() {
    stopGameLoop();
    startGameLoop();
}

// 键盘事件处理
function handleKeyDown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            movePiece('left');
            break;
        case 'ArrowRight':
            event.preventDefault();
            movePiece('right');
            break;
        case 'ArrowDown':
            event.preventDefault();
            movePiece('down');
            break;
        case 'ArrowUp':
            event.preventDefault();
            rotatePiece();
            break;
        case ' ':
            event.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            event.preventDefault();
            togglePause();
            break;
    }
}

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', initGame);