// 转刀游戏主脚本文件
// 作者: SOLO Coding AI
// 功能: 实现完整的转刀游戏逻辑

/**
 * 游戏配置常量
 */
const GameConfig = {
    canvas: {
        desktop: { width: 800, height: 600 },
        mobile: { aspectRatio: 16/10, minWidth: 320 }
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
        size: 20
    },
    weapons: {
        baseRotationSpeed: 2,
        baseDamage: 25,
        spawnInterval: 2000,
        maxCount: 1000,
        radius: 60
    },
    enemies: {
        spawnRate: 800, // 减少基础生成间隔，从1000ms改为800ms
        types: [
            { health: 50, damage: 5, speed: 50, exp: 10, size: 15, color: '#ff4444' },
            { health: 100, damage: 10, speed: 30, exp: 25, size: 20, color: '#ff6666' }
        ]
    },
    skills: [
        { id: 'weaponSpawn', name: '刀生成速度', effect: 'spawnRate', value: -500, icon: '🔄' },
        { id: 'moveSpeed', name: '移动速度增加', effect: 'moveSpeed', value: 50, icon: '🏃' },
        { id: 'heal', name: '血量增加', effect: 'health', value: 50, icon: '❤️' },
        { id: 'weaponCount', name: '刀生成数量+1', effect: 'weaponCount', value: 1, icon: '⚔️' }
    ],
    experience: {
        baseRequired: 100,
        multiplier: 1.5
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
        // 触摸开始
        this.base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleTouchStart(e.touches[0]);
        }, { passive: false });
        
        // 触摸移动
        document.addEventListener('touchmove', (e) => {
            if (this.isActive) {
                e.preventDefault();
                this.handleTouchMove(e.touches[0]);
            }
        }, { passive: false });
        
        // 触摸结束
        document.addEventListener('touchend', () => {
            this.handleTouchEnd();
        });
    }
    
    /**
     * 处理触摸开始事件
     * @param {Touch} touch - 触摸对象
     */
    handleTouchStart(touch) {
        this.isActive = true;
        const rect = this.base.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.handleTouchMove(touch);
    }
    
    /**
     * 处理触摸移动事件
     * @param {Touch} touch - 触摸对象
     */
    handleTouchMove(touch) {
        if (!this.isActive) return;
        
        const deltaX = touch.clientX - this.centerX;
        const deltaY = touch.clientY - this.centerY;
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
        
        if (this.isMobile) {
            this.setupMobileControls();
        }
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
        
        if (this.isMobile && this.joystick) {
            const direction = this.joystick.getDirection();
            x = direction.x;
            y = direction.y;
        } else {
            // 键盘控制
            if (this.keys['KeyW'] || this.keys['ArrowUp']) y -= 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) y += 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
        }
        
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
    }
    
    /**
     * 渲染玩家
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 绘制玩家身体
        ctx.fillStyle = '#4444ff';
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
        
        ctx.restore();
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
     */
    constructor(playerX, playerY, angle) {
        super(playerX, playerY, 15, 30);
        this.angle = angle;
        this.rotationSpeed = GameConfig.weapons.baseRotationSpeed;
        this.radius = GameConfig.weapons.radius;
        this.damage = GameConfig.weapons.baseDamage;
        this.updatePosition(playerX, playerY);
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
     * 渲染武器
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);
        
        // 绘制刀身
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 绘制刀刃
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(-this.width / 4, -this.height / 2 + 5);
        ctx.lineTo(this.width / 4, -this.height / 2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // 绘制刀柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width / 3, this.height / 2 - 8, this.width * 2 / 3, 8);
        
        ctx.restore();
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
     * 渲染敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    render(ctx) {
        ctx.save();
        
        // 绘制敌人身体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制敌人边框
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
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
        
        ctx.restore();
    }
    
    /**
     * 受到伤害
     * @param {number} damage - 伤害值
     */
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
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
        
        // Boss标识
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BOSS', this.x, this.y + this.radius + 20);
        
        ctx.restore();
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
        
        // 临时增益效果
        this.speedBoostEndTime = 0;
        this.damageBoostEndTime = 0;
        this.magnetEndTime = 0; // 吸铁石效果结束时间
        this.originalMoveSpeed = GameConfig.player.moveSpeed;
        this.originalWeaponDamage = GameConfig.weapons.baseDamage;
        
        this.setupCanvas();
        this.setupUI();
        this.showStartScreen();
    }
    
    /**
     * 设置画布
     */
    setupCanvas() {
        CanvasAdapter.resizeCanvas(this.canvas, this.isMobile);
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            CanvasAdapter.resizeCanvas(this.canvas, this.isMobile);
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
        document.getElementById('startScreen').classList.add('hidden');
        this.gameState = 'playing';
        
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
        if (this.player.level >= 10 && !this.bossSpawned && this.enemies.length === 0) {
            this.spawnBoss();
            this.bossSpawned = true;
        }
        
        // 生成武器
        this.spawnWeapons(deltaTime);
        
        // 生成敌人
        this.spawnEnemies(deltaTime);
        
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
                const weapon = new Weapon(this.player.x, this.player.y, angle);
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
        
        // 更激进的速度倍数：每级减少15%，最小保持5%（20倍速度）
        const levelSpeedMultiplier = Math.max(0.05, 1 - (level - 1) * 0.15);
        const dynamicSpawnRate = GameConfig.enemies.spawnRate * levelSpeedMultiplier;
        
        // 根据等级决定同时生成的敌人数量
        // 1-3级：1个，4-6级：2个，7-9级：3个，10级以上：4个
        const enemyCount = Math.min(4, Math.floor((level - 1) / 3) + 1);
        
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
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                
                if (CollisionDetector.circleCollision(weapon, enemy)) {
                    // 敌人受到伤害
                    enemy.takeDamage(weapon.damage);
                    
                    // 移除武器
                    this.weapons.splice(i, 1);
                    
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
                    }
                    
                    break;
                }
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
                    const weapon = new Weapon(this.player.x, this.player.y, angle);
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
        
        // 随机选择3个技能
        const availableSkills = [...GameConfig.skills];
        const selectedSkills = [];
        
        for (let i = 0; i < 3 && availableSkills.length > 0; i++) {
            const index = Math.floor(Math.random() * availableSkills.length);
            selectedSkills.push(availableSkills.splice(index, 1)[0]);
        }
        
        // 更新技能卡片，隐藏第四个卡片
        const skillCards = document.querySelectorAll('.skill-card');
        selectedSkills.forEach((skill, index) => {
            if (skillCards[index]) {
                skillCards[index].querySelector('.skill-icon').textContent = skill.icon;
                skillCards[index].querySelector('.skill-name').textContent = skill.name;
                skillCards[index].querySelector('.skill-desc').textContent = this.getSkillDescription(skill);
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
     * 获取技能描述
     * @param {Object} skill - 技能对象
     * @returns {string} 技能描述
     */
    getSkillDescription(skill) {
        switch (skill.id) {
            case 'weaponSpawn':
                return `武器生成间隔减少 ${Math.abs(skill.value)}ms`;
            case 'heal':
                return `立即恢复 ${skill.value} 点血量`;
            case 'moveSpeed':
                return `移动速度增加 ${skill.value}`;
            case 'weaponCount':
                return `每次生成武器数量增加 ${skill.value}`;
            default:
                return skill.name;
        }
    }
    
    /**
     * 选择技能
     * @param {number} index - 技能索引
     */
    selectSkill(index) {
        const skillCard = document.querySelectorAll('.skill-card')[index];
        const skillId = skillCard.dataset.skillId;
        const skill = GameConfig.skills.find(s => s.id === skillId);
        
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
        switch (skill.effect) {
            case 'spawnRate':
                this.weaponSpawnRate = Math.max(500, this.weaponSpawnRate + skill.value);
                break;
            case 'health':
                this.player.heal(skill.value);
                break;
            case 'moveSpeed':
                this.player.moveSpeed += skill.value;
                break;
            case 'weaponCount':
                this.weaponSpawnCount += skill.value;
                break;
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState = 'gameOver';
        
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
     * 渲染背景
     */
    renderBackground() {
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