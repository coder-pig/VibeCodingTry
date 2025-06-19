/**
 * TD塔防游戏 - 主要JavaScript文件
 * 基于Canvas 2D API开发的纯前端塔防游戏
 */

// 游戏主命名空间
const TowerDefense = {
    // 引擎核心
    Engine: {},
    // 游戏实体
    Entities: {},
    // 游戏系统
    Systems: {},
    // 配置数据
    Data: {},
    // 工具函数
    Utils: {}
};

// ==================== 工具函数 ====================
TowerDefense.Utils = {
    /**
     * 计算两点之间的距离
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    /**
     * 计算两点之间的角度
     */
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    /**
     * 限制数值在指定范围内
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * 线性插值
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    /**
     * 检查点是否在矩形内
     */
    pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
};

// ==================== 配置数据 ====================
TowerDefense.Data = {
    // 塔配置
    TowerConfig: {
        arrow: {
            name: '箭塔',
            cost: 50,
            damage: 15,
            range: 120,
            attackSpeed: 1.2,
            icon: '🏹',
            color: '#8B4513',
            projectileSpeed: 300,
            upgrades: {
                damage: [20, 30, 45],
                range: [140, 160, 200],
                attackSpeed: [1.5, 2.0, 2.5],
                cost: [75, 150, 300]
            }
        },
        cannon: {
            name: '炮塔',
            cost: 100,
            damage: 40,
            range: 100,
            attackSpeed: 0.8,
            icon: '💣',
            color: '#696969',
            projectileSpeed: 200,
            splashRadius: 50,
            upgrades: {
                damage: [60, 90, 140],
                range: [120, 140, 180],
                attackSpeed: [1.0, 1.2, 1.5],
                cost: [150, 300, 600]
            }
        },
        ice: {
            name: '寒冰塔',
            cost: 80,
            damage: 10,
            range: 110,
            attackSpeed: 1.0,
            icon: '❄️',
            color: '#87CEEB',
            projectileSpeed: 250,
            slowEffect: 0.5,
            slowDuration: 2000,
            upgrades: {
                damage: [15, 25, 40],
                range: [130, 150, 190],
                attackSpeed: [1.3, 1.6, 2.0],
                cost: [120, 240, 480]
            }
        },
        poison: {
            name: '毒塔',
            cost: 120,
            damage: 8,
            range: 90,
            attackSpeed: 1.5,
            icon: '☠️',
            color: '#9ACD32',
            projectileSpeed: 280,
            poisonDamage: 5,
            poisonDuration: 3000,
            upgrades: {
                damage: [12, 20, 35],
                range: [110, 130, 170],
                attackSpeed: [1.8, 2.2, 2.8],
                cost: [180, 360, 720]
            }
        }
    },

    // 敌人配置
    EnemyConfig: {
        grunt: {
            name: '小鬼',
            health: 50,
            speed: 60,
            reward: 10,
            icon: '👹',
            color: '#FF6347',
            size: 15
        },
        runner: {
            name: '狼骑兵',
            health: 30,
            speed: 120,
            reward: 15,
            icon: '🐺',
            color: '#8B4513',
            size: 12
        },
        tank: {
            name: '石头人',
            health: 150,
            speed: 30,
            reward: 25,
            icon: '🗿',
            color: '#708090',
            size: 20
        },
        boss: {
            name: 'Boss',
            health: 500,
            speed: 40,
            reward: 100,
            icon: '👺',
            color: '#8B0000',
            size: 25
        }
    },

    // 波次数据
    WaveData: [
        { enemies: [{ type: 'grunt', count: 5, interval: 1000 }] },
        { enemies: [{ type: 'grunt', count: 8, interval: 800 }] },
        { enemies: [{ type: 'grunt', count: 6, interval: 1000 }, { type: 'runner', count: 3, interval: 1500 }] },
        { enemies: [{ type: 'grunt', count: 10, interval: 600 }, { type: 'runner', count: 5, interval: 1200 }] },
        { enemies: [{ type: 'grunt', count: 8, interval: 800 }, { type: 'tank', count: 2, interval: 2000 }] },
        { enemies: [{ type: 'grunt', count: 12, interval: 500 }, { type: 'runner', count: 6, interval: 1000 }, { type: 'tank', count: 3, interval: 1800 }] },
        { enemies: [{ type: 'grunt', count: 15, interval: 400 }, { type: 'runner', count: 8, interval: 800 }, { type: 'tank', count: 4, interval: 1500 }] },
        { enemies: [{ type: 'grunt', count: 10, interval: 600 }, { type: 'runner', count: 10, interval: 700 }, { type: 'tank', count: 5, interval: 1200 }] },
        { enemies: [{ type: 'grunt', count: 20, interval: 300 }, { type: 'runner', count: 12, interval: 600 }, { type: 'tank', count: 6, interval: 1000 }] },
        { enemies: [{ type: 'grunt', count: 15, interval: 500 }, { type: 'runner', count: 10, interval: 800 }, { type: 'tank', count: 8, interval: 1000 }, { type: 'boss', count: 1, interval: 5000 }] }
    ],

    // 地图数据 - 10x10格子地图
    MapData: {
        width: 800,
        height: 600,
        gridSize: 60, // 每个格子的大小
        gridCols: 10, // 列数
        gridRows: 10, // 行数
        offsetX: 100, // X偏移量，让地图居中
        offsetY: 0,   // Y偏移量
        
        // 怪物行进路径 - 红色格子 (格子坐标)
        pathGrid: [
            // 第一行路径 (从左到右)
            [0,2], [1,2], [2,2], [3,2], [4,2], [5,2], [6,2], [7,2],
            // 向下转弯
            [7,3], [7,4], [7,5], [7,6],
            // 第二段路径 (从右到左)
            [6,6], [5,6], [4,6], [3,6], [2,6],
            // 向下转弯
            [2,7], [2,8],
            // 第三段路径 (从左到右)
            [3,8], [4,8], [5,8], [6,8], [7,8], [8,8], [9,8],
            // 向上转弯到终点
            [9,7], [9,6], [9,5], [9,4], [9,3], [9,2], [9,1], [9,0],
            // 连接回起点的路径 (从右到左，顶部一行)
            [8,0], [7,0], [6,0], [5,0], [4,0], [3,0], [2,0], [1,0],
            // 向下回到起点
            [0,0], [0,1]
        ],
        
        // 怪物行进路径点 - 世界坐标
        pathPoints: [],
        
        // 可建造区域 - 绿色格子 (自动生成，排除路径格子)
        buildableAreas: []
    }
};

// ==================== 游戏实体类 ====================

/**
 * 游戏对象基类
 */
TowerDefense.Entities.GameObject = class {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
    }

    /**
     * 更新游戏对象
     */
    update(deltaTime) {
        // 子类重写
    }

    /**
     * 渲染游戏对象
     */
    render(ctx) {
        // 子类重写
    }

    /**
     * 销毁游戏对象
     */
    destroy() {
        this.active = false;
    }
};

/**
 * 塔基类
 */
TowerDefense.Entities.Tower = class extends TowerDefense.Entities.GameObject {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.config = TowerDefense.Data.TowerConfig[type];
        this.level = 1;
        this.damage = this.config.damage;
        this.range = this.config.range;
        this.attackSpeed = this.config.attackSpeed;
        this.target = null;
        this.lastAttackTime = 0;
        this.size = 30;
        this.selected = false;
    }

    /**
     * 更新塔的逻辑
     */
    update(deltaTime, enemies) {
        // 寻找目标
        this.findTarget(enemies);
        
        // 攻击目标
        if (this.target && Date.now() - this.lastAttackTime > 1000 / this.attackSpeed) {
            this.attack();
            this.lastAttackTime = Date.now();
        }
    }

    /**
     * 寻找攻击目标
     */
    findTarget(enemies) {
        let closestEnemy = null;
        let closestDistance = Infinity;

        for (let enemy of enemies) {
            if (!enemy.active) continue;
            
            const distance = TowerDefense.Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (distance <= this.range && distance < closestDistance) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        }

        this.target = closestEnemy;
    }

    /**
     * 攻击目标
     */
    attack() {
        if (!this.target) return;

        // 创建弹道
        const projectile = new TowerDefense.Entities.Projectile(
            this.x, this.y, this.target, this.damage, this.type
        );
        
        TowerDefense.Engine.Game.instance.addProjectile(projectile);
    }

    /**
     * 升级塔
     */
    upgrade() {
        if (this.level >= 4) return false;
        
        const upgrades = this.config.upgrades;
        const cost = upgrades.cost[this.level - 1];
        
        if (TowerDefense.Engine.Game.instance.gold >= cost) {
            TowerDefense.Engine.Game.instance.gold -= cost;
            
            this.damage = upgrades.damage[this.level - 1];
            this.range = upgrades.range[this.level - 1];
            this.attackSpeed = upgrades.attackSpeed[this.level - 1];
            this.level++;
            
            return true;
        }
        
        return false;
    }

    /**
     * 出售塔
     */
    sell() {
        const sellPrice = Math.floor(this.config.cost * 0.7 * this.level);
        TowerDefense.Engine.Game.instance.gold += sellPrice;
        this.destroy();
        return sellPrice;
    }

    /**
     * 渲染塔
     */
    render(ctx) {
        // 绘制射程圆圈（仅在选中时显示）
        if (this.selected) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 绘制塔身
        ctx.fillStyle = this.config.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        
        // 绘制塔的图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, this.x, this.y);
        
        // 绘制等级
        if (this.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.fillText(this.level, this.x + this.size/3, this.y - this.size/3);
        }
        
        // 绘制选中边框
        if (this.selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
    }

    /**
     * 检查点击
     */
    isClicked(x, y) {
        return TowerDefense.Utils.pointInRect(x, y, {
            x: this.x - this.size/2,
            y: this.y - this.size/2,
            width: this.size,
            height: this.size
        });
    }
};

/**
 * 敌人基类
 */
TowerDefense.Entities.Enemy = class extends TowerDefense.Entities.GameObject {
    constructor(type) {
        const startPoint = TowerDefense.Data.MapData.pathPoints[0];
        super(startPoint.x, startPoint.y);
        
        this.type = type;
        this.config = TowerDefense.Data.EnemyConfig[type];
        this.maxHealth = this.config.health;
        this.health = this.maxHealth;
        this.speed = this.config.speed;
        this.reward = this.config.reward;
        this.size = this.config.size;
        
        this.pathIndex = 0;
        this.pathProgress = 0;
        
        // 状态效果
        this.slowEffect = 1;
        this.slowEndTime = 0;
        this.poisonDamage = 0;
        this.poisonEndTime = 0;
        this.lastPoisonTick = 0;
    }

    /**
     * 更新敌人逻辑
     */
    update(deltaTime) {
        // 处理状态效果
        this.updateStatusEffects();
        
        // 移动（循环移动，不会到达终点）
        this.move(deltaTime);
    }

    /**
     * 更新状态效果
     */
    updateStatusEffects() {
        const now = Date.now();
        
        // 减速效果
        if (now > this.slowEndTime) {
            this.slowEffect = 1;
        }
        
        // 中毒效果
        if (now < this.poisonEndTime && now - this.lastPoisonTick > 500) {
            this.takeDamage(this.poisonDamage);
            this.lastPoisonTick = now;
        }
    }

    /**
     * 移动逻辑 - 循环移动
     */
    move(deltaTime) {
        const pathPoints = TowerDefense.Data.MapData.pathPoints;
        
        // 如果到达最后一个点，重新开始循环
        if (this.pathIndex >= pathPoints.length - 1) {
            this.pathIndex = 0;
            this.pathProgress = 0;
        }
        
        const currentPoint = pathPoints[this.pathIndex];
        const nextPoint = pathPoints[this.pathIndex + 1];
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            this.pathIndex++;
            return;
        }
        
        const moveDistance = this.speed * this.slowEffect * deltaTime / 1000;
        this.pathProgress += moveDistance / distance;
        
        if (this.pathProgress >= 1) {
            this.pathProgress = 0;
            this.pathIndex++;
            // 如果到达最后一个点，重新开始循环
            if (this.pathIndex >= pathPoints.length - 1) {
                this.pathIndex = 0;
            }
            this.x = pathPoints[this.pathIndex].x;
            this.y = pathPoints[this.pathIndex].y;
        } else {
            this.x = currentPoint.x + dx * this.pathProgress;
            this.y = currentPoint.y + dy * this.pathProgress;
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        this.health -= damage;
        
        // 显示伤害数字
        TowerDefense.Engine.Game.instance.showDamageText(this.x, this.y, damage);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * 应用减速效果
     */
    applySlow(factor, duration) {
        this.slowEffect = factor;
        this.slowEndTime = Date.now() + duration;
    }

    /**
     * 应用中毒效果
     */
    applyPoison(damage, duration) {
        this.poisonDamage = damage;
        this.poisonEndTime = Date.now() + duration;
    }

    /**
     * 死亡
     */
    die() {
        TowerDefense.Engine.Game.instance.gold += this.reward;
        TowerDefense.Engine.Game.instance.score += this.reward * 10;
        this.destroy();
    }



    /**
     * 渲染敌人
     */
    render(ctx) {
        // 绘制敌人身体
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制敌人图标
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.icon, this.x, this.y);
        
        // 绘制血条
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.y - this.size - 8;
        
        // 血条背景
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // 血条前景
        ctx.fillStyle = '#00FF00';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(this.x - barWidth/2, barY, barWidth * healthPercent, barHeight);
        
        // 状态效果指示
        if (this.slowEffect < 1) {
            ctx.fillStyle = '#87CEEB';
            ctx.beginPath();
            ctx.arc(this.x - this.size, this.y - this.size, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (Date.now() < this.poisonEndTime) {
            ctx.fillStyle = '#9ACD32';
            ctx.beginPath();
            ctx.arc(this.x + this.size, this.y - this.size, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

/**
 * 弹道类
 */
TowerDefense.Entities.Projectile = class extends TowerDefense.Entities.GameObject {
    constructor(x, y, target, damage, towerType) {
        super(x, y);
        this.target = target;
        this.damage = damage;
        this.towerType = towerType;
        this.config = TowerDefense.Data.TowerConfig[towerType];
        this.speed = this.config.projectileSpeed;
        this.size = 5;
        
        // 计算方向
        const angle = TowerDefense.Utils.angle(x, y, target.x, target.y);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    /**
     * 更新弹道
     */
    update(deltaTime) {
        // 移动
        this.x += this.vx * deltaTime / 1000;
        this.y += this.vy * deltaTime / 1000;
        
        // 检查是否击中目标
        if (this.target && this.target.active) {
            const distance = TowerDefense.Utils.distance(this.x, this.y, this.target.x, this.target.y);
            if (distance < this.target.size) {
                this.hit();
                return;
            }
        }
        
        // 检查是否超出边界
        if (this.x < 0 || this.x > 800 || this.y < 0 || this.y > 600) {
            this.destroy();
        }
    }

    /**
     * 击中目标
     */
    hit() {
        if (!this.target || !this.target.active) {
            this.destroy();
            return;
        }
        
        // 造成伤害
        this.target.takeDamage(this.damage);
        
        // 应用特殊效果
        switch (this.towerType) {
            case 'cannon':
                // 溅射伤害
                this.applySplashDamage();
                break;
            case 'ice':
                // 减速效果
                this.target.applySlow(this.config.slowEffect, this.config.slowDuration);
                break;
            case 'poison':
                // 中毒效果
                this.target.applyPoison(this.config.poisonDamage, this.config.poisonDuration);
                break;
        }
        
        this.destroy();
    }

    /**
     * 溅射伤害
     */
    applySplashDamage() {
        const enemies = TowerDefense.Engine.Game.instance.enemies;
        const splashRadius = this.config.splashRadius;
        
        for (let enemy of enemies) {
            if (!enemy.active || enemy === this.target) continue;
            
            const distance = TowerDefense.Utils.distance(this.x, this.y, enemy.x, enemy.y);
            if (distance <= splashRadius) {
                const splashDamage = Math.floor(this.damage * 0.5);
                enemy.takeDamage(splashDamage);
            }
        }
    }

    /**
     * 渲染弹道
     */
    render(ctx) {
        ctx.fillStyle = this.config.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
};

// ==================== 游戏系统 ====================

/**
 * 地图系统 - 10x10格子地图
 */
TowerDefense.Systems.MapSystem = class {
    constructor() {
        this.mapData = TowerDefense.Data.MapData;
        this.initializeMap();
    }

    /**
     * 初始化地图数据
     */
    initializeMap() {
        // 生成路径点的世界坐标
        this.mapData.pathPoints = [];
        for (let pathGrid of this.mapData.pathGrid) {
            const worldX = this.mapData.offsetX + pathGrid[0] * this.mapData.gridSize + this.mapData.gridSize / 2;
            const worldY = this.mapData.offsetY + pathGrid[1] * this.mapData.gridSize + this.mapData.gridSize / 2;
            this.mapData.pathPoints.push({ x: worldX, y: worldY });
        }
        
        // 生成可建造区域（排除路径格子）
        this.mapData.buildableAreas = [];
        const pathGridSet = new Set(this.mapData.pathGrid.map(grid => `${grid[0]},${grid[1]}`));
        
        for (let row = 0; row < this.mapData.gridRows; row++) {
            for (let col = 0; col < this.mapData.gridCols; col++) {
                const gridKey = `${col},${row}`;
                if (!pathGridSet.has(gridKey)) {
                    // 这个格子不是路径，可以建造
                    const x = this.mapData.offsetX + col * this.mapData.gridSize;
                    const y = this.mapData.offsetY + row * this.mapData.gridSize;
                    this.mapData.buildableAreas.push({
                        x: x,
                        y: y,
                        width: this.mapData.gridSize,
                        height: this.mapData.gridSize,
                        gridX: col,
                        gridY: row
                    });
                }
            }
        }
    }

    /**
     * 渲染地图
     */
    render(ctx) {
        // 清空画布
        ctx.fillStyle = '#F0F8FF';
        ctx.fillRect(0, 0, this.mapData.width, this.mapData.height);
        
        // 绘制格子背景
        this.renderGrid(ctx);
        
        // 绘制路径格子
        this.renderPathGrid(ctx);
        
        // 绘制可建造区域格子
        this.renderBuildableGrid(ctx);
    }

    /**
     * 渲染格子网格
     */
    renderGrid(ctx) {
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        
        // 绘制垂直线
        for (let col = 0; col <= this.mapData.gridCols; col++) {
            const x = this.mapData.offsetX + col * this.mapData.gridSize;
            ctx.beginPath();
            ctx.moveTo(x, this.mapData.offsetY);
            ctx.lineTo(x, this.mapData.offsetY + this.mapData.gridRows * this.mapData.gridSize);
            ctx.stroke();
        }
        
        // 绘制水平线
        for (let row = 0; row <= this.mapData.gridRows; row++) {
            const y = this.mapData.offsetY + row * this.mapData.gridSize;
            ctx.beginPath();
            ctx.moveTo(this.mapData.offsetX, y);
            ctx.lineTo(this.mapData.offsetX + this.mapData.gridCols * this.mapData.gridSize, y);
            ctx.stroke();
        }
    }

    /**
     * 渲染路径格子（红色）
     */
    renderPathGrid(ctx) {
        ctx.fillStyle = '#FF5252';
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 2;
        
        for (let pathGrid of this.mapData.pathGrid) {
            const x = this.mapData.offsetX + pathGrid[0] * this.mapData.gridSize;
            const y = this.mapData.offsetY + pathGrid[1] * this.mapData.gridSize;
            
            // 填充红色
            ctx.fillRect(x + 1, y + 1, this.mapData.gridSize - 2, this.mapData.gridSize - 2);
            
            // 绘制边框
            ctx.strokeRect(x + 1, y + 1, this.mapData.gridSize - 2, this.mapData.gridSize - 2);
        }
        
        // 绘制路径方向箭头
        this.renderPathArrows(ctx);
    }

    /**
     * 渲染路径方向箭头
     */
    renderPathArrows(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 从索引1开始，跳过起点[0,2]的箭头绘制
        for (let i = 1; i < this.mapData.pathGrid.length; i++) {
            const current = this.mapData.pathGrid[i];
            // 如果是最后一个点，下一个点是起点（形成循环）
            const next = i === this.mapData.pathGrid.length - 1 
                ? this.mapData.pathGrid[0] 
                : this.mapData.pathGrid[i + 1];
            
            const x = this.mapData.offsetX + current[0] * this.mapData.gridSize + this.mapData.gridSize / 2;
            const y = this.mapData.offsetY + current[1] * this.mapData.gridSize + this.mapData.gridSize / 2;
            
            // 计算方向
            const dx = next[0] - current[0];
            const dy = next[1] - current[1];
            
            let arrow = '→';
            if (dx > 0) arrow = '→';
            else if (dx < 0) arrow = '←';
            else if (dy > 0) arrow = '↓';
            else if (dy < 0) arrow = '↑';
            
            ctx.fillText(arrow, x, y);
        }
    }

    /**
     * 渲染可建造区域格子（绿色）
     */
    renderBuildableGrid(ctx) {
        for (let area of this.mapData.buildableAreas) {
            // 检查是否已有塔
            const hasTower = TowerDefense.Engine.Game.instance && 
                TowerDefense.Engine.Game.instance.towers.some(tower => 
                    tower.active && 
                    tower.x >= area.x && tower.x <= area.x + area.width &&
                    tower.y >= area.y && tower.y <= area.y + area.height
                );
            
            if (hasTower) {
                // 已有塔的区域显示为灰色
                ctx.fillStyle = 'rgba(128, 128, 128, 0.4)';
                ctx.strokeStyle = '#808080';
            } else {
                // 可建造区域显示为绿色
                ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
                ctx.strokeStyle = '#4CAF50';
            }
            
            ctx.lineWidth = 2;
            ctx.fillRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);
            ctx.strokeRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);
        }
    }

    /**
     * 检查位置是否可建造
     */
    canBuildAt(x, y) {
        for (let area of this.mapData.buildableAreas) {
            if (TowerDefense.Utils.pointInRect(x, y, area)) {
                // 检查是否已有塔
                const hasTower = TowerDefense.Engine.Game.instance.towers.some(tower => 
                    tower.active && 
                    tower.x >= area.x && tower.x <= area.x + area.width &&
                    tower.y >= area.y && tower.y <= area.y + area.height
                );
                
                if (!hasTower) {
                    return {
                        canBuild: true,
                        buildX: area.x + area.width / 2,
                        buildY: area.y + area.height / 2
                    };
                }
            }
        }
        
        return { canBuild: false };
    }
};

/**
 * 波次管理系统
 */
TowerDefense.Systems.WaveManager = class {
    constructor() {
        this.currentWave = 0;
        this.waveInProgress = false;
        this.enemySpawnQueue = [];
        this.nextSpawnTime = 0;
        this.waveStartTime = 0;
        this.timeBetweenWaves = 30000; // 30秒
        this.nextWaveTime = Date.now() + this.timeBetweenWaves;
    }

    /**
     * 更新波次管理
     */
    update() {
        const now = Date.now();
        
        if (!this.waveInProgress) {
            // 检查是否开始下一波
            if (now >= this.nextWaveTime) {
                this.startNextWave();
            }
        } else {
            // 生成敌人
            this.spawnEnemies();
            
            // 检查波次是否结束
            if (this.enemySpawnQueue.length === 0 && 
                TowerDefense.Engine.Game.instance.enemies.filter(e => e.active).length === 0) {
                this.endWave();
            }
        }
    }

    /**
     * 开始下一波
     */
    startNextWave() {
        if (this.currentWave >= TowerDefense.Data.WaveData.length) {
            // 游戏胜利
            TowerDefense.Engine.Game.instance.gameWin();
            return;
        }
        
        this.waveInProgress = true;
        this.waveStartTime = Date.now();
        
        // 准备敌人生成队列
        const waveData = TowerDefense.Data.WaveData[this.currentWave];
        this.enemySpawnQueue = [];
        
        for (let enemyGroup of waveData.enemies) {
            for (let i = 0; i < enemyGroup.count; i++) {
                this.enemySpawnQueue.push({
                    type: enemyGroup.type,
                    spawnTime: this.waveStartTime + i * enemyGroup.interval
                });
            }
        }
        
        // 按时间排序
        this.enemySpawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);
        
        this.currentWave++;
        
        // 更新UI
        this.updateUI();
    }

    /**
     * 生成敌人
     */
    spawnEnemies() {
        const now = Date.now();
        
        while (this.enemySpawnQueue.length > 0 && this.enemySpawnQueue[0].spawnTime <= now) {
            const enemyData = this.enemySpawnQueue.shift();
            const enemy = new TowerDefense.Entities.Enemy(enemyData.type);
            TowerDefense.Engine.Game.instance.addEnemy(enemy);
        }
    }

    /**
     * 结束当前波
     */
    endWave() {
        this.waveInProgress = false;
        this.nextWaveTime = Date.now() + this.timeBetweenWaves;
        
        // 波次奖励
        const bonus = this.currentWave * 10;
        TowerDefense.Engine.Game.instance.gold += bonus;
        TowerDefense.Engine.Game.instance.score += bonus * 5;
        
        this.updateUI();
    }

    /**
     * 手动开始下一波
     */
    startNextWaveEarly() {
        if (!this.waveInProgress && this.currentWave < TowerDefense.Data.WaveData.length) {
            // 提前开始奖励
            const timeBonus = Math.floor((this.nextWaveTime - Date.now()) / 1000);
            TowerDefense.Engine.Game.instance.gold += timeBonus;
            
            this.nextWaveTime = Date.now();
        }
    }

    /**
     * 更新UI
     */
    updateUI() {
        const waveNumberEl = document.getElementById('waveNumber');
        const enemiesLeftEl = document.getElementById('enemiesLeft');
        const waveCountdownEl = document.getElementById('waveCountdown');
        const nextWaveBtn = document.getElementById('nextWaveBtn');
        
        if (waveNumberEl) {
            waveNumberEl.textContent = `波次: ${this.currentWave}`;
        }
        
        if (enemiesLeftEl) {
            const activeEnemies = TowerDefense.Engine.Game.instance.enemies.filter(e => e.active).length;
            const queuedEnemies = this.enemySpawnQueue.length;
            enemiesLeftEl.textContent = `剩余敌人: ${activeEnemies + queuedEnemies}`;
        }
        
        if (waveCountdownEl && nextWaveBtn) {
            if (this.waveInProgress) {
                waveCountdownEl.textContent = '战斗中...';
                nextWaveBtn.disabled = true;
            } else if (this.currentWave >= TowerDefense.Data.WaveData.length) {
                waveCountdownEl.textContent = '游戏完成!';
                nextWaveBtn.disabled = true;
            } else {
                const timeLeft = Math.max(0, Math.ceil((this.nextWaveTime - Date.now()) / 1000));
                waveCountdownEl.textContent = `下一波: ${timeLeft}s`;
                nextWaveBtn.disabled = false;
                
                const bonus = Math.floor((this.nextWaveTime - Date.now()) / 1000);
                nextWaveBtn.textContent = `🚀 下一波 (+${bonus}💰)`;
            }
        }
    }
};

/**
 * UI管理系统
 */
TowerDefense.Systems.UIManager = class {
    constructor() {
        this.selectedTowerType = null;
        this.selectedTower = null;
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 塔建造按钮
        const towerButtons = document.querySelectorAll('.tower-btn');
        towerButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const towerType = btn.dataset.tower;
                this.selectTowerType(towerType);
            });
        });
        
        // 游戏控制按钮
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                TowerDefense.Engine.Game.instance.togglePause();
            });
        }
        
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            speedBtn.addEventListener('click', () => {
                TowerDefense.Engine.Game.instance.toggleSpeed();
            });
        }
        
        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                TowerDefense.Engine.Game.instance.restart();
            });
        }
        
        // 下一波按钮
        const nextWaveBtn = document.getElementById('nextWaveBtn');
        if (nextWaveBtn) {
            nextWaveBtn.addEventListener('click', () => {
                TowerDefense.Engine.Game.instance.waveManager.startNextWaveEarly();
            });
        }
        
        // 塔操作按钮
        const upgradeTowerBtn = document.getElementById('upgradeTowerBtn');
        if (upgradeTowerBtn) {
            upgradeTowerBtn.addEventListener('click', () => {
                if (this.selectedTower) {
                    this.selectedTower.upgrade();
                    this.updateTowerInfo();
                    this.updateResourceDisplay();
                }
            });
        }
        
        const sellTowerBtn = document.getElementById('sellTowerBtn');
        if (sellTowerBtn) {
            sellTowerBtn.addEventListener('click', () => {
                if (this.selectedTower) {
                    this.selectedTower.sell();
                    this.deselectTower();
                    this.updateResourceDisplay();
                }
            });
        }
        
        // 游戏结束界面按钮
        const playAgainBtn = document.getElementById('playAgainBtn');
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                TowerDefense.Engine.Game.instance.restart();
            });
        }
    }

    /**
     * 选择塔类型
     */
    selectTowerType(towerType) {
        // 取消之前的选择
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (this.selectedTowerType === towerType) {
            // 取消选择
            this.selectedTowerType = null;
        } else {
            // 选择新类型
            this.selectedTowerType = towerType;
            document.querySelector(`[data-tower="${towerType}"]`).classList.add('selected');
        }
        
        this.deselectTower();
    }

    /**
     * 选择塔
     */
    selectTower(tower) {
        // 取消之前选择的塔
        if (this.selectedTower) {
            this.selectedTower.selected = false;
        }
        
        this.selectedTower = tower;
        if (tower) {
            tower.selected = true;
            this.showTowerInfo();
        } else {
            this.hideTowerInfo();
        }
        
        // 取消塔类型选择
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    }

    /**
     * 取消选择塔
     */
    deselectTower() {
        if (this.selectedTower) {
            this.selectedTower.selected = false;
            this.selectedTower = null;
        }
        this.hideTowerInfo();
    }

    /**
     * 显示塔信息
     */
    showTowerInfo() {
        const panel = document.getElementById('towerInfoPanel');
        if (panel && this.selectedTower) {
            panel.style.display = 'block';
            this.updateTowerInfo();
        }
    }

    /**
     * 隐藏塔信息
     */
    hideTowerInfo() {
        const panel = document.getElementById('towerInfoPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    /**
     * 更新塔信息
     */
    updateTowerInfo() {
        if (!this.selectedTower) return;
        
        const tower = this.selectedTower;
        
        document.getElementById('towerLevel').textContent = tower.level;
        document.getElementById('towerDamage').textContent = tower.damage;
        document.getElementById('towerRange').textContent = tower.range;
        document.getElementById('towerSpeed').textContent = tower.attackSpeed.toFixed(1);
        
        // 更新升级按钮
        const upgradeBtn = document.getElementById('upgradeTowerBtn');
        const sellBtn = document.getElementById('sellTowerBtn');
        
        if (tower.level >= 4) {
            upgradeBtn.textContent = '已满级';
            upgradeBtn.disabled = true;
        } else {
            const upgradeCost = tower.config.upgrades.cost[tower.level - 1];
            upgradeBtn.textContent = `⬆️ 升级 (💰 ${upgradeCost})`;
            upgradeBtn.disabled = TowerDefense.Engine.Game.instance.gold < upgradeCost;
        }
        
        const sellPrice = Math.floor(tower.config.cost * 0.7 * tower.level);
        sellBtn.textContent = `💸 出售 (💰 ${sellPrice})`;
    }

    /**
     * 更新资源显示
     */
    updateResourceDisplay() {
        const game = TowerDefense.Engine.Game.instance;
        
        const goldEl = document.getElementById('goldAmount');
        const monstersEl = document.getElementById('monstersInCircle');
        const scoreEl = document.getElementById('scoreAmount');
        
        if (goldEl) goldEl.textContent = `💰 ${game.gold}`;
        if (monstersEl) {
            const activeEnemies = game.enemies.filter(enemy => enemy.active).length;
            monstersEl.textContent = `👹 ${activeEnemies}/${game.maxMonstersInCircle}`;
        }
        if (scoreEl) scoreEl.textContent = `🏆 ${game.score}`;
        
        // 更新塔建造按钮状态
        document.querySelectorAll('.tower-btn').forEach(btn => {
            const towerType = btn.dataset.tower;
            const cost = TowerDefense.Data.TowerConfig[towerType].cost;
            
            if (game.gold < cost) {
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        });
        
        // 更新塔信息面板
        if (this.selectedTower) {
            this.updateTowerInfo();
        }
    }

    /**
     * 显示伤害文字
     */
    showDamageText(x, y, damage) {
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-text';
        damageEl.textContent = `-${damage}`;
        damageEl.style.left = `${x}px`;
        damageEl.style.top = `${y}px`;
        
        document.body.appendChild(damageEl);
        
        setTimeout(() => {
            if (damageEl.parentNode) {
                damageEl.parentNode.removeChild(damageEl);
            }
        }, 1000);
    }
};

// ==================== 游戏引擎 ====================

/**
 * 输入管理器
 */
TowerDefense.Engine.InputManager = class {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.handleClick(x, y);
        });
    }

    /**
     * 处理点击事件
     */
    handleClick(x, y) {
        const game = TowerDefense.Engine.Game.instance;
        const uiManager = game.uiManager;
        
        // 检查是否点击了塔
        let clickedTower = null;
        for (let tower of game.towers) {
            if (tower.active && tower.isClicked(x, y)) {
                clickedTower = tower;
                break;
            }
        }
        
        if (clickedTower) {
            // 选择塔
            uiManager.selectTower(clickedTower);
        } else if (uiManager.selectedTowerType) {
            // 尝试建造塔
            const buildResult = game.mapSystem.canBuildAt(x, y);
            if (buildResult.canBuild) {
                game.buildTower(uiManager.selectedTowerType, buildResult.buildX, buildResult.buildY);
            }
        } else {
            // 取消选择
            uiManager.deselectTower();
        }
    }
};

/**
 * 游戏主类
 */
TowerDefense.Engine.Game = class {
    constructor() {
        // 单例模式
        if (TowerDefense.Engine.Game.instance) {
            return TowerDefense.Engine.Game.instance;
        }
        TowerDefense.Engine.Game.instance = this;
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.gameSpeed = 1;
        this.lastTime = 0;
        
        // 游戏数据
        this.gold = 500;
        this.score = 0;
        this.maxMonstersInCircle = 25; // 圈子里最大怪物数量
        
        // 游戏对象
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        
        // 系统
        this.mapSystem = new TowerDefense.Systems.MapSystem();
        this.waveManager = new TowerDefense.Systems.WaveManager();
        this.uiManager = new TowerDefense.Systems.UIManager();
        
        // Canvas和渲染
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputManager = new TowerDefense.Engine.InputManager(this.canvas);
        
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        this.updateUI();
        this.start();
    }

    /**
     * 开始游戏
     */
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    /**
     * 游戏主循环
     */
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) * this.gameSpeed;
        this.lastTime = currentTime;
        
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        
        this.render();
        
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    /**
     * 更新游戏逻辑
     */
    update(deltaTime) {
        // 更新波次管理
        this.waveManager.update();
        
        // 更新塔
        for (let tower of this.towers) {
            if (tower.active) {
                tower.update(deltaTime, this.enemies);
            }
        }
        
        // 更新敌人
        for (let enemy of this.enemies) {
            if (enemy.active) {
                enemy.update(deltaTime);
            }
        }
        
        // 更新弹道
        for (let projectile of this.projectiles) {
            if (projectile.active) {
                projectile.update(deltaTime);
            }
        }
        
        // 清理无效对象
        this.towers = this.towers.filter(tower => tower.active);
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
        
        // 检查游戏结束条件 - 圈子里怪物超过25只
        const activeEnemies = this.enemies.filter(enemy => enemy.active).length;
        if (activeEnemies > this.maxMonstersInCircle) {
            this.gameOver();
        }
        
        // 更新UI
        this.updateUI();
    }

    /**
     * 渲染游戏
     */
    render() {
        // 渲染地图
        this.mapSystem.render(this.ctx);
        
        // 渲染塔
        for (let tower of this.towers) {
            if (tower.active) {
                tower.render(this.ctx);
            }
        }
        
        // 渲染敌人
        for (let enemy of this.enemies) {
            if (enemy.active) {
                enemy.render(this.ctx);
            }
        }
        
        // 渲染弹道
        for (let projectile of this.projectiles) {
            if (projectile.active) {
                projectile.render(this.ctx);
            }
        }
    }

    /**
     * 建造塔
     */
    buildTower(type, x, y) {
        const config = TowerDefense.Data.TowerConfig[type];
        
        if (this.gold >= config.cost) {
            this.gold -= config.cost;
            const tower = new TowerDefense.Entities.Tower(x, y, type);
            this.towers.push(tower);
            
            // 取消选择
            this.uiManager.selectedTowerType = null;
            document.querySelectorAll('.tower-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            this.updateUI();
            return true;
        }
        
        return false;
    }

    /**
     * 添加敌人
     */
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    /**
     * 添加弹道
     */
    addProjectile(projectile) {
        this.projectiles.push(projectile);
    }

    /**
     * 显示伤害文字
     */
    showDamageText(x, y, damage) {
        this.uiManager.showDamageText(x, y, damage);
    }

    /**
     * 切换暂停
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.textContent = this.isPaused ? '▶️ 继续' : '⏸️ 暂停';
        }
    }

    /**
     * 切换游戏速度
     */
    toggleSpeed() {
        const speeds = [1, 2, 4];
        const currentIndex = speeds.indexOf(this.gameSpeed);
        this.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
        
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) {
            speedBtn.textContent = `⚡ ${this.gameSpeed}x`;
        }
    }

    /**
     * 重新开始游戏
     */
    restart() {
        // 重置游戏状态
        this.gold = 500;
        this.score = 0;
        this.isPaused = false;
        this.gameSpeed = 1;
        
        // 清空游戏对象
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        
        // 重置系统
        this.waveManager = new TowerDefense.Systems.WaveManager();
        this.uiManager.deselectTower();
        
        // 隐藏游戏结束界面
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        
        // 重置UI
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) pauseBtn.textContent = '⏸️ 暂停';
        
        const speedBtn = document.getElementById('speedBtn');
        if (speedBtn) speedBtn.textContent = '⚡ 1x';
        
        this.updateUI();
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.isRunning = false;
        this.showGameOverScreen(false);
    }

    /**
     * 游戏胜利
     */
    gameWin() {
        this.isRunning = false;
        this.showGameOverScreen(true);
    }

    /**
     * 显示游戏结束界面
     */
    showGameOverScreen(isWin) {
        const gameOverScreen = document.getElementById('gameOverScreen');
        const gameOverTitle = document.getElementById('gameOverTitle');
        const finalScore = document.getElementById('finalScore');
        const finalWave = document.getElementById('finalWave');
        
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }
        
        if (gameOverTitle) {
            gameOverTitle.textContent = isWin ? '🎉 胜利!' : '💀 失败! 怪物太多了!';
            gameOverTitle.style.color = isWin ? '#4CAF50' : '#F44336';
        }
        
        if (finalScore) finalScore.textContent = this.score;
        if (finalWave) finalWave.textContent = this.waveManager.currentWave;
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        this.uiManager.updateResourceDisplay();
        this.waveManager.updateUI();
    }
};

// ==================== 游戏初始化 ====================

/**
 * 页面加载完成后初始化游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    // 创建游戏实例
    const game = new TowerDefense.Engine.Game();
    
    console.log('🎮 TD塔防游戏已启动!');
    console.log('📋 游戏说明:');
    console.log('- 点击绿色区域建造塔');
    console.log('- 点击塔可以查看信息和升级');
    console.log('- 阻止敌人到达终点!');
    console.log('- 祝你游戏愉快! (◕‿◕)♡');
});