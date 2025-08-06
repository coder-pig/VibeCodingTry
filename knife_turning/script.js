// 转刀游戏主脚本文件
// 作者: SOLO Coding AI
// 功能: 实现完整的转刀游戏逻辑

/**
 * 游戏配置常量
 */
const GameConfig = {
    canvas: {
        desktop: { width: 375, height: 667 },
        mobile: { aspectRatio: 9/16, minWidth: 320 }
    },
    mobile: {
        joystickSize: 80,
        joystickDeadZone: 0.1,
        vibrationEnabled: true,
        touchSensitivity: 1.2
    },
    player: {
        startHealth: 100,
        moveSpeed: 200,
        size: 45  // 调整角色尺寸到45，让角色显示得更小巧可爱 ✨(｡◕‿◕｡)
    },
    weapons: {
        baseRotationSpeed: 2,
        spawnInterval: 2000,
        maxCount: 1000,
        radius: 70, // 调整旋转半径，以人物高度(45)的1.56倍为基准，保持合适的比例关系 (｡◕‿◕｡)
        // 10级武器配置
        types: [
            { id: 1, name: '拖鞋', damage: 5, range: 1.0, color: '#4169E1', shape: 'slipper' },
            { id: 2, name: '水果刀', damage: 8, range: 1.2, color: '#C0C0C0', shape: 'fruit_knife' },
            { id: 3, name: '菜刀', damage: 12, range: 1.5, color: '#A9A9A9', shape: 'cleaver' },
            { id: 4, name: '匕首', damage: 15, range: 1.3, color: '#2F4F4F', shape: 'dagger' },
            { id: 5, name: '武士刀', damage: 20, range: 2.0, color: '#8B4513', shape: 'katana' },
            { id: 6, name: '长剑', damage: 25, range: 2.2, color: '#C0C0C0', shape: 'sword' },
            { id: 7, name: '倚天剑', damage: 35, range: 2.5, color: '#0000FF', shape: 'legendary_sword', glow: '#0080FF' },
            { id: 8, name: '屠龙刀', damage: 45, range: 2.8, color: '#8B0000', shape: 'dragon_slayer', glow: '#FF4500' },
            { id: 9, name: '青龙偃月刀', damage: 55, range: 3.2, color: '#006400', shape: 'crescent_blade', glow: '#32CD32' },
            { id: 10, name: '方天画戟', damage: 65, range: 3.5, color: '#FFD700', shape: 'halberd', glow: '#FFA500' }
        ]
    },
    enemies: {
        spawnRate: 1500, // 增加基础生成间隔从800ms到1500ms，降低生成频率
        maxCount: 15, // 添加敌人数量上限，当场上敌人超过15个时暂停生成
        types: [
            { health: 15, damage: 8, speed: 60, exp: 3, size: 45, color: '#8B4513', name: '丐帮弟子' },
            { health: 40, damage: 12, speed: 30, exp: 10, size: 45, color: '#228B22', name: '星宿弟子' },
            { health: 20, damage: 15, speed: 40, exp: 8, size: 45, color: '#4169E1', name: '大理侍卫' },
            { health: 30, damage: 10, speed: 20, exp: 5, size: 45, color: '#696969', name: '少林弟子' }
        ]
    },
    // 随机成长系统配置
    growthSkills: [
        { id: 'weaponUpgrade', name: '刀升级', description: '当前刀具等级提升1级', icon: '⚔️' },
        { id: 'weaponCount', name: '刀数量+1', description: '每次生成刀的数量+1', icon: '🔢' },
        { id: 'rotationSpeed', name: '转速提升', description: '刀具旋转速度提升20%', icon: '🌀' },
        { id: 'moveSpeed', name: '移动速度', description: '角色移动速度提升1点', icon: '💨' },
        { id: 'healthMax', name: '血量上限', description: '最大生命值增加20点', icon: '❤️' }
    ],
    experience: {
        baseRequired: 50,
        multiplier: 1.6
    }
};

/**
 * 设备检测类
 * 用于检测设备类型和屏幕信息
 */
class DeviceDetector {
    /**
     * 检测是否为移动设备
     * @returns {boolean} 是否为移动设备
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * 检测是否支持触控
     * @returns {boolean} 是否支持触控
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * 获取屏幕尺寸
     * @returns {Object} 屏幕宽高信息
     */
    static getScreenSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
}

/**
 * 画布适配器类
 * 负责根据设备类型调整画布尺寸
 */
class CanvasAdapter {
    /**
     * 调整画布尺寸
     * @param {HTMLCanvasElement} canvas - 画布元素
     * @param {boolean} isMobile - 是否为移动设备
     */
    static resizeCanvas(canvas, isMobile) {
        if (isMobile) {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const aspectRatio = GameConfig.canvas.mobile.aspectRatio;
            
            let canvasWidth = screenWidth * 0.95;
            let canvasHeight = canvasWidth / aspectRatio;
            
            if (canvasHeight > screenHeight * 0.7) {
                canvasHeight = screenHeight * 0.7;
                canvasWidth = canvasHeight * aspectRatio;
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
        } else {
            canvas.width = GameConfig.canvas.desktop.width;
            canvas.height = GameConfig.canvas.desktop.height;
        }
    }
}

/**
 * 虚拟摇杆类
 * 处理移动端的虚拟摇杆控制
 */
class VirtualJoystick {
    /**
     * 构造函数
     * @param {HTMLElement} container - 摇杆容器元素
     */
    constructor(container) {
        this.container = container;
        this.base = container.querySelector('.joystick-base');
        this.knob = container.querySelector('.joystick-knob');
        this.isActive = false;
        this.centerX = 0;
        this.centerY = 0;
        this.knobX = 0;
        this.knobY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        this.maxDistance = GameConfig.mobile.joystickSize / 2 - 15;
        
        this.setupEventListeners();
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 触摸事件
        this.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e.touches[0]);
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.handleTouchMove(e.touches[0]);
            }
        }, { passive: false });
        
        document.addEventListener('touchend', () => {
            this.handleTouchEnd();
        });
        
        // 鼠标事件（桌面端支持）
        this.base.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.handleTouchMove(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            this.handleTouchEnd();
        });
    }
    
    /**
     * 处理触摸/鼠标开始事件
     * @param {Touch|MouseEvent} event - 触摸或鼠标事件对象
     */
    handleTouchStart(event) {
        this.isActive = true;
        const rect = this.base.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.handleTouchMove(event);
    }
    
    /**
     * 处理触摸/鼠标移动事件
     * @param {Touch|MouseEvent} event - 触摸或鼠标事件对象
     */
    handleTouchMove(event) {
        if (!this.isActive) return;
        
        const deltaX = event.clientX - this.centerX;
        const deltaY = event.clientY - this.centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance <= this.maxDistance) {
            this.knobX = deltaX;
            this.knobY = deltaY;
        } else {
            this.knobX = (deltaX / distance) * this.maxDistance;
            this.knobY = (deltaY / distance) * this.maxDistance;
        }
        
        // 更新摇杆旋钮位置
        this.knob.style.transform = `translate(calc(-50% + ${this.knobX}px), calc(-50% + ${this.knobY}px))`;
        
        // 计算方向向量
        this.deltaX = this.knobX / this.maxDistance;
        this.deltaY = this.knobY / this.maxDistance;
        
        // 应用死区
        const magnitude = Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
        if (magnitude < GameConfig.mobile.joystickDeadZone) {
            this.deltaX = 0;
            this.deltaY = 0;
        }
    }
    
    /**
     * 处理触摸结束事件
     */
    handleTouchEnd() {
        this.isActive = false;
        this.knobX = 0;
        this.knobY = 0;
        this.deltaX = 0;
        this.deltaY = 0;
        
        // 重置摇杆旋钮位置
        this.knob.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * 获取摇杆方向
     * @returns {Object} 方向向量 {x, y}
     */
    getDirection() {
        return { x: this.deltaX, y: this.deltaY };
    }
}

/**
 * 输入管理器类
 * 处理键盘和触控输入
 */
class InputManager {
    /**
     * 构造函数
     */
    constructor() {
        this.keys = {};
        this.joystick = null;
        this.isMobile = DeviceDetector.isMobile();
        
        this.setupKeyboardListeners();
        
        // 总是设置移动端控制，让虚拟摇杆在桌面端也能工作
        this.setupMobileControls();
    }
    
    /**
     * 设置键盘监听器
     */
    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    /**
     * 设置移动端控制
     */
    setupMobileControls() {
        const joystickContainer = document.getElementById('virtualJoystick');
        if (joystickContainer) {
            this.joystick = new VirtualJoystick(joystickContainer);
        }
    }
    
    /**
     * 获取移动方向
     * @returns {Object} 移动方向向量 {x, y}
     */
    getMovementDirection() {
        let x = 0, y = 0;
        
        // 优先使用虚拟摇杆输入
        if (this.joystick) {
            const direction = this.joystick.getDirection();
            x = direction.x;
            y = direction.y;
            
            // 如果摇杆有输入，直接返回（已经标准化）
            if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
                return { x, y };
            }
        }
        
        // 如果没有摇杆输入，使用键盘控制
        if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
        
        // 标准化方向向量
        const magnitude = Math.sqrt(x * x + y * y);
        if (magnitude > 0) {
            x /= magnitude;
            y /= magnitude;
        }
        
        return { x, y };
    }
}

/**
 * 基础游戏对象类
 * 所有游戏对象的基类
 */
class GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocity = { x: 0, y: 0 };
        this.active = true;
    }
    
    /**
     * 更新对象状态
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }
    
    /**
     * 渲染对象
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        // 基类默认不渲染任何内容
    }
    
    /**
     * 获取对象边界框
     * @returns {Object} 边界框信息
     */
    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}

/**
 * 玩家角色类
 * 继承自GameObject，实现玩家角色的逻辑
 */
class Player extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        super(x, y, GameConfig.player.size, GameConfig.player.size);
        this.health = GameConfig.player.startHealth;
        this.maxHealth = GameConfig.player.startHealth;
        this.experience = 0;
        this.level = 1;
        this.moveSpeed = GameConfig.player.moveSpeed;
        this.radius = GameConfig.player.size / 2;
        
        // 无敌时间机制
        this.invulnerabilityTime = 0; // 无敌剩余时间（毫秒）
        this.invulnerabilityDuration = 1000; // 无敌持续时间（1秒）
        this.isInvulnerable = false; // 是否处于无敌状态
        
        // 角色状态管理
        this.state = 'idle'; // 当前状态：idle（静止）、moving（移动）、hurt（受伤）
        this.lastState = 'idle'; // 上一个状态，用于状态切换检测
        
        // 角色图片资源
        this.sprites = {
            idle: null,    // 静止状态图片
            moving: null,  // 移动状态图片
            hurt: null     // 受伤状态图片
        };
        
        // 图片加载状态
        this.spritesLoaded = {
            idle: false,
            moving: false,
            hurt: false
        };
        
        // 加载角色图片
        this.loadSprites();
    }
    
    /**
     * 加载角色图片资源
     */
    loadSprites() {
        // 图片URL配置
        const spriteUrls = {
            idle: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/player_idle.png',
            moving: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/player_moving.png',
            hurt: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/player_hurt.png'
        };
        
        // 加载每个状态的图片
        Object.keys(spriteUrls).forEach(state => {
            const img = new Image();
            img.onload = () => {
                this.sprites[state] = img;
                this.spritesLoaded[state] = true;
                console.log(`角色${state}状态图片加载成功`);
            };
            img.onerror = () => {
                console.warn(`角色${state}状态图片加载失败，将使用默认渲染`);
                this.spritesLoaded[state] = false;
            };
            img.src = spriteUrls[state];
        });
    }
    
    /**
     * 更新玩家状态
     * @param {number} deltaTime - 时间间隔
     * @param {Object} input - 输入方向
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    update(deltaTime, input, canvasWidth, canvasHeight) {
        // 更新无敌时间
        if (this.isInvulnerable) {
            this.invulnerabilityTime -= deltaTime * 1000; // deltaTime是秒，转换为毫秒
            if (this.invulnerabilityTime <= 0) {
                this.isInvulnerable = false;
                this.invulnerabilityTime = 0;
            }
        }
        
        // 更新位置
        this.velocity.x = input.x * this.moveSpeed;
        this.velocity.y = input.y * this.moveSpeed;
        
        super.update(deltaTime);
        
        // 边界检测
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        
        // 更新角色状态
        this.updatePlayerState(input);
    }
    
    /**
     * 更新角色状态
     * @param {Object} input - 输入方向
     */
    updatePlayerState(input) {
        // 保存上一个状态
        this.lastState = this.state;
        
        // 判断当前状态
        if (this.isInvulnerable) {
            // 如果处于无敌状态（刚受伤），显示受伤状态
            this.state = 'hurt';
        } else if (Math.abs(input.x) > 0.1 || Math.abs(input.y) > 0.1) {
            // 如果有移动输入，显示移动状态
            this.state = 'moving';
        } else {
            // 否则显示静止状态
            this.state = 'idle';
        }
        
        // 状态切换日志（调试用）
        if (this.state !== this.lastState) {
            console.log(`角色状态切换: ${this.lastState} -> ${this.state}`);
        }
    }
    
    /**
     * 渲染玩家
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 检查当前状态的图片是否已加载
        const currentSprite = this.sprites[this.state];
        const isCurrentSpriteLoaded = this.spritesLoaded[this.state];
        
        if (currentSprite && isCurrentSpriteLoaded) {
            // 使用图片渲染角色
            this.renderSprite(ctx, currentSprite);
        } else {
            // 图片未加载或加载失败，使用默认圆形渲染
            this.renderDefault(ctx);
        }
        
        // 移除无敌状态的白色圆圈视觉效果，保留无敌逻辑功能
        // 原本在此处显示白色圆圈闪烁效果，现在为了更好的视觉体验而移除 (｡◕‿◕｡)
        // if (this.isInvulnerable) {
        //     this.renderInvulnerabilityEffect(ctx);
        // }
        
        ctx.restore();
    }
    
    /**
     * 使用图片渲染角色
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {HTMLImageElement} sprite - 角色图片
     */
    renderSprite(ctx, sprite) {
        // 计算图片渲染尺寸，按照128x192（2:3）比例渲染 ✨
        const spriteWidth = this.radius * 2; // 图片宽度等于角色直径
        const spriteHeight = this.radius * 3; // 图片高度为宽度的1.5倍，保持2:3比例
        const spriteX = this.x - spriteWidth / 2; // 图片左上角X坐标
        const spriteY = this.y - spriteHeight / 2; // 图片左上角Y坐标
        
        // 使用2:3比例绘制角色图片，保持128x192的原始宽高比 (｡◕‿◕｡)
        // width:height = 2:3，确保图片不会被拉伸变形
        ctx.drawImage(sprite, spriteX, spriteY, spriteWidth, spriteHeight);
    }
    
    /**
     * 使用默认圆形渲染角色（备用方案）
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderDefault(ctx) {
        // 根据状态调整颜色
        let bodyColor = '#4444ff'; // 默认蓝色
        if (this.state === 'hurt') {
            bodyColor = '#ff4444'; // 受伤时红色
        } else if (this.state === 'moving') {
            bodyColor = '#44ff44'; // 移动时绿色
        }
        
        // 绘制玩家身体
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制玩家边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制玩家眼睛
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 3, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 渲染无敌状态效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderInvulnerabilityEffect(ctx) {
        // 创建闪烁效果
        const flashInterval = 100; // 闪烁间隔（毫秒）
        const shouldFlash = Math.floor(this.invulnerabilityTime / flashInterval) % 2 === 0;
        
        if (shouldFlash) {
            // 添加半透明白色覆盖层
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        // 如果处于无敌状态，不受到伤害
        if (this.isInvulnerable) {
            return;
        }
        
        this.health = Math.max(0, this.health - damage);
        
        // 受到伤害后进入无敌状态
        this.isInvulnerable = true;
        this.invulnerabilityTime = this.invulnerabilityDuration;
    }
    
    /**
     * 恢复血量
     * @param {number} amount - 恢复量
     */
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    /**
     * 获得经验
     * @param {number} exp - 经验值
     * @returns {boolean} 是否升级
     */
    gainExperience(exp) {
        this.experience += exp;
        const requiredExp = this.getRequiredExperience();
        
        if (this.experience >= requiredExp) {
            this.levelUp();
            return true;
        }
        return false;
    }
    
    /**
     * 升级
     */
    levelUp() {
        this.level++;
        this.experience = 0;
    }
    
    /**
     * 获取升级所需经验
     * @returns {number} 所需经验值
     */
    getRequiredExperience() {
        return Math.floor(GameConfig.experience.baseRequired * Math.pow(GameConfig.experience.multiplier, this.level - 1));
    }
    
    /**
     * 检查是否死亡
     * @returns {boolean} 是否死亡
     */
    isDead() {
        return this.health <= 0;
    }
}

/**
 * 武器类
 * 实现围绕玩家旋转的武器
 */
class Weapon extends GameObject {
    /**
     * 构造函数
     * @param {number} playerX - 玩家X坐标
     * @param {number} playerY - 玩家Y坐标
     * @param {number} angle - 初始角度
     * @param {number} weaponLevel - 武器等级 (1-10)
     */
    constructor(playerX, playerY, angle, weaponLevel = 1) {
        super(playerX, playerY, 48, 48); // 调整武器尺寸为48x48像素，保持正方形不变形 ✨
        this.angle = angle;
        this.rotationSpeed = GameConfig.weapons.baseRotationSpeed;
        this.radius = GameConfig.weapons.radius;
        
        // 确保武器等级在有效范围内并添加调试信息
        const originalLevel = weaponLevel;
        this.weaponLevel = Math.min(10, Math.max(1, weaponLevel));
        
        // 验证武器配置数组索引
        const weaponIndex = this.weaponLevel - 1;
        if (weaponIndex < 0 || weaponIndex >= GameConfig.weapons.types.length) {
            console.error(`🚨 武器构造失败: 等级${this.weaponLevel}对应的索引${weaponIndex}超出范围`);
            this.weaponLevel = 1; // 回退到默认等级
        }
        
        this.weaponType = GameConfig.weapons.types[this.weaponLevel - 1];
        
        // 验证武器类型是否存在
        if (!this.weaponType) {
            console.error(`🚨 武器类型不存在，等级: ${this.weaponLevel}, 索引: ${this.weaponLevel - 1}`);
            this.weaponType = GameConfig.weapons.types[0]; // 回退到第一个武器
            this.weaponLevel = 1;
        }
        
        // 确保damage和range是有效数字
        this.damage = Number(this.weaponType.damage) || 10;
        this.range = Number(this.weaponType.range) || 1.0;
        
        // 武器图片相关属性 - 用于实现远程图片素材渲染
        this.sprite = null; // 武器图片对象，存储从远程URL加载的Image实例
        this.spriteLoaded = false; // 图片加载状态标志，true表示图片已成功加载可以渲染
        
        // 调试信息
        if (originalLevel !== this.weaponLevel) {
            console.log(`⚠️ 武器等级已调整: ${originalLevel} → ${this.weaponLevel}`);
        }
        console.log(`🗡️ 创建武器: ${this.weaponType.name} (等级${this.weaponLevel}, 伤害${this.damage})`);
        
        this.updatePosition(playerX, playerY);
        // 加载武器图片
        this.loadWeaponSprite();
    }
    
    /**
     * 更新武器位置
     * @param {number} playerX - 玩家X坐标
     * @param {number} playerY - 玩家Y坐标
     * @param {number} deltaTime - 时间间隔
     */
    update(playerX, playerY, deltaTime) {
        this.angle += this.rotationSpeed * deltaTime;
        this.updatePosition(playerX, playerY);
    }
    
    /**
     * 更新武器位置
     * @param {number} playerX - 玩家X坐标
     * @param {number} playerY - 玩家Y坐标
     */
    updatePosition(playerX, playerY) {
        this.x = playerX + Math.cos(this.angle) * this.radius;
        this.y = playerY + Math.sin(this.angle) * this.radius;
    }
    
    /**
     * 加载武器图片
     * 根据武器类型加载对应的远程图片资源
     */
    loadWeaponSprite() {
        // 武器类型到文件名的映射
        const weaponSpriteMap = {
            'slipper': 'weapon_slipper.png',
            'fruit_knife': 'weapon_fruit_knife.png',
            'cleaver': 'weapon_cleaver.png',
            'dagger': 'weapon_dagger.png',
            'katana': 'weapon_katana.png',
            'sword': 'weapon_longsword.png',
            'legendary_sword': 'weapon_heavenly_sword.png',
            'dragon_slayer': 'weapon_dragon_slayer.png',
            'crescent_blade': 'weapon_crescent_blade.png',
            'halberd': 'weapon_sky_piercer.png'
        };
        
        const spriteFileName = weaponSpriteMap[this.weaponType.shape];
        if (spriteFileName) {
            this.sprite = new Image();
            this.sprite.onload = () => {
                this.spriteLoaded = true;
            };
            this.sprite.onerror = () => {
                console.warn(`武器图片加载失败: ${spriteFileName}`);
                this.spriteLoaded = false;
            };
            // 使用远程GitHub仓库URL
             this.sprite.src = `https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/${spriteFileName}`;
         }
     }
     
     /**
      * 更新武器属性和外观
      * 当武器等级提升时调用此方法更新武器的所有属性
      * @param {number} newWeaponLevel - 新的武器等级
      */
     updateWeaponLevel(newWeaponLevel) {
         const oldLevel = this.weaponLevel;
         const oldWeaponName = this.weaponType ? this.weaponType.name : '未知';
         
         // 确保武器等级在有效范围内 (1-10)
         this.weaponLevel = Math.min(10, Math.max(1, newWeaponLevel));
         
         // 验证数组索引的有效性
         const weaponIndex = this.weaponLevel - 1;
         if (weaponIndex < 0 || weaponIndex >= GameConfig.weapons.types.length) {
             console.error(`武器等级索引超出范围: ${weaponIndex}, 武器等级: ${this.weaponLevel}`);
             return;
         }
         
         this.weaponType = GameConfig.weapons.types[weaponIndex];
         
         // 验证武器类型是否存在
         if (!this.weaponType) {
             console.error(`武器类型不存在，索引: ${weaponIndex}, 等级: ${this.weaponLevel}`);
             return;
         }
         
         // 确保damage和range是有效数字
         this.damage = Number(this.weaponType.damage) || 10;
         this.range = Number(this.weaponType.range) || 1.0;
         
         // 重新加载武器图片以更新外观
         this.loadWeaponSprite();
         
         // 详细的升级日志
         console.log(`🔧 武器升级详情:`);
         console.log(`   从 ${oldLevel}级(${oldWeaponName}) → ${this.weaponLevel}级(${this.weaponType.name})`);
         console.log(`   伤害: ${this.damage}, 范围: ${this.range}`);
         console.log(`   数组索引: ${weaponIndex}`);
     }
     
     /**
      * 渲染武器图片
      * 使用加载的图片资源渲染武器
      * @param {CanvasRenderingContext2D} ctx - 画布上下文
      */
     renderWeaponSprite(ctx) {
         if (this.sprite && this.spriteLoaded) {
             // 使用48x48像素渲染武器图片，保持正方形不变形 ✨(´∀｀)
             const spriteWidth = 48;
             const spriteHeight = 48;
             
             // 绘制武器图片，居中对齐
             ctx.drawImage(
                 this.sprite,
                 -spriteWidth / 2,
                 -spriteHeight / 2,
                 spriteWidth,
                 spriteHeight
             );
             return true; // 表示成功渲染了图片
         }
         return false; // 表示图片未加载，需要使用备用渲染
     }
    
    /**
     * 渲染武器
     * 只有在图片成功加载后才显示武器，避免显示备用形状
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        // 只有当图片成功加载后才渲染武器
        if (!this.sprite || !this.spriteLoaded) {
            return; // 图片未加载时不显示任何内容
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        
        // 绘制发光效果（高级武器）
        if (this.weaponType.glow) {
            const glowRadius = Math.max(this.width, this.height) * 0.8;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
            gradient.addColorStop(0, this.weaponType.glow + '80');
            gradient.addColorStop(1, this.weaponType.glow + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 只使用图片渲染，不再使用备用形状
        this.renderWeaponSprite(ctx);
        
        ctx.restore();
    }
    
    /**
     * 根据武器类型渲染不同形状
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderWeaponShape(ctx) {
        const shape = this.weaponType.shape;
        const color = this.weaponType.color;
        
        switch (shape) {
            case 'slipper':
                this.renderSlipper(ctx, color);
                break;
            case 'fruit_knife':
                this.renderFruitKnife(ctx, color);
                break;
            case 'cleaver':
                this.renderCleaver(ctx, color);
                break;
            case 'dagger':
                this.renderDagger(ctx, color);
                break;
            case 'katana':
                this.renderKatana(ctx, color);
                break;
            case 'sword':
                this.renderSword(ctx, color);
                break;
            case 'legendary_sword':
                this.renderLegendarySword(ctx, color);
                break;
            case 'dragon_slayer':
                this.renderDragonSlayer(ctx, color);
                break;
            case 'crescent_blade':
                this.renderCrescentBlade(ctx, color);
                break;
            case 'halberd':
                this.renderHalberd(ctx, color);
                break;
            default:
                this.renderBasicWeapon(ctx, color);
        }
    }
    
    /**
     * 渲染拖鞋
     */
    renderSlipper(ctx, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width * 0.6, this.height * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 拖鞋带子
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.1, this.width * 0.3, 0, Math.PI);
        ctx.stroke();
    }
    
    /**
     * 渲染水果刀
     */
    renderFruitKnife(ctx, color) {
        // 刀身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.2, -this.height * 0.4, this.width * 0.4, this.height * 0.6);
        
        // 刀尖
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.2, -this.height * 0.2);
        ctx.lineTo(this.width * 0.2, -this.height * 0.2);
        ctx.closePath();
        ctx.fill();
        
        // 刀柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.15, this.height * 0.2, this.width * 0.3, this.height * 0.3);
    }
    
    /**
     * 渲染菜刀
     */
    renderCleaver(ctx, color) {
        // 厚重的刀身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.4, -this.height * 0.3, this.width * 0.8, this.height * 0.5);
        
        // 刀柄
        ctx.fillStyle = '#654321';
        ctx.fillRect(-this.width * 0.2, this.height * 0.2, this.width * 0.4, this.height * 0.3);
        
        // 刀刃反光
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width * 0.3, -this.height * 0.25, this.width * 0.1, this.height * 0.4);
    }
    
    /**
     * 渲染匕首
     */
    renderDagger(ctx, color) {
        // 细长的刀身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.15, -this.height * 0.4, this.width * 0.3, this.height * 0.6);
        
        // 尖锐的刀尖
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.15, -this.height * 0.25);
        ctx.lineTo(this.width * 0.15, -this.height * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // 护手
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.3, this.height * 0.15, this.width * 0.6, this.width * 0.1);
        
        // 刀柄
        ctx.fillRect(-this.width * 0.1, this.height * 0.2, this.width * 0.2, this.height * 0.3);
    }
    
    /**
     * 渲染武士刀
     */
    renderKatana(ctx, color) {
        // 弯曲的刀身
        ctx.strokeStyle = color;
        ctx.lineWidth = this.width * 0.3;
        ctx.beginPath();
        ctx.arc(this.width, 0, this.height * 0.8, Math.PI * 0.6, Math.PI * 1.4);
        ctx.stroke();
        
        // 刀柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.1, this.height * 0.2, this.width * 0.2, this.height * 0.3);
        
        // 护手
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, this.height * 0.15, this.width * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 渲染长剑
     */
    renderSword(ctx, color) {
        // 双刃剑身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.1, -this.height * 0.4, this.width * 0.2, this.height * 0.6);
        
        // 剑尖
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.1, -this.height * 0.3);
        ctx.lineTo(this.width * 0.1, -this.height * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // 护手
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.4, this.height * 0.15, this.width * 0.8, this.width * 0.1);
        
        // 剑柄
        ctx.fillRect(-this.width * 0.08, this.height * 0.2, this.width * 0.16, this.height * 0.25);
    }
    
    /**
     * 渲染倚天剑
     */
    renderLegendarySword(ctx, color) {
        // 神剑剑身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.12, -this.height * 0.45, this.width * 0.24, this.height * 0.65);
        
        // 剑尖
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.45);
        ctx.lineTo(-this.width * 0.12, -this.height * 0.32);
        ctx.lineTo(this.width * 0.12, -this.height * 0.32);
        ctx.closePath();
        ctx.fill();
        
        // 神秘符文
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.2);
        ctx.lineTo(0, this.height * 0.1);
        ctx.stroke();
        
        // 华丽护手
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-this.width * 0.5, this.height * 0.15, this.width, this.width * 0.12);
        
        // 剑柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.1, this.height * 0.2, this.width * 0.2, this.height * 0.25);
    }
    
    /**
     * 渲染屠龙刀
     */
    renderDragonSlayer(ctx, color) {
        // 霸气刀身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.25, -this.height * 0.4, this.width * 0.5, this.height * 0.6);
        
        // 锯齿刀刃
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const y = -this.height * 0.4 + (i * this.height * 0.1);
            ctx.moveTo(-this.width * 0.25, y);
            ctx.lineTo(-this.width * 0.35, y + this.height * 0.05);
            ctx.lineTo(-this.width * 0.25, y + this.height * 0.1);
        }
        ctx.fill();
        
        // 龙纹
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.1, this.width * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        
        // 厚重刀柄
        ctx.fillStyle = '#654321';
        ctx.fillRect(-this.width * 0.15, this.height * 0.2, this.width * 0.3, this.height * 0.3);
    }
    
    /**
     * 渲染青龙偃月刀
     */
    renderCrescentBlade(ctx, color) {
        // 月牙形刀刃
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(-this.width * 0.2, 0, this.height * 0.3, -Math.PI * 0.3, Math.PI * 0.3);
        ctx.arc(this.width * 0.2, 0, this.height * 0.3, Math.PI * 0.7, Math.PI * 1.3);
        ctx.fill();
        
        // 长柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.05, 0, this.width * 0.1, this.height * 0.5);
        
        // 青龙装饰
        ctx.strokeStyle = '#32CD32';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.1, this.width * 0.1, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * 渲染方天画戟
     */
    renderHalberd(ctx, color) {
        // 戟头主刃
        ctx.fillStyle = color;
        ctx.fillRect(-this.width * 0.15, -this.height * 0.4, this.width * 0.3, this.height * 0.3);
        
        // 侧刃
        ctx.beginPath();
        ctx.moveTo(-this.width * 0.4, -this.height * 0.2);
        ctx.lineTo(-this.width * 0.15, -this.height * 0.25);
        ctx.lineTo(-this.width * 0.15, -this.height * 0.15);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.width * 0.4, -this.height * 0.2);
        ctx.lineTo(this.width * 0.15, -this.height * 0.25);
        ctx.lineTo(this.width * 0.15, -this.height * 0.15);
        ctx.closePath();
        ctx.fill();
        
        // 戟尖
        ctx.beginPath();
        ctx.moveTo(0, -this.height * 0.4);
        ctx.lineTo(-this.width * 0.15, -this.height * 0.25);
        ctx.lineTo(this.width * 0.15, -this.height * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // 长柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width * 0.08, -this.height * 0.1, this.width * 0.16, this.height * 0.6);
        
        // 金色装饰
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, -this.height * 0.05, this.width * 0.12, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 渲染基础武器（备用渲染方案）
     */
    renderBasicWeapon(ctx, color) {
        // 基础刀身
        ctx.fillStyle = color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 刀刃
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 4, -this.height / 2 + 5);
        ctx.lineTo(this.width / 4, -this.height / 2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // 刀柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width / 3, this.height / 2 - 8, this.width * 2 / 3, 8);
    }
    
    /**
     * 获取武器的碰撞半径
     * @returns {number} 碰撞半径
     */
    getCollisionRadius() {
        return Math.max(this.width, this.height) / 2;
    }
}

/**
 * 敌人类
 * 实现敌人的AI和行为
 */
class Enemy extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} type - 敌人类型配置
     */
    constructor(x, y, type) {
        super(x, y, type.size, type.size);
        this.health = type.health;
        this.maxHealth = type.health;
        this.damage = type.damage;
        this.moveSpeed = type.speed;
        this.expValue = type.exp;
        this.color = type.color;
        this.radius = type.size / 2;
        this.enemyType = type.name; // 敌人类型名称，用于加载对应图片
        
        // 图片相关属性
        this.sprite = null; // 敌人图片对象
        this.spriteLoaded = false; // 图片是否加载完成
        
        // 加载敌人图片
        this.loadEnemySprite();
    }
    
    /**
     * 更新敌人状态
     * @param {number} deltaTime - 时间间隔
     * @param {Player} player - 玩家对象
     */
    update(deltaTime, player) {
        // AI寻路：向玩家移动
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.velocity.x = (dx / distance) * this.moveSpeed;
            this.velocity.y = (dy / distance) * this.moveSpeed;
        }
        
        super.update(deltaTime);
    }
    
    /**
     * 加载敌人图片
     * 根据敌人类型加载对应的远程图片资源
     */
    loadEnemySprite() {
        // 敌人类型到文件名的映射
        const enemySpriteMap = {
            '丐帮弟子': 'enemy_beggar.png',
            '星宿弟子': 'enemy_poison_sect.png',
            '大理侍卫': 'enemy_dali_guard.png',
            '少林弟子': 'enemy_shaolin_monk.png'
        };
        
        const fileName = enemySpriteMap[this.enemyType];
        if (!fileName) {
            console.warn(`未找到敌人类型 ${this.enemyType} 对应的图片文件`);
            return;
        }
        
        // 创建图片对象
        this.sprite = new Image();
        this.sprite.crossOrigin = 'anonymous'; // 允许跨域加载
        
        // 图片加载成功回调
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            console.log(`敌人图片加载成功: ${fileName}`);
        };
        
        // 图片加载失败回调
        this.sprite.onerror = () => {
            console.warn(`敌人图片加载失败: ${fileName}，将使用默认圆形渲染`);
            this.spriteLoaded = false;
        };
        
        // 设置图片源（GitHub raw链接）
        this.sprite.src = `https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/${fileName}`;
    }
    
    /**
     * 渲染敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 检查敌人图片是否已加载
        if (this.sprite && this.spriteLoaded) {
            // 使用图片渲染敌人
            this.renderEnemySprite(ctx);
        } else {
            // 使用默认圆形渲染敌人
            this.renderDefaultEnemy(ctx);
        }
        
        // 绘制血量条
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            const barY = this.y - this.radius - 8;
            
            // 背景
            ctx.fillStyle = '#333333';
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
            
            // 血量
            ctx.fillStyle = '#ff4444';
            const healthPercent = this.health / this.maxHealth;
            ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        }
        
        // 绘制血量数字
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加文字描边效果，确保在任何背景下都清晰可见
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeText(this.health.toString(), this.x, this.y - this.radius - 18);
        ctx.fillText(this.health.toString(), this.x, this.y - this.radius - 18);
        
        ctx.restore();
    }
    
    /**
     * 使用图片渲染敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderEnemySprite(ctx) {
        // 计算图片渲染尺寸，按照128x231（约1:1.8）比例渲染，避免变形 ✨
        const spriteWidth = this.radius * 2; // 图片宽度等于敌人直径
        const spriteHeight = this.radius * 3.6; // 图片高度为宽度的1.8倍，保持128:231比例
        const spriteX = this.x - spriteWidth / 2; // 图片左上角X坐标
        const spriteY = this.y - spriteHeight / 2; // 图片左上角Y坐标
        
        // 使用128:231比例绘制敌人图片，保持原始宽高比不变形 (｡◕‿◕｡)
        ctx.drawImage(
            this.sprite,
            spriteX,
            spriteY,
            spriteWidth,
            spriteHeight
        );
    }
    
    /**
     * 使用默认圆形渲染敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderDefaultEnemy(ctx) {
        // 绘制敌人身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制敌人边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        // 确保damage是有效数字
        const validDamage = Number(damage) || 0;
        console.log(`敌人受到伤害: 原血量=${this.health}, 伤害=${validDamage}`);
        this.health = Math.max(0, this.health - validDamage);
        console.log(`敌人受伤后血量=${this.health}`);
    }
    
    /**
     * 检查是否死亡
     * @returns {boolean} 是否死亡
     */
    isDead() {
        return this.health <= 0;
    }
}

/**
 * Boss类
 * 继承自Enemy，具有更强的能力和特殊技能
 */
class Boss extends Enemy {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        // Boss配置：高血量、高伤害、中等速度
        const bossType = {
            health: 1000,
            damage: 20,
            speed: 40,
            exp: 500,
            size: 50,
            color: '#8B0000'
        };
        super(x, y, bossType);
        
        this.isBoss = true;
        this.lastSpecialAttack = 0;
        this.specialAttackCooldown = 3000; // 3秒特殊攻击冷却
        this.chargeSpeed = 150; // 冲刺速度
        this.isCharging = false;
        this.chargeDirection = { x: 0, y: 0 };
        this.chargeDuration = 0;
        this.maxChargeDuration = 1000; // 1秒冲刺时间
        
        // Boss特有的图片加载
        this.loadBossSprite();
    }
    
    /**
     * 加载Boss图片
     * 加载扫地僧Boss的专用图片
     */
    loadBossSprite() {
        // 创建图片对象
        this.sprite = new Image();
        this.sprite.crossOrigin = 'anonymous'; // 允许跨域加载
        
        // 图片加载成功回调
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            console.log('Boss图片加载成功: boss_sweeping_monk.png');
        };
        
        // 图片加载失败回调
        this.sprite.onerror = () => {
            console.warn('Boss图片加载失败: boss_sweeping_monk.png，将使用默认圆形渲染');
            this.spriteLoaded = false;
        };
        
        // 设置图片源（GitHub raw链接）
        this.sprite.src = 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/boss_sweeping_monk.png';
    }
    
    /**
     * 更新Boss状态
     * @param {number} deltaTime - 时间间隔
     * @param {Player} player - 玩家对象
     */
    update(deltaTime, player) {
        this.lastSpecialAttack += deltaTime * 1000;
        
        // 特殊攻击：冲刺攻击
        if (this.lastSpecialAttack >= this.specialAttackCooldown && !this.isCharging) {
            this.startCharge(player);
            this.lastSpecialAttack = 0;
        }
        
        if (this.isCharging) {
            this.updateCharge(deltaTime);
        } else {
            // 普通AI移动
            super.update(deltaTime, player);
        }
    }
    
    /**
     * 开始冲刺攻击
     * @param {Player} player - 玩家对象
     */
    startCharge(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.chargeDirection.x = dx / distance;
            this.chargeDirection.y = dy / distance;
            this.isCharging = true;
            this.chargeDuration = 0;
        }
    }
    
    /**
     * 更新冲刺状态
     * @param {number} deltaTime - 时间间隔
     */
    updateCharge(deltaTime) {
        this.chargeDuration += deltaTime * 1000;
        
        if (this.chargeDuration < this.maxChargeDuration) {
            // 冲刺移动
            this.velocity.x = this.chargeDirection.x * this.chargeSpeed;
            this.velocity.y = this.chargeDirection.y * this.chargeSpeed;
        } else {
            // 冲刺结束
            this.isCharging = false;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        
        super.update(deltaTime, null); // 不使用普通AI
    }
    
    /**
     * 渲染Boss
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // Boss发光效果
        if (this.isCharging) {
            const glowRadius = this.radius + 10;
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 检查Boss图片是否已加载
        if (this.sprite && this.spriteLoaded) {
            // 使用图片渲染Boss
            this.renderBossSprite(ctx);
        } else {
            // 使用默认圆形渲染Boss
            this.renderDefaultBoss(ctx);
        }
        
        // Boss血量条（更大更显眼）
        const barWidth = this.width * 1.5;
        const barHeight = 8;
        const barY = this.y - this.radius - 15;
        
        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = '#ff0000';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);
        
        // Boss血量数字（更大更显眼）
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 添加文字描边效果，确保在任何背景下都清晰可见
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeText(`${this.health}/${this.maxHealth}`, this.x, this.y - this.radius - 28);
        ctx.fillText(`${this.health}/${this.maxHealth}`, this.x, this.y - this.radius - 28);
        
        // Boss标识
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y + this.radius + 20);
        
        ctx.restore();
    }
    
    /**
     * 使用图片渲染Boss
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderBossSprite(ctx) {
        // 计算图片渲染尺寸，Boss图片要更大更威武，按照128x231比例渲染 ✨
        const spriteWidth = this.radius * 2.2; // Boss图片宽度比普通敌人稍大
        const spriteHeight = this.radius * 4; // Boss图片高度为宽度的1.8倍，保持128:231比例
        const spriteX = this.x - spriteWidth / 2; // 图片左上角X坐标
        const spriteY = this.y - spriteHeight / 2; // 图片左上角Y坐标
        
        // 使用128:231比例绘制Boss图片，保持原始宽高比不变形 (｡◕‿◕｡)
        ctx.drawImage(
            this.sprite,
            spriteX,
            spriteY,
            spriteWidth,
            spriteHeight
        );
    }
    
    /**
     * 使用默认圆形渲染Boss
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    renderDefaultBoss(ctx) {
        // 绘制Boss身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Boss边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Boss眼睛
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 8, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 经验球类
 * 玩家可以收集的经验球
 */
class ExperienceOrb extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} value - 经验值
     */
    constructor(x, y, value) {
        super(x, y, 8, 8);
        this.value = value;
        this.radius = 4;
        this.collectRadius = 30;
        this.moveSpeed = 150;
        this.glowTime = 0;
    }
    
    /**
     * 更新经验球状态
     * @param {number} deltaTime - 时间间隔
     * @param {Player} player - 玩家对象
     * @param {boolean} magnetActive - 吸铁石效果是否激活
     */
    update(deltaTime, player, magnetActive = false) {
        this.glowTime += deltaTime;
        
        // 检查是否在收集范围内
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 吸铁石效果：大幅扩大收集范围
        const effectiveCollectRadius = magnetActive ? this.collectRadius * 8 : this.collectRadius;
        
        if (distance < effectiveCollectRadius) {
            // 向玩家移动
            if (distance > 0) {
                const moveSpeed = magnetActive ? this.moveSpeed * 3 : this.moveSpeed;
                this.velocity.x = (dx / distance) * moveSpeed;
                this.velocity.y = (dy / distance) * moveSpeed;
            }
        } else {
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
        
        super.update(deltaTime);
    }
    
    /**
     * 渲染经验球
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 发光效果
        const glowIntensity = 0.5 + 0.5 * Math.sin(this.glowTime * 4);
        const glowRadius = this.radius + glowIntensity * 3;
        
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        gradient.addColorStop(0, `rgba(0, 255, 0, ${glowIntensity})`);
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 经验球本体
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 宝箱类
 * 玩家可以收集的宝箱，提供各种奖励
 */
class TreasureBox extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        super(x, y, 24, 24);
        this.radius = 12;
        this.collectRadius = 25;
        this.glowTime = 0;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.bobSpeed = 2;
        this.bobAmount = 3;
        this.baseY = y;
        
        // 随机选择宝箱类型和奖励
        this.type = this.generateRewardType();
        this.reward = this.generateReward();
    }
    
    /**
     * 生成奖励类型
     * @returns {string} 奖励类型
     */
    generateRewardType() {
        // 使用权重系统，武器奖励概率更高
        const weightedTypes = [
            'weapon', 'weapon', 'weapon', 'weapon', 'weapon', // 武器权重5
            'heal', 'heal',                                   // 治疗权重2
            'speed',                                          // 速度权重1
            'damage',                                         // 伤害权重1
            'magnet'                                          // 吸铁石权重1
        ];
        return weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
    }
    
    /**
     * 生成具体奖励
     * @returns {Object} 奖励对象
     */
    generateReward() {
        switch (this.type) {
            case 'weapon':
                const weaponCount = Math.floor(Math.random() * 4) + 5; // 5-8把武器
                return {
                    type: 'weapon',
                    count: weaponCount,
                    description: `获得 ${weaponCount} 把武器`
                };
            case 'heal':
                return {
                    type: 'heal',
                    amount: Math.floor(Math.random() * 50) + 30, // 30-80血量
                    description: `恢复 ${Math.floor(Math.random() * 50) + 30} 血量`
                };
            case 'speed':
                return {
                    type: 'speed',
                    duration: 10000, // 10秒
                    multiplier: 1.5,
                    description: '移动速度提升 10秒'
                };
            case 'damage':
                return {
                    type: 'damage',
                    duration: 15000, // 15秒
                    multiplier: 2,
                    description: '武器伤害翻倍 15秒'
                };
            case 'magnet':
                return {
                    type: 'magnet',
                    duration: 15000, // 15秒
                    description: '吸铁石效果 15秒'
                };
            default:
                return { type: 'weapon', count: 1, description: '获得 1 把武器' };
        }
    }
    
    /**
     * 更新宝箱状态
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        this.glowTime += deltaTime;
        
        // 上下浮动效果
        this.y = this.baseY + Math.sin(this.glowTime * this.bobSpeed + this.bobOffset) * this.bobAmount;
        
        super.update(deltaTime);
    }
    
    /**
     * 渲染宝箱
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 发光效果
        const glowIntensity = 0.6 + 0.4 * Math.sin(this.glowTime * 3);
        const glowRadius = this.radius + glowIntensity * 8;
        
        // 根据类型设置颜色
        let glowColor, boxColor;
        switch (this.type) {
            case 'weapon':
                glowColor = 'rgba(255, 215, 0, ';
                boxColor = '#FFD700';
                break;
            case 'heal':
                glowColor = 'rgba(255, 100, 100, ';
                boxColor = '#FF6464';
                break;
            case 'speed':
                glowColor = 'rgba(100, 255, 100, ';
                boxColor = '#64FF64';
                break;
            case 'damage':
                glowColor = 'rgba(255, 100, 255, ';
                boxColor = '#FF64FF';
                break;
            case 'magnet':
                glowColor = 'rgba(100, 200, 255, ';
                boxColor = '#64C8FF';
                break;
            default:
                glowColor = 'rgba(255, 215, 0, ';
                boxColor = '#FFD700';
        }
        
        // 外发光
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowRadius);
        gradient.addColorStop(0, glowColor + glowIntensity + ')');
        gradient.addColorStop(1, glowColor + '0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // 宝箱主体
        ctx.fillStyle = boxColor;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 宝箱边框
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 宝箱锁扣
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - 3, this.y - this.height/2, 6, 8);
        
        // 类型图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon;
        switch (this.type) {
            case 'weapon': icon = '⚔️'; break;
            case 'heal': icon = '❤️'; break;
            case 'speed': icon = '💨'; break;
            case 'damage': icon = '💥'; break;
            case 'magnet': icon = '🧲'; break;
            default: icon = '?';
        }
        
        ctx.fillText(icon, this.x, this.y + 2);
        
        ctx.restore();
    }
}

/**
 * 碰撞检测工具类
 * 提供各种碰撞检测方法
 */
class CollisionDetector {
    /**
     * 圆形碰撞检测
     * @param {Object} obj1 - 对象1
     * @param {Object} obj2 - 对象2
     * @returns {boolean} 是否碰撞
     */
    static circleCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const radiusSum = (obj1.radius || obj1.width / 2) + (obj2.radius || obj2.width / 2);
        return distance < radiusSum;
    }
    
    /**
     * 矩形碰撞检测
     * @param {Object} obj1 - 对象1
     * @param {Object} obj2 - 对象2
     * @returns {boolean} 是否碰撞
     */
    static rectCollision(obj1, obj2) {
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        
        return bounds1.left < bounds2.right &&
               bounds1.right > bounds2.left &&
               bounds1.top < bounds2.bottom &&
               bounds1.bottom > bounds2.top;
    }
}

/**
 * 游戏引擎类
 * 游戏的核心控制器
 */
class GameEngine {
    /**
     * 构造函数
     */
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputManager = new InputManager();
        this.isMobile = DeviceDetector.isMobile();
        
        // 音频管理
        this.audioManager = {
            bgm: null,
            attackSound: null,
            volume: 0.5,
            muted: false,
            // 预加载状态管理
            isLoading: false,
            loadingProgress: 0,
            totalResources: 2, // 背景音乐 + 攻击音效
            loadedResources: 0,
            loadingPromises: []
        };
        
        // 开始预加载音频资源
        this.preloadAudioResources();
        
        // 游戏状态
        this.gameState = 'start'; // 'start', 'playing', 'paused', 'levelUp', 'gameOver', 'victory'
        this.lastTime = 0;
        this.gameTime = 0;
        
        // 游戏对象
        this.player = null;
        this.weapons = [];
        this.enemies = [];
        this.experienceOrbs = [];
        this.treasureBoxes = [];
        
        // 游戏统计
        this.killCount = 0;
        this.lastWeaponSpawn = 0;
        this.lastEnemySpawn = 0;
        this.lastTreasureSpawn = 0;
        this.weaponSpawnRate = GameConfig.weapons.spawnInterval;
        this.weaponRotationSpeed = GameConfig.weapons.baseRotationSpeed;
        this.weaponSpawnCount = 1; // 每次生成的武器数量
        this.treasureSpawnRate = 5000; // 5秒生成一个宝箱
        this.maxTreasureBoxes = 10; // 地图上最多同时存在10个宝箱
        this.bossSpawned = false; // Boss是否已生成
        this.boss = null; // Boss对象
        
        // 武器等级系统
        this.currentWeaponLevel = 1; // 当前武器等级
        
        // 临时增益效果
        this.speedBoostEndTime = 0;
        this.damageBoostEndTime = 0;
        this.magnetEndTime = 0; // 吸铁石效果结束时间
        this.originalMoveSpeed = GameConfig.player.moveSpeed;
        this.originalWeaponDamage = GameConfig.weapons.baseDamage;
        
        // 背景图片相关
        this.backgroundImage = null; // 背景图片对象
        this.backgroundImageLoaded = false; // 背景图片是否加载完成
        this.loadBackgroundImage(); // 加载背景图片
        
        this.setupCanvas();
        this.setupUI();
        this.showStartScreen();
    }
    
    /**
     * 设置画布
     */
    setupCanvas() {
        CanvasAdapter.resizeCanvas(this.canvas, this.isMobile);
        
        // 设置图像渲染质量，提高图片清晰度 ✨
        // 禁用图像平滑，获得像素完美的清晰效果，避免256x256图片被模糊化 (｡◕‿◕｡)
        this.ctx.imageSmoothingEnabled = false;
        
        // 设置图像平滑质量为高质量（作为备用选项）
        if (this.ctx.imageSmoothingQuality) {
            this.ctx.imageSmoothingQuality = 'high';
        }
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            CanvasAdapter.resizeCanvas(this.canvas, this.isMobile);
            // 重新设置图像渲染质量，确保窗口调整后依然保持清晰
            this.ctx.imageSmoothingEnabled = false;
            if (this.ctx.imageSmoothingQuality) {
                this.ctx.imageSmoothingQuality = 'high';
            }
        });
    }
    
    /**
     * 设置UI
     */
    setupUI() {
        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 技能选择
        document.querySelectorAll('.skill-card').forEach((card, index) => {
            card.addEventListener('click', () => {
                this.selectSkill(index);
            });
        });
        
        // 初始化时禁用开始按钮
        this.updateStartButtonState();
    }
    
    /**
     * 更新开始按钮状态
     */
    updateStartButtonState() {
        const startBtn = document.getElementById('startBtn');
        if (startBtn) {
            if (this.audioManager.isLoading) {
                startBtn.disabled = true;
                startBtn.textContent = '资源加载中...';
                startBtn.style.opacity = '0.6';
                startBtn.style.cursor = 'not-allowed';
            } else {
                startBtn.disabled = false;
                startBtn.textContent = '开始游戏';
                startBtn.style.opacity = '1';
                startBtn.style.cursor = 'pointer';
            }
        }
    }
    
    /**
     * 显示加载界面
     */
    showLoadingScreen() {
        // 创建加载界面元素（如果不存在）
        let loadingScreen = document.getElementById('loadingScreen');
        if (!loadingScreen) {
            loadingScreen = document.createElement('div');
            loadingScreen.id = 'loadingScreen';
            loadingScreen.className = 'loading-screen';
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h2>🎮 游戏资源加载中...</h2>
                    <div class="loading-bar">
                        <div class="loading-progress" id="loadingProgress"></div>
                    </div>
                    <p class="loading-text" id="loadingText">正在加载音频资源... 0%</p>
                </div>
            `;
            document.body.appendChild(loadingScreen);
            
            // 添加加载界面样式
            const style = document.createElement('style');
            style.textContent = `
                .loading-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                    font-family: Arial, sans-serif;
                }
                .loading-content {
                    text-align: center;
                    color: white;
                    max-width: 400px;
                    padding: 20px;
                }
                .loading-content h2 {
                    margin-bottom: 30px;
                    font-size: 24px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                }
                .loading-bar {
                    width: 100%;
                    height: 20px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 10px;
                    overflow: hidden;
                    margin-bottom: 20px;
                    box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
                }
                .loading-progress {
                    height: 100%;
                    background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    width: 0%;
                    transition: width 0.3s ease;
                    border-radius: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                .loading-text {
                    font-size: 16px;
                    margin: 0;
                    opacity: 0.9;
                }
            `;
            document.head.appendChild(style);
        }
        
        loadingScreen.style.display = 'flex';
    }
    
    /**
     * 隐藏加载界面
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // 更新开始按钮状态
        this.updateStartButtonState();
        
        // 显示开始界面
        this.showStartScreen();
    }
    
    /**
     * 更新加载进度
     */
    updateLoadingProgress() {
        const progressBar = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        if (progressBar && loadingText) {
            const progress = Math.round(this.audioManager.loadingProgress);
            progressBar.style.width = progress + '%';
            loadingText.textContent = `正在加载音频资源... ${progress}%`;
            
            // 添加一些有趣的加载文本
            if (progress >= 100) {
                loadingText.textContent = '🎉 加载完成！准备开始游戏...';
            } else if (progress >= 75) {
                loadingText.textContent = `⚡ 即将完成... ${progress}%`;
            } else if (progress >= 50) {
                loadingText.textContent = `🎵 加载音频中... ${progress}%`;
            } else {
                loadingText.textContent = `🔄 正在加载音频资源... ${progress}%`;
            }
        }
    }
    
    /**
     * 显示开始界面
     */
    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
        
        // 根据设备类型显示相应的控制提示
        if (this.isMobile) {
            document.querySelector('.desktop-hint').style.display = 'none';
            document.querySelector('.mobile-hint').style.display = 'block';
        } else {
            document.querySelector('.desktop-hint').style.display = 'block';
            document.querySelector('.mobile-hint').style.display = 'none';
        }
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        // 检查音频资源是否还在加载中
        if (this.audioManager.isLoading) {
            console.log('音频资源还在加载中，请稍候...');
            return;
        }
        
        document.getElementById('startScreen').classList.add('hidden');
        this.gameState = 'playing';
        
        // 播放背景音乐
        this.playBackgroundMusic();
        
        // 初始化游戏对象
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.weapons = [];
        this.enemies = [];
        this.experienceOrbs = [];
        this.treasureBoxes = [];
        
        // 重置游戏统计
        this.killCount = 0;
        this.gameTime = 0;
        this.lastWeaponSpawn = 0;
        this.lastEnemySpawn = 0;
        this.lastTreasureSpawn = 0;
        this.weaponSpawnRate = GameConfig.weapons.spawnInterval;
        this.weaponRotationSpeed = GameConfig.weapons.baseRotationSpeed;
        this.bossSpawned = false;
        this.boss = null;
        
        // 重置临时增益效果
        this.speedBoostEndTime = 0;
        this.damageBoostEndTime = 0;
        this.magnetEndTime = 0;
        
        this.updateUI();
        this.gameLoop();
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        document.getElementById('gameOverModal').classList.add('hidden');
        this.startGame();
    }
    
    /**
     * 游戏主循环
     * @param {number} currentTime - 当前时间戳
     */
    gameLoop(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * 更新游戏状态
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        this.gameTime += deltaTime;
        
        // 更新玩家
        const input = this.inputManager.getMovementDirection();
        this.player.update(deltaTime, input, this.canvas.width, this.canvas.height);
        
        // 检查玩家死亡
        if (this.player.isDead()) {
            this.gameOver();
            return;
        }
        
        // 检查Boss生成条件
        if (this.player.level >= 10 && !this.bossSpawned) {
            // 清除所有普通敌人
            this.enemies = this.enemies.filter(enemy => enemy instanceof Boss);
            
            // 生成Boss
            this.spawnBoss();
            this.bossSpawned = true;
        }
        
        // 生成武器
        this.spawnWeapons(deltaTime);
        
        // 只有在Boss未生成时才生成普通敌人
        if (!this.bossSpawned) {
            this.spawnEnemies(deltaTime);
        }
        
        // 生成宝箱
        this.spawnTreasureBoxes(deltaTime);
        
        // 处理临时增益效果
        this.updateTemporaryEffects();
        
        // 更新武器
        this.weapons.forEach(weapon => {
            weapon.rotationSpeed = this.weaponRotationSpeed;
            // 应用伤害增益
            weapon.damage = this.damageBoostEndTime > Date.now() ? 
                this.originalWeaponDamage * 2 : this.originalWeaponDamage;
            weapon.update(this.player.x, this.player.y, deltaTime);
        });
        
        // 更新敌人
        this.enemies.forEach(enemy => {
            enemy.update(deltaTime, this.player);
        });
        
        // 更新经验球
        const magnetActive = this.magnetEndTime > Date.now();
        this.experienceOrbs.forEach(orb => {
            orb.update(deltaTime, this.player, magnetActive);
        });
        
        // 更新宝箱
        this.treasureBoxes.forEach(box => {
            box.update(deltaTime);
        });
        
        // 碰撞检测
        this.handleCollisions();
        
        // 清理死亡的对象
        this.cleanup();
        
        // 更新UI
        this.updateUI();
    }
    
    /**
     * 生成武器
     * @param {number} deltaTime - 时间间隔
     */
    spawnWeapons(deltaTime) {
        this.lastWeaponSpawn += deltaTime * 1000;
        
        if (this.lastWeaponSpawn >= this.weaponSpawnRate && this.weapons.length < GameConfig.weapons.maxCount) {
            // 根据weaponSpawnCount生成多把武器
            for (let i = 0; i < this.weaponSpawnCount && this.weapons.length < GameConfig.weapons.maxCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const weapon = new Weapon(this.player.x, this.player.y, angle, this.currentWeaponLevel);
                this.weapons.push(weapon);
            }
            this.lastWeaponSpawn = 0;
        }
    }
    
    /**
     * 生成敌人
     * @param {number} deltaTime - 时间间隔
     */
    spawnEnemies(deltaTime) {
        this.lastEnemySpawn += deltaTime * 1000;
        
        // 根据玩家等级动态调整敌人生成速度和数量
        // 等级越高，生成间隔越短，同时生成的敌人数量越多
        const level = this.player.level;
        
        // 前期友好的生成间隔调整：1-3级减少5%，4级以上每级减少8%，最小保持20%
        let levelSpeedMultiplier;
        if (level <= 3) {
            levelSpeedMultiplier = Math.max(0.8, 1 - (level - 1) * 0.05); // 前期减少幅度更小
        } else {
            levelSpeedMultiplier = Math.max(0.2, 0.85 - (level - 4) * 0.08); // 从4级开始正常递减
        }
        const dynamicSpawnRate = GameConfig.enemies.spawnRate * levelSpeedMultiplier;
        
        // 检查敌人数量上限，如果超过上限则暂停生成
        if (this.enemies.length >= GameConfig.enemies.maxCount) {
            return;
        }
        
        // 根据等级决定同时生成的敌人数量（优化前期体验）
        // 1-2级：1个，3-4级：1个，5-7级：2个，8级以上：3个
        let enemyCount;
        if (level <= 2) {
            enemyCount = 1;
        } else if (level <= 4) {
            enemyCount = 1;
        } else if (level <= 7) {
            enemyCount = 2;
        } else {
            enemyCount = 3;
        }
        
        if (this.lastEnemySpawn >= dynamicSpawnRate) {
            // 生成多个敌人
            for (let i = 0; i < enemyCount; i++) {
                // 在画布边缘随机生成敌人
                let x, y;
                const side = Math.floor(Math.random() * 4);
                
                switch (side) {
                    case 0: // 上边
                        x = Math.random() * this.canvas.width;
                        y = -20;
                        break;
                    case 1: // 右边
                        x = this.canvas.width + 20;
                        y = Math.random() * this.canvas.height;
                        break;
                    case 2: // 下边
                        x = Math.random() * this.canvas.width;
                        y = this.canvas.height + 20;
                        break;
                    case 3: // 左边
                        x = -20;
                        y = Math.random() * this.canvas.height;
                        break;
                }
                
                // 高等级时更倾向于生成强敌
                let typeIndex;
                if (level >= 5 && Math.random() < 0.7) {
                    // 5级以上70%概率生成强敌
                    typeIndex = GameConfig.enemies.types.length - 1;
                } else {
                    typeIndex = Math.floor(Math.random() * GameConfig.enemies.types.length);
                }
                
                const enemyType = GameConfig.enemies.types[typeIndex];
                const enemy = new Enemy(x, y, enemyType);
                this.enemies.push(enemy);
            }
            
            this.lastEnemySpawn = 0;
        }
    }
    
    /**
     * 生成宝箱
     * @param {number} deltaTime - 时间间隔
     */
    spawnTreasureBoxes(deltaTime) {
        this.lastTreasureSpawn += deltaTime * 1000;
        
        // 只有在宝箱数量未达到上限时才生成新宝箱
        if (this.lastTreasureSpawn >= this.treasureSpawnRate && this.treasureBoxes.length < this.maxTreasureBoxes) {
            let attempts = 0;
            const maxAttempts = 10;
            
            while (attempts < maxAttempts) {
                // 在画布内随机位置生成宝箱
                const margin = 50;
                const x = margin + Math.random() * (this.canvas.width - margin * 2);
                const y = margin + Math.random() * (this.canvas.height - margin * 2);
                
                // 确保宝箱不会生成在玩家附近
                const dx = x - this.player.x;
                const dy = y - this.player.y;
                const playerDistance = Math.sqrt(dx * dx + dy * dy);
                
                if (playerDistance > 100) {
                    // 检查是否与现有宝箱位置重叠
                    let tooClose = false;
                    for (const existingBox of this.treasureBoxes) {
                        const boxDx = x - existingBox.x;
                        const boxDy = y - existingBox.y;
                        const boxDistance = Math.sqrt(boxDx * boxDx + boxDy * boxDy);
                        
                        if (boxDistance < 80) { // 宝箱之间至少保持80像素距离
                            tooClose = true;
                            break;
                        }
                    }
                    
                    if (!tooClose) {
                        const treasureBox = new TreasureBox(x, y);
                        this.treasureBoxes.push(treasureBox);
                        this.lastTreasureSpawn = 0;
                        break;
                    }
                }
                
                attempts++;
            }
            
            // 如果尝试多次都无法找到合适位置，重置计时器稍后再试
            if (attempts >= maxAttempts) {
                this.lastTreasureSpawn = 0;
            }
        }
    }
    
    /**
     * 生成Boss
     */
    spawnBoss() {
        // 在画布中心生成Boss
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        this.boss = new Boss(x, y);
        this.enemies.push(this.boss);
        
        // 显示Boss出现提示
        this.showBossMessage();
    }
    
    /**
     * 显示Boss出现消息
     */
    showBossMessage() {
        // 创建Boss出现提示
        const message = document.createElement('div');
        message.textContent = '🐉 BOSS出现了！';
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(139, 0, 0, 0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 1000;
            animation: bossAppear 3s ease-out forwards;
        `;
        
        // 添加CSS动画
        if (!document.querySelector('#bossAnimation')) {
            const style = document.createElement('style');
            style.id = 'bossAnimation';
            style.textContent = `
                @keyframes bossAppear {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(message);
        
        // 3秒后移除消息
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }
    
    /**
     * 处理临时增益效果
     */
    updateTemporaryEffects() {
        const currentTime = Date.now();
        
        // 处理速度增益
        if (this.speedBoostEndTime > 0 && currentTime < this.speedBoostEndTime) {
            this.player.moveSpeed = this.originalMoveSpeed * 1.5;
        } else if (this.speedBoostEndTime > 0 && currentTime >= this.speedBoostEndTime) {
            this.player.moveSpeed = this.originalMoveSpeed;
            this.speedBoostEndTime = 0;
        }
        
        // 伤害增益在武器更新时处理
        if (this.damageBoostEndTime > 0 && currentTime >= this.damageBoostEndTime) {
            this.damageBoostEndTime = 0;
        }
    }
    
    /**
     * 处理碰撞检测
     */
    handleCollisions() {
        // 武器与敌人的碰撞
        for (let i = this.weapons.length - 1; i >= 0; i--) {
            const weapon = this.weapons[i];
            let weaponHit = false;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (CollisionDetector.circleCollision(weapon, enemy)) {
                    // 确保武器伤害值有效
                    const damage = Number(weapon.damage) || 10;
                    console.log(`武器攻击敌人: 武器等级=${weapon.weaponLevel}, 伤害=${damage}, 敌人当前血量=${enemy.health}`);
                    
                    // 播放攻击音效
                    this.playAttackSound();
                    
                    // 敌人受到伤害
                    enemy.takeDamage(damage);
                    
                    console.log(`攻击后敌人血量=${enemy.health}, 是否死亡=${enemy.isDead()}`);
                    
                    // 标记武器命中
                    weaponHit = true;
                    
                    // 如果敌人死亡，生成经验球
                    if (enemy.isDead()) {
                        const orb = new ExperienceOrb(enemy.x, enemy.y, enemy.expValue);
                        this.experienceOrbs.push(orb);
                        
                        // 检查是否是Boss被击败
                        if (enemy === this.boss) {
                            this.boss = null;
                            this.victory(); // Boss被击败，游戏胜利
                            return;
                        }
                        
                        this.enemies.splice(j, 1);
                        this.killCount++;
                        console.log(`敌人死亡，移除敌人`);
                    }
                    
                    break;
                }
            }
            
            // 如果武器命中了敌人，移除武器
            if (weaponHit) {
                this.weapons.splice(i, 1);
                console.log(`武器命中敌人，移除武器`);
            }
        }
        
        // 玩家与敌人的碰撞
        this.enemies.forEach(enemy => {
            if (CollisionDetector.circleCollision(this.player, enemy)) {
                // 只有在玩家不处于无敌状态时才造成伤害
                if (!this.player.isInvulnerable) {
                    this.player.takeDamage(enemy.damage);
                }
            }
        });
        
        // 玩家与经验球的碰撞
        for (let i = this.experienceOrbs.length - 1; i >= 0; i--) {
            const orb = this.experienceOrbs[i];
            
            if (CollisionDetector.circleCollision(this.player, orb)) {
                const leveledUp = this.player.gainExperience(orb.value);
                this.experienceOrbs.splice(i, 1);
                
                if (leveledUp) {
                    this.showLevelUpModal();
                }
            }
        }
        
        // 玩家与宝箱的碰撞
        for (let i = this.treasureBoxes.length - 1; i >= 0; i--) {
            const box = this.treasureBoxes[i];
            
            if (CollisionDetector.circleCollision(this.player, box)) {
                this.applyTreasureReward(box.reward);
                this.showTreasureMessage(box.reward.description);
                this.treasureBoxes.splice(i, 1);
            }
        }
    }
    
    /**
     * 清理死亡的对象
     */
    cleanup() {
        // 清理死亡的敌人
        this.enemies = this.enemies.filter(enemy => !enemy.isDead());
        
        // 清理超出边界的对象
        const margin = 100;
        this.enemies = this.enemies.filter(enemy => {
            return enemy.x > -margin && enemy.x < this.canvas.width + margin &&
                   enemy.y > -margin && enemy.y < this.canvas.height + margin;
        });
        
        this.experienceOrbs = this.experienceOrbs.filter(orb => {
            return orb.x > -margin && orb.x < this.canvas.width + margin &&
                   orb.y > -margin && orb.y < this.canvas.height + margin;
        });
        
        // 清理超出边界的宝箱
        this.treasureBoxes = this.treasureBoxes.filter(box => {
            return box.x > -margin && box.x < this.canvas.width + margin &&
                   box.y > -margin && box.y < this.canvas.height + margin;
        });
    }
    
    /**
     * 应用宝箱奖励
     * @param {Object} reward - 奖励对象
     */
    applyTreasureReward(reward) {
        const currentTime = Date.now();
        
        switch (reward.type) {
            case 'weapon':
                // 添加武器
                for (let i = 0; i < reward.count && this.weapons.length < GameConfig.weapons.maxCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const weapon = new Weapon(this.player.x, this.player.y, angle, this.currentWeaponLevel);
                    this.weapons.push(weapon);
                }
                break;
                
            case 'heal':
                // 恢复血量
                this.player.heal(reward.amount);
                break;
                
            case 'speed':
                // 速度增益
                this.speedBoostEndTime = currentTime + reward.duration;
                break;
                
            case 'damage':
                // 伤害增益
                this.damageBoostEndTime = currentTime + reward.duration;
                break;
                
            case 'magnet':
                // 吸铁石效果
                this.magnetEndTime = currentTime + reward.duration;
                break;
        }
    }
    
    /**
     * 显示宝箱奖励消息
     * @param {string} message - 消息内容
     */
    showTreasureMessage(message) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = 'treasure-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            animation: treasureMessageAnim 2s ease-out forwards;
        `;
        
        // 添加动画样式
        if (!document.querySelector('#treasureMessageStyle')) {
            const style = document.createElement('style');
            style.id = 'treasureMessageStyle';
            style.textContent = `
                @keyframes treasureMessageAnim {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                    40% { transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -60%) scale(1); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageEl);
        
        // 2秒后移除消息
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 2000);
    }
    
    /**
     * 显示升级模态框
     */
    showLevelUpModal() {
        this.gameState = 'levelUp';
        
        // 从5种成长技能中随机选择3个
        const availableSkills = [...GameConfig.growthSkills];
        const selectedSkills = [];
        
        for (let i = 0; i < 3 && availableSkills.length > 0; i++) {
            const index = Math.floor(Math.random() * availableSkills.length);
            selectedSkills.push(availableSkills.splice(index, 1)[0]);
        }
        
        // 更新技能卡片
        const skillCards = document.querySelectorAll('.skill-card');
        selectedSkills.forEach((skill, index) => {
            if (skillCards[index]) {
                skillCards[index].querySelector('.skill-icon').textContent = skill.icon;
                skillCards[index].querySelector('.skill-name').textContent = skill.name;
                skillCards[index].querySelector('.skill-desc').textContent = skill.description;
                skillCards[index].dataset.skillId = skill.id;
                skillCards[index].style.display = 'block';
            }
        });
        
        // 隐藏未使用的技能卡片
        for (let i = selectedSkills.length; i < skillCards.length; i++) {
            skillCards[i].style.display = 'none';
        }
        
        document.getElementById('skillModal').classList.remove('hidden');
    }
    

    
    /**
     * 选择技能
     * @param {number} index - 技能索引
     */
    selectSkill(index) {
        const skillCard = document.querySelectorAll('.skill-card')[index];
        const skillId = skillCard.dataset.skillId;
        const skill = GameConfig.growthSkills.find(s => s.id === skillId);
        
        if (skill) {
            this.applySkill(skill);
        }
        
        document.getElementById('skillModal').classList.add('hidden');
        this.gameState = 'playing';
    }
    
    /**
     * 应用技能效果
     * @param {Object} skill - 技能对象
     */
    applySkill(skill) {
        switch (skill.id) {
            case 'weaponUpgrade':
                // 刀升级：提升武器等级
                const oldGlobalLevel = this.currentWeaponLevel;
                if (this.currentWeaponLevel < 10) {
                    this.currentWeaponLevel++;
                    console.log(`⚔️ 全局武器升级: ${oldGlobalLevel} → ${this.currentWeaponLevel}`);
                    console.log(`📊 当前场上武器数量: ${this.weapons.length}`);
                    
                    // 使用新的updateWeaponLevel方法更新所有现有武器
                    this.weapons.forEach((weapon, index) => {
                        console.log(`🔄 更新第${index + 1}把武器...`);
                        weapon.updateWeaponLevel(this.currentWeaponLevel);
                    });
                    
                    // 显示升级提示信息
                    const weaponType = GameConfig.weapons.types[this.currentWeaponLevel - 1];
                    if (weaponType) {
                        console.log(`✅ 所有武器已升级为: ${weaponType.name}`);
                    } else {
                        console.error(`❌ 武器类型获取失败，等级: ${this.currentWeaponLevel}`);
                    }
                } else {
                    console.log(`⚠️ 武器已达到最高等级 (${this.currentWeaponLevel})，无法继续升级`);
                }
                break;
            case 'weaponCount':
                // 刀数量：增加武器数量
                this.weaponSpawnCount += 1;
                break;
            case 'rotationSpeed':
                // 转速提升：增加武器旋转速度
                this.weaponRotationSpeed += 0.02;
                break;
            case 'moveSpeed':
                // 移动速度：增加玩家移动速度
                this.player.speed += 0.5;
                break;
            case 'healthMax':
                // 血量上限：增加最大生命值并恢复生命
                this.player.maxHealth += 20;
                this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
                break;
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState = 'gameOver';
        
        // 停止背景音乐
        this.stopBackgroundMusic();
        
        // 更新游戏结束统计
        document.getElementById('gameOverTitle').textContent = '游戏失败';
        document.getElementById('finalLevel').textContent = this.player.level;
        document.getElementById('killCount').textContent = this.killCount;
        document.getElementById('survivalTime').textContent = Math.floor(this.gameTime);
        
        document.getElementById('gameOverModal').classList.remove('hidden');
    }
    
    /**
     * 游戏胜利
     */
    victory() {
        this.gameState = 'victory';
        
        // 停止背景音乐
        this.stopBackgroundMusic();
        
        // 更新游戏胜利统计
        document.getElementById('gameOverTitle').textContent = '游戏胜利！';
        document.getElementById('finalLevel').textContent = this.player.level;
        document.getElementById('killCount').textContent = this.killCount;
        document.getElementById('survivalTime').textContent = Math.floor(this.gameTime);
        
        document.getElementById('gameOverModal').classList.remove('hidden');
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        if (!this.player) return;
        
        // 更新血量条
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('healthBar').style.width = `${healthPercent}%`;
        document.getElementById('healthText').textContent = `${this.player.health}/${this.player.maxHealth}`;
        
        // 更新经验条
        const requiredExp = this.player.getRequiredExperience();
        const expPercent = (this.player.experience / requiredExp) * 100;
        document.getElementById('expBar').style.width = `${expPercent}%`;
        document.getElementById('expText').textContent = `${this.player.experience}/${requiredExp}`;
        
        // 更新等级
        document.getElementById('levelText').textContent = this.player.level;
        
        // 更新武器数量
        document.getElementById('weaponCount').textContent = this.weapons.length;
    }
    
    /**
     * 渲染游戏画面
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#2d5016';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制草地纹理
        this.renderBackground();
        
        // 渲染经验球
        this.experienceOrbs.forEach(orb => orb.render(this.ctx));
        
        // 渲染宝箱
        this.treasureBoxes.forEach(box => box.render(this.ctx));
        
        // 渲染敌人
        this.enemies.forEach(enemy => enemy.render(this.ctx));
        
        // 渲染玩家
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // 渲染武器
        this.weapons.forEach(weapon => weapon.render(this.ctx));
    }
    
    /**
     * 预加载音频资源
     */
    async preloadAudioResources() {
        this.audioManager.isLoading = true;
        this.audioManager.loadedResources = 0;
        this.audioManager.loadingProgress = 0;
        
        // 显示加载提示
        this.showLoadingScreen();
        
        try {
            // 创建音频加载Promise数组
            const loadPromises = [];
            
            // 预加载背景音乐
            const bgmPromise = this.loadAudioResource(
                'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/bgm.mp3',
                'bgm'
            );
            loadPromises.push(bgmPromise);
            
            // 预加载攻击音效
            const attackPromise = this.loadAudioResource(
                'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/sword.mp3',
                'attackSound'
            );
            loadPromises.push(attackPromise);
            
            // 等待所有音频资源加载完成
            await Promise.all(loadPromises);
            
            this.audioManager.isLoading = false;
            this.audioManager.loadingProgress = 100;
            
            console.log('所有音频资源预加载完成');
            
            // 隐藏加载界面，显示开始界面
            this.hideLoadingScreen();
            
        } catch (error) {
            console.warn('音频资源预加载失败:', error);
            this.audioManager.isLoading = false;
            
            // 即使加载失败也要显示开始界面
            this.hideLoadingScreen();
        }
    }
    
    /**
     * 加载单个音频资源
     * @param {string} url - 音频文件URL
     * @param {string} type - 音频类型 ('bgm' 或 'attackSound')
     * @returns {Promise} 加载Promise
     */
    loadAudioResource(url, type) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            
            // 音频加载成功回调
            audio.addEventListener('canplaythrough', () => {
                // 配置音频属性
                if (type === 'bgm') {
                    audio.loop = true;
                    audio.volume = this.audioManager.volume * 0.3;
                    this.audioManager.bgm = audio;
                } else if (type === 'attackSound') {
                    audio.volume = this.audioManager.volume;
                    this.audioManager.attackSound = audio;
                }
                
                // 更新加载进度
                this.audioManager.loadedResources++;
                this.audioManager.loadingProgress = 
                    (this.audioManager.loadedResources / this.audioManager.totalResources) * 100;
                
                this.updateLoadingProgress();
                
                console.log(`音频资源 ${type} 加载完成`);
                resolve(audio);
            });
            
            // 音频加载失败回调
            audio.addEventListener('error', (error) => {
                console.warn(`音频资源 ${type} 加载失败:`, error);
                
                // 即使失败也要更新进度
                this.audioManager.loadedResources++;
                this.audioManager.loadingProgress = 
                    (this.audioManager.loadedResources / this.audioManager.totalResources) * 100;
                
                this.updateLoadingProgress();
                
                // 创建空的音频对象作为备用
                if (type === 'bgm') {
                    this.audioManager.bgm = new Audio();
                } else if (type === 'attackSound') {
                    this.audioManager.attackSound = new Audio();
                }
                
                resolve(null); // 不reject，让游戏继续运行
            });
            
            // 开始加载
            audio.src = url;
            audio.preload = 'auto';
            audio.load();
        });
    }
    
    /**
     * 播放背景音乐
     */
    playBackgroundMusic() {
        if (this.audioManager.bgm && !this.audioManager.muted) {
            try {
                this.audioManager.bgm.currentTime = 0;
                const playPromise = this.audioManager.bgm.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('背景音乐播放失败:', error);
                    });
                }
            } catch (error) {
                console.warn('背景音乐播放失败:', error);
            }
        }
    }
    
    /**
     * 播放攻击音效
     */
    playAttackSound() {
        if (this.audioManager.attackSound && !this.audioManager.muted) {
            try {
                // 克隆音频对象以支持快速连续播放
                const sound = this.audioManager.attackSound.cloneNode();
                sound.volume = this.audioManager.volume;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.warn('攻击音效播放失败:', error);
                    });
                }
            } catch (error) {
                console.warn('攻击音效播放失败:', error);
            }
        }
    }
    
    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        if (this.audioManager.bgm) {
            this.audioManager.bgm.pause();
            this.audioManager.bgm.currentTime = 0;
        }
    }
    
    /**
     * 切换音频静音状态
     */
    toggleMute() {
        this.audioManager.muted = !this.audioManager.muted;
        if (this.audioManager.muted) {
            this.stopBackgroundMusic();
        } else if (this.gameState === 'playing') {
            this.playBackgroundMusic();
        }
    }
    
    /**
     * 加载背景图片
     */
    loadBackgroundImage() {
        this.backgroundImage = new Image();
        this.backgroundImage.crossOrigin = 'anonymous'; // 允许跨域加载
        
        // 图片加载成功回调
        this.backgroundImage.onload = () => {
            this.backgroundImageLoaded = true;
            console.log('背景图片加载成功');
        };
        
        // 图片加载失败回调
        this.backgroundImage.onerror = () => {
            console.warn('背景图片加载失败，将使用默认草地纹理');
            this.backgroundImageLoaded = false;
        };
        
        // 设置图片源（GitHub raw链接）
        this.backgroundImage.src = 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/knife_turning/bg.png';
    }
    
    /**
     * 渲染背景
     */
    renderBackground() {
        if (this.backgroundImageLoaded && this.backgroundImage) {
            // 使用背景图片
            this.renderBackgroundImage();
        } else {
            // 使用默认草地纹理
            this.renderDefaultBackground();
        }
    }
    
    /**
     * 渲染背景图片
     */
    renderBackgroundImage() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const imageWidth = this.backgroundImage.width;
        const imageHeight = this.backgroundImage.height;
        
        // 计算缩放比例，保持9:16宽高比并填满画布
        const canvasRatio = canvasWidth / canvasHeight;
        const imageRatio = imageWidth / imageHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (canvasRatio > imageRatio) {
            // 画布比图片更宽，以宽度为准缩放
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imageRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        } else {
            // 画布比图片更高，以高度为准缩放
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imageRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }
        
        // 绘制背景图片
        this.ctx.drawImage(
            this.backgroundImage,
            offsetX, offsetY,
            drawWidth, drawHeight
        );
    }
    
    /**
     * 渲染默认草地纹理背景
     */
    renderDefaultBackground() {
        // 绘制简单的草地纹理
        this.ctx.fillStyle = '#4a7c23';
        for (let x = 0; x < this.canvas.width; x += 40) {
            for (let y = 0; y < this.canvas.height; y += 40) {
                if ((x + y) % 80 === 0) {
                    this.ctx.fillRect(x, y, 20, 20);
                }
            }
        }
    }
}

// 游戏初始化
let game;

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    game = new GameEngine();
});

/**
 * 防止页面滚动和缩放
 */
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});