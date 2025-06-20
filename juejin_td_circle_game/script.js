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
        return x >= rect.x && x < rect.x + rect.width &&
               y >= rect.y && y < rect.y + rect.height;
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
        },
        // 辅助型塔
        heroic_totem: {
            name: '英勇图腾',
            cost: 200,
            damage: 0,
            range: 80,
            attackSpeed: 0,
            icon: '🗲',
            color: '#FF6B35',
            type: 'support',
            buffType: 'damage',
            buffValue: 0.15, // 15%攻击力加成
            upgrades: {
                buffValue: [0.20, 0.25, 0.35],
                range: [100, 120, 150],
                cost: [300, 600, 1200]
            }
        },
        speed_beacon: {
            name: '急速信标',
            cost: 200,
            damage: 0,
            range: 80,
            attackSpeed: 0,
            icon: '⚡',
            color: '#00CED1',
            type: 'support',
            buffType: 'attackSpeed',
            buffValue: 0.15, // 15%攻击速度加成
            upgrades: {
                buffValue: [0.20, 0.25, 0.35],
                range: [100, 120, 150],
                cost: [300, 600, 1200]
            }
        },
        weakness_curse: {
            name: '虚弱诅咒塔',
            cost: 180,
            damage: 0,
            range: 60,
            attackSpeed: 0,
            icon: '💀',
            color: '#8B008B',
            type: 'support',
            buffType: 'enemyDefense',
            buffValue: 0.20, // 降低敌人20%防御力
            upgrades: {
                buffValue: [0.25, 0.30, 0.40],
                range: [80, 100, 130],
                cost: [270, 540, 1080]
            }
        },
        slow_field: {
            name: '减速场发生器',
            cost: 160,
            damage: 0,
            range: 100,
            attackSpeed: 0,
            icon: '🌀',
            color: '#4169E1',
            type: 'support',
            buffType: 'enemySpeed',
            buffValue: 0.15, // 降低敌人15%移动速度
            upgrades: {
                buffValue: [0.20, 0.25, 0.35],
                range: [120, 140, 180],
                cost: [240, 480, 960]
            }
        },
        // 功能型塔
        bank_tower: {
            name: '银行塔',
            cost: 300,
            damage: 0,
            range: 0,
            attackSpeed: 0,
            icon: '🏦',
            color: '#FFD700',
            type: 'functional',
            goldPerSecond: 2,
            upgrades: {
                goldPerSecond: [4, 6, 8],
                cost: [450, 900, 1800]
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
        
        // 辅助型塔和功能型塔的特殊属性
        this.towerType = this.config.type || 'attack'; // attack, support, functional
        this.buffValue = this.config.buffValue || 0;
        this.buffType = this.config.buffType || null;
        this.goldPerSecond = this.config.goldPerSecond || 0;
        this.lastGoldTime = Date.now();
    }

    /**
     * 更新塔的逻辑
     */
    update(deltaTime, enemies) {
        // 重置攻击塔的增益效果（每帧重新计算）
        if (this.towerType === 'attack') {
            this.resetBuffs();
        }
        
        // 重置敌人的负面效果（每帧重新计算）
        for (let enemy of enemies) {
            if (enemy.active) {
                enemy.resetDebuffs();
            }
        }
        
        // 根据塔类型执行不同逻辑
        switch (this.towerType) {
            case 'attack':
                // 攻击型塔的逻辑
                this.findTarget(enemies);
                if (this.target && Date.now() - this.lastAttackTime > 1000 / this.attackSpeed) {
                    this.attack();
                    this.lastAttackTime = Date.now();
                }
                break;
                
            case 'support':
                // 辅助型塔的逻辑 - 为范围内的攻击塔提供增益
                this.applySupportBuffs();
                // 对敌人施加负面效果
                this.applyEnemyDebuffs(enemies);
                break;
                
            case 'functional':
                // 功能型塔的逻辑 - 银行塔产生金币
                this.generateGold();
                break;
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

        // 预测目标位置（提高命中率）
        const predictedTarget = this.predictTargetPosition(this.target);
        
        // 创建弹道
        const projectile = new TowerDefense.Entities.Projectile(
            this.x, this.y, predictedTarget, this.damage, this.type
        );
        
        TowerDefense.Engine.Game.instance.addProjectile(projectile);
    }
    
    /**
     * 预测目标位置
     */
    predictTargetPosition(target) {
        // 计算弹道飞行时间
        const distance = TowerDefense.Utils.distance(this.x, this.y, target.x, target.y);
        const projectileSpeed = TowerDefense.Data.TowerConfig[this.type].projectileSpeed;
        const flightTime = distance / projectileSpeed;
        
        // 获取目标当前移动方向和速度
        const pathPoints = TowerDefense.Data.MapData.pathPoints;
        if (target.pathIndex >= pathPoints.length - 1) {
            return target; // 如果在路径末端，直接瞄准当前位置
        }
        
        const currentPoint = pathPoints[target.pathIndex];
        const nextPoint = pathPoints[target.pathIndex + 1];
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const pathDistance = Math.sqrt(dx * dx + dy * dy);
        
        if (pathDistance === 0) {
            return target;
        }
        
        // 计算预测位置
        const targetSpeed = target.speed * target.slowEffect;
        const predictDistance = targetSpeed * flightTime;
        
        const dirX = dx / pathDistance;
        const dirY = dy / pathDistance;
        
        return {
            x: target.x + dirX * predictDistance,
            y: target.y + dirY * predictDistance,
            active: target.active,
            size: target.size,
            takeDamage: target.takeDamage.bind(target),
            applySlow: target.applySlow.bind(target),
            applyPoison: target.applyPoison.bind(target)
        };
    }

    /**
     * 辅助型塔 - 为范围内攻击塔提供增益
     */
    applySupportBuffs() {
        if (this.buffType === 'damage' || this.buffType === 'attackSpeed') {
            const game = TowerDefense.Engine.Game.instance;
            for (let tower of game.towers) {
                if (tower.active && tower.towerType === 'attack' && tower !== this) {
                    const distance = TowerDefense.Utils.distance(this.x, this.y, tower.x, tower.y);
                    if (distance <= this.range) {
                        // 应用增益效果
                        tower.receiveBuff(this.buffType, this.buffValue);
                    }
                }
            }
        }
    }
    
    /**
     * 对敌人施加负面效果
     */
    applyEnemyDebuffs(enemies) {
        if (this.buffType === 'enemyDefense' || this.buffType === 'enemySpeed') {
            for (let enemy of enemies) {
                if (enemy.active) {
                    const distance = TowerDefense.Utils.distance(this.x, this.y, enemy.x, enemy.y);
                    if (distance <= this.range) {
                        // 应用负面效果
                        enemy.receiveDebuff(this.buffType, this.buffValue);
                    }
                }
            }
        }
    }
    
    /**
     * 功能型塔 - 产生金币
     */
    generateGold() {
        const now = Date.now();
        if (now - this.lastGoldTime >= 1000) { // 每秒产生金币
            TowerDefense.Engine.Game.instance.gold += this.goldPerSecond;
            this.lastGoldTime = now;
        }
    }
    
    /**
     * 重置增益效果
     */
    resetBuffs() {
        if (this.originalStats) {
            this.damage = this.originalStats.damage;
            this.attackSpeed = this.originalStats.attackSpeed;
        }
    }
    
    /**
     * 接收增益效果
     */
    receiveBuff(buffType, buffValue) {
        // 临时增益，每帧重新计算
        if (!this.originalStats) {
            this.originalStats = {
                damage: this.config.damage,
                attackSpeed: this.config.attackSpeed
            };
        }
        
        switch (buffType) {
            case 'damage':
                this.damage = this.originalStats.damage * (1 + buffValue);
                break;
            case 'attackSpeed':
                this.attackSpeed = this.originalStats.attackSpeed * (1 + buffValue);
                break;
        }
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
            
            // 根据塔类型升级不同属性
            if (this.towerType === 'attack') {
                this.damage = upgrades.damage[this.level - 1];
                this.range = upgrades.range[this.level - 1];
                this.attackSpeed = upgrades.attackSpeed[this.level - 1];
            } else if (this.towerType === 'support') {
                this.buffValue = upgrades.buffValue[this.level - 1];
                this.range = upgrades.range[this.level - 1];
            } else if (this.towerType === 'functional') {
                this.goldPerSecond = upgrades.goldPerSecond[this.level - 1];
            }
            
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
        if (this.selected && this.range > 0) {
            ctx.strokeStyle = 'rgb(201, 24, 24)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 为辅助型塔绘制影响范围（半透明圆圈）
        if (this.towerType === 'support' && this.range > 0) {
            ctx.fillStyle = this.config.color + '20'; // 添加透明度
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();
        }

        // 绘制塔身
        if (this.towerType === 'support') {
            // 辅助型塔绘制为圆形
            ctx.fillStyle = this.config.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 攻击型塔和功能型塔绘制为方形
            ctx.fillStyle = this.config.color;
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        // 绘制塔的图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
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
            if (this.towerType === 'support') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size/2 + 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
            }
        }
        
        // 银行塔特殊效果 - 金币飘动动画
        if (this.towerType === 'functional' && this.type === 'bank_tower') {
            const time = Date.now() * 0.003;
            const offsetY = Math.sin(time) * 3;
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.fillText('💰', this.x, this.y - this.size/2 - 10 + offsetY);
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
        
        // 负面效果
        this.defenseDebuff = 1; // 防御力倍数
        this.speedDebuff = 1;   // 速度倍数
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
        
        const moveDistance = this.speed * this.slowEffect * this.speedDebuff * deltaTime / 1000;
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
     * 重置负面效果
     */
    resetDebuffs() {
        this.defenseDebuff = 1;
        this.speedDebuff = 1;
    }
    
    /**
     * 接收负面效果
     */
    receiveDebuff(debuffType, debuffValue) {
        switch (debuffType) {
            case 'enemyDefense':
                this.defenseDebuff = 1 - debuffValue; // 降低防御力
                break;
            case 'enemySpeed':
                this.speedDebuff = 1 - debuffValue; // 降低移动速度
                break;
        }
    }

    /**
     * 受到伤害
     */
    takeDamage(damage) {
        // 应用防御力减免
        const actualDamage = Math.floor(damage * this.defenseDebuff);
        this.health -= actualDamage;
        
        // 显示伤害数字
        TowerDefense.Engine.Game.instance.showDamageText(this.x, this.y, actualDamage);
        
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
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth/2, barY, barWidth, barHeight);
        
        // 血条前景
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
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
        
        // 根据塔类型决定弹道行为
        this.isHoming = towerType === 'arrow' || towerType === 'ice'; // 箭塔和寒冰塔使用追踪弹道
        this.homingStrength = 0.8; // 追踪强度
        
        // 计算初始方向
        const angle = TowerDefense.Utils.angle(x, y, target.x, target.y);
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    /**
     * 更新弹道
     */
    update(deltaTime) {
        // 如果目标不存在或已死亡，直线飞行
        if (!this.target || !this.target.active) {
            this.x += this.vx * deltaTime / 1000;
            this.y += this.vy * deltaTime / 1000;
        } else {
            // 追踪弹道逻辑
            if (this.isHoming) {
                // 计算到目标的方向
                const targetAngle = TowerDefense.Utils.angle(this.x, this.y, this.target.x, this.target.y);
                const currentAngle = Math.atan2(this.vy, this.vx);
                
                // 角度差值计算（处理角度环绕）
                let angleDiff = targetAngle - currentAngle;
                if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                
                // 平滑转向
                const turnRate = this.homingStrength * deltaTime / 1000;
                const newAngle = currentAngle + angleDiff * turnRate;
                
                // 更新速度向量
                this.vx = Math.cos(newAngle) * this.speed;
                this.vy = Math.sin(newAngle) * this.speed;
            }
            
            // 移动
            this.x += this.vx * deltaTime / 1000;
            this.y += this.vy * deltaTime / 1000;
            
            // 改进的碰撞检测
            const distance = TowerDefense.Utils.distance(this.x, this.y, this.target.x, this.target.y);
            const hitRadius = this.target.size + this.size; // 增加碰撞半径
            
            if (distance < hitRadius) {
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
            const effectiveRadius = splashRadius + enemy.size; // 考虑敌人大小
            
            if (distance <= effectiveRadius) {
                // 根据距离计算伤害衰减
                const damageRatio = Math.max(0.3, 1 - (distance / effectiveRadius));
                const splashDamage = Math.floor(this.damage * 0.5 * damageRatio);
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

    /**
     * 获取点击位置的格子信息
     */
    getGridAt(x, y) {
        for (let area of this.mapData.buildableAreas) {
            if (TowerDefense.Utils.pointInRect(x, y, area)) {
                return {
                    isValidGrid: true,
                    gridX: area.gridX,
                    gridY: area.gridY,
                    buildX: area.x + area.width / 2,
                    buildY: area.y + area.height / 2
                };
            }
        }
        
        return { isValidGrid: false };
    }

    /**
     * 获取指定格子位置的塔
     */
    getTowerAtGrid(gridX, gridY) {
        const area = this.mapData.buildableAreas.find(area => 
            area.gridX === gridX && area.gridY === gridY
        );
        
        if (!area) return null;
        
        return TowerDefense.Engine.Game.instance.towers.find(tower => 
            tower.active && 
            tower.x >= area.x && tower.x <= area.x + area.width &&
            tower.y >= area.y && tower.y <= area.y + area.height
        ) || null;
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
        this.waveTimeLimit = 60000; // 每波限时1分钟
        this.preparationTime = 12000; // 准备时间12秒
        this.nextWaveTime = Date.now() + this.preparationTime;
        this.showingPreview = false;
        this.previewStartTime = 0;
        this.lastGoldTime = Date.now(); // 用于每秒增加金币
    }

    /**
     * 更新波次管理
     */
    update() {
        const now = Date.now();
        const gameSpeed = TowerDefense.Engine.Game.instance.gameSpeed;
        
        // 每秒增加1金币，考虑倍速
        const goldInterval = 1000 / gameSpeed;
        if (now - this.lastGoldTime >= goldInterval) {
            TowerDefense.Engine.Game.instance.gold += 1;
            this.lastGoldTime = now;
        }
        
        if (!this.waveInProgress && !this.showingPreview) {
            // 检查是否开始下一波预告
            if (now >= this.nextWaveTime) {
                this.startWavePreview();
            }
        } else if (this.showingPreview) {
            // 检查预告时间是否结束，考虑倍速
            const adjustedPreparationTime = this.preparationTime / gameSpeed;
            if (now >= this.previewStartTime + adjustedPreparationTime) {
                this.startNextWave();
            }
        } else {
            // 生成敌人
            this.spawnEnemies();
            
            // 检查波次时间限制，考虑倍速
            const adjustedWaveTimeLimit = this.waveTimeLimit / gameSpeed;
            if (now >= this.waveStartTime + adjustedWaveTimeLimit) {
                this.endWave();
            }
            
            // 检查是否清理完所有怪物
            if (this.enemySpawnQueue.length === 0 && 
                TowerDefense.Engine.Game.instance.enemies.filter(e => e.active).length === 0) {
                // 如果是最后一波且清理完所有怪物，游戏胜利
                // currentWave在startNextWave时已经递增，所以最后一波时currentWave等于数组长度
                if (this.currentWave === TowerDefense.Data.WaveData.length) {
                    TowerDefense.Engine.Game.instance.gameWin();
                    return;
                }
                // 否则结束当前波次
                this.endWave();
            }
        }
    }

    /**
     * 开始下一波预告
     */
    startWavePreview() {
        if (this.currentWave >= TowerDefense.Data.WaveData.length) {
            // 已经完成所有波次，但需要等待清理完所有怪物才能胜利
            // 胜利判断已移至update方法中的怪物清理检查
            return;
        }
        
        this.showingPreview = true;
        this.previewStartTime = Date.now();
        
        // 更新UI显示预告信息
        this.updateUI();
    }
    
    /**
     * 开始下一波
     */
    startNextWave() {
        if (this.currentWave >= TowerDefense.Data.WaveData.length) {
            // 已经完成所有波次，但需要等待清理完所有怪物才能胜利
            // 胜利判断已移至update方法中的怪物清理检查
            return;
        }
        
        this.showingPreview = false;
        this.waveInProgress = true;
        this.waveStartTime = Date.now();
        
        // 准备敌人生成队列，考虑倍速
        const waveData = TowerDefense.Data.WaveData[this.currentWave];
        const gameSpeed = TowerDefense.Engine.Game.instance.gameSpeed;
        this.enemySpawnQueue = [];
        
        for (let enemyGroup of waveData.enemies) {
            for (let i = 0; i < enemyGroup.count; i++) {
                this.enemySpawnQueue.push({
                    type: enemyGroup.type,
                    spawnTime: this.waveStartTime + i * (enemyGroup.interval / gameSpeed)
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
        this.showingPreview = false;
        
        // 清空剩余的敌人生成队列
        this.enemySpawnQueue = [];
        
        // 波次奖励
        const bonus = this.currentWave * 10;
        TowerDefense.Engine.Game.instance.gold += bonus;
        TowerDefense.Engine.Game.instance.score += bonus * 5;
        
        // 设置下一波预告时间（立即开始预告）
        this.nextWaveTime = Date.now() + 1000; // 1秒后开始预告
        
        this.updateUI();
    }

    /**
     * 手动开始下一波
     */
    startNextWaveEarly() {
        if (this.showingPreview && this.currentWave < TowerDefense.Data.WaveData.length) {
            // 提前开始奖励，考虑倍速
            const gameSpeed = TowerDefense.Engine.Game.instance.gameSpeed;
            const adjustedPreparationTime = this.preparationTime / gameSpeed;
            const timeBonus = Math.floor((this.previewStartTime + adjustedPreparationTime - Date.now()) / 1000);
            TowerDefense.Engine.Game.instance.gold += timeBonus;
            
            // 立即开始下一波
            this.startNextWave();
        }
    }
    
    /**
     * 获取下一波敌人预告信息
     */
    getNextWavePreview() {
        if (this.currentWave >= TowerDefense.Data.WaveData.length) {
            return null;
        }
        
        const waveData = TowerDefense.Data.WaveData[this.currentWave];
        const enemyTypes = [];
        
        for (let enemyGroup of waveData.enemies) {
            const config = TowerDefense.Data.EnemyConfig[enemyGroup.type];
            enemyTypes.push({
                name: config.name,
                icon: config.icon,
                count: enemyGroup.count
            });
        }
        
        return {
            waveNumber: this.currentWave + 1,
            enemies: enemyTypes
        };
    }

    /**
     * 更新UI
     */
    updateUI() {
        const waveNumberEl = document.getElementById('waveNumber');
        const enemiesLeftEl = document.getElementById('enemiesLeft');
        const waveCountdownEl = document.getElementById('waveCountdown');
        const nextWaveBtn = document.getElementById('nextWaveBtn');
        const wavePreviewEl = document.getElementById('wavePreview');
        
        if (waveNumberEl) {
            waveNumberEl.textContent = `波次: ${this.currentWave}`;
        }
        
        if (enemiesLeftEl) {
            const activeEnemies = TowerDefense.Engine.Game.instance.enemies.filter(e => e.active).length;
            const queuedEnemies = this.enemySpawnQueue.length;
            enemiesLeftEl.textContent = `剩余敌人: ${activeEnemies + queuedEnemies}`;
        }
        
        // 更新波次预告显示
        if (wavePreviewEl) {
            if (this.showingPreview) {
                const preview = this.getNextWavePreview();
                if (preview) {
                    const titleEl = wavePreviewEl.querySelector('.preview-title');
                    const contentEl = wavePreviewEl.querySelector('.preview-content');
                    
                    if (titleEl) {
                        titleEl.textContent = `📢 第${preview.waveNumber}波即将到来！`;
                    }
                    
                    if (contentEl) {
                        let enemyText = '敌人类型:\n';
                        preview.enemies.forEach((enemy, index) => {
                            if (index > 0) enemyText += '\n';
                            enemyText += `${enemy.icon} ${enemy.name} × ${enemy.count}`;
                        });
                        contentEl.textContent = enemyText;
                    }
                    
                    wavePreviewEl.style.display = 'block';
                } else {
                    wavePreviewEl.style.display = 'none';
                }
            } else {
                wavePreviewEl.style.display = 'none';
            }
        }
        
        if (waveCountdownEl && nextWaveBtn) {
            const gameSpeed = TowerDefense.Engine.Game.instance.gameSpeed;
            
            if (this.waveInProgress) {
                const adjustedWaveTimeLimit = this.waveTimeLimit / gameSpeed;
                const timeLeft = Math.max(0, Math.ceil((this.waveStartTime + adjustedWaveTimeLimit - Date.now()) / 1000));
                waveCountdownEl.textContent = `战斗中... 剩余时间: ${timeLeft}s`;
                nextWaveBtn.disabled = true;
                nextWaveBtn.textContent = '⚔️ 战斗中';
            } else if (this.showingPreview) {
                const adjustedPreparationTime = this.preparationTime / gameSpeed;
                const timeLeft = Math.max(0, Math.ceil((this.previewStartTime + adjustedPreparationTime - Date.now()) / 1000));
                waveCountdownEl.textContent = `准备时间: ${timeLeft}s`;
                nextWaveBtn.disabled = true;
                nextWaveBtn.textContent = '⏳ 准备中';
            } else if (this.currentWave >= TowerDefense.Data.WaveData.length) {
                waveCountdownEl.textContent = '游戏完成!';
                nextWaveBtn.disabled = true;
                nextWaveBtn.textContent = '🏆 胜利';
            } else {
                const timeLeft = Math.max(0, Math.ceil((this.nextWaveTime - Date.now()) / 1000));
                waveCountdownEl.textContent = `下一波预告: ${timeLeft}s`;
                nextWaveBtn.disabled = true;
                nextWaveBtn.textContent = '⏳ 等待中';
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
        this.modalBuildX = 0;
        this.modalBuildY = 0;
        this.modalSelectedTower = null;
        this.setupEventListeners();
        this.createTowerSelectionModal();
        this.createTowerInfoModal();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
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
        
        // 塔建造按钮状态更新已移除，改为弹窗选择模式
        // 按钮状态在弹窗显示时动态更新
        
        // 更新塔信息面板
        if (this.selectedTower) {
            this.updateTowerInfo();
        }
    }

    /**
     * 显示伤害文字
     */
    showDamageText(x, y, damage) {
        // 获取画布的位置信息
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        
        const damageEl = document.createElement('div');
        damageEl.className = 'damage-text';
        damageEl.textContent = `-${damage}`;
        
        // 计算相对于页面的绝对位置
        const absoluteX = rect.left + x;
        const absoluteY = rect.top + y;
        
        damageEl.style.left = `${absoluteX}px`;
        damageEl.style.top = `${absoluteY}px`;
        
        document.body.appendChild(damageEl);
        
        setTimeout(() => {
            if (damageEl.parentNode) {
                damageEl.parentNode.removeChild(damageEl);
            }
        }, 1000);
    }

    /**
     * 创建塔选择弹窗
     */
    createTowerSelectionModal() {
        // 创建弹窗容器
        const modal = document.createElement('div');
        modal.id = 'towerSelectionModal';
        modal.className = 'tower-selection-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #FFD700;
            border-radius: 15px;
            padding: 20px;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        `;
        
        // 创建标题
        const title = document.createElement('h3');
        title.textContent = '🏗️ 选择要建造的塔';
        title.style.cssText = `
            color: #FFD700;
            text-align: center;
            margin: 0 0 15px 0;
            font-size: 18px;
        `;
        modal.appendChild(title);
        
        // 创建塔选择按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            max-width: 600px;
        `;
        
        // 为每种塔类型创建按钮
        const towerTypes = ['arrow', 'cannon', 'ice', 'poison', 'heroic_totem', 'speed_beacon', 'weakness_curse', 'slow_field', 'bank_tower'];
        towerTypes.forEach(towerType => {
            const config = TowerDefense.Data.TowerConfig[towerType];
            const button = document.createElement('button');
            button.className = 'modal-tower-btn';
            button.dataset.tower = towerType;
            button.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">${config.icon}</div>
                <div style="font-size: 14px; font-weight: bold;">${config.name}</div>
                <div style="font-size: 12px; color: #FFD700;">💰 ${config.cost}</div>
            `;
            button.style.cssText = `
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                border: 2px solid #555;
                border-radius: 10px;
                color: white;
                padding: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                min-width: 120px;
            `;
            
            // 添加悬停效果
            button.addEventListener('mouseenter', () => {
                button.style.borderColor = '#FFD700';
                button.style.transform = 'scale(1.05)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.borderColor = '#555';
                button.style.transform = 'scale(1)';
            });
            
            // 添加点击事件
            button.addEventListener('click', () => {
                this.buildTowerFromModal(towerType);
            });
            
            buttonContainer.appendChild(button);
        });
        
        modal.appendChild(buttonContainer);
        
        // 创建取消按钮
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '❌ 取消';
        cancelButton.style.cssText = `
            background: #666;
            border: none;
            border-radius: 8px;
            color: white;
            padding: 10px 20px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
        `;
        
        cancelButton.addEventListener('click', () => {
            this.hideTowerSelectionModal();
        });
        
        modal.appendChild(cancelButton);
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 点击弹窗外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTowerSelectionModal();
            }
        });
    }

    /**
     * 显示塔选择弹窗
     */
    showTowerSelectionModal(buildX, buildY) {
        // 先隐藏其他弹窗
        this.hideTowerInfoModal();
        
        this.modalBuildX = buildX;
        this.modalBuildY = buildY;
        
        const modal = document.getElementById('towerSelectionModal');
        if (modal) {
            modal.style.display = 'block';
            
            // 更新按钮状态（根据金币数量）
            const game = TowerDefense.Engine.Game.instance;
            modal.querySelectorAll('.modal-tower-btn').forEach(btn => {
                const towerType = btn.dataset.tower;
                const cost = TowerDefense.Data.TowerConfig[towerType].cost;
                
                if (game.gold < cost) {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.disabled = true;
                } else {
                    btn.style.opacity = '1';
                    btn.style.cursor = 'pointer';
                    btn.disabled = false;
                }
            });
        }
    }

    /**
     * 隐藏塔选择弹窗
     */
    hideTowerSelectionModal() {
        const modal = document.getElementById('towerSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * 从弹窗建造塔
     */
    buildTowerFromModal(towerType) {
        const game = TowerDefense.Engine.Game.instance;
        const config = TowerDefense.Data.TowerConfig[towerType];
        
        if (game.gold >= config.cost) {
            game.buildTower(towerType, this.modalBuildX, this.modalBuildY);
            this.hideTowerSelectionModal();
        }
    }

    /**
     * 创建塔信息弹窗
     */
    createTowerInfoModal() {
        // 创建弹窗容器
        const modal = document.createElement('div');
        modal.id = 'towerInfoModal';
        modal.className = 'tower-info-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #4CAF50;
            border-radius: 15px;
            padding: 20px;
            z-index: 1000;
            display: none;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
            min-width: 300px;
        `;
        
        // 创建标题
        const title = document.createElement('h3');
        title.id = 'modalTowerTitle';
        title.style.cssText = `
            color: #4CAF50;
            text-align: center;
            margin: 0 0 15px 0;
            font-size: 18px;
        `;
        modal.appendChild(title);
        
        // 创建塔信息容器
        const infoContainer = document.createElement('div');
        infoContainer.style.cssText = `
            color: white;
            margin-bottom: 15px;
            line-height: 1.6;
        `;
        
        infoContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div>🏆 等级: <span id="modalTowerLevel">1</span></div>
                <div>⚔️ 伤害: <span id="modalTowerDamage">10</span></div>
                <div>🎯 射程: <span id="modalTowerRange">100</span></div>
                <div>⚡ 攻速: <span id="modalTowerSpeed">1.0</span></div>
            </div>
        `;
        
        modal.appendChild(infoContainer);
        
        // 创建按钮容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
        `;
        
        // 创建升级按钮
        const upgradeButton = document.createElement('button');
        upgradeButton.id = 'modalUpgradeBtn';
        upgradeButton.style.cssText = `
            background: linear-gradient(145deg, #4CAF50, #45a049);
            border: none;
            border-radius: 8px;
            color: white;
            padding: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        
        upgradeButton.addEventListener('click', () => {
            this.upgradeTowerFromModal();
        });
        
        buttonContainer.appendChild(upgradeButton);
        
        // 创建出售按钮
        const sellButton = document.createElement('button');
        sellButton.id = 'modalSellBtn';
        sellButton.style.cssText = `
            background: linear-gradient(145deg, #f44336, #d32f2f);
            border: none;
            border-radius: 8px;
            color: white;
            padding: 12px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        
        sellButton.addEventListener('click', () => {
            this.sellTowerFromModal();
        });
        
        buttonContainer.appendChild(sellButton);
        
        modal.appendChild(buttonContainer);
        
        // 创建关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '❌ 关闭';
        closeButton.style.cssText = `
            background: #666;
            border: none;
            border-radius: 8px;
            color: white;
            padding: 10px 20px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
        `;
        
        closeButton.addEventListener('click', () => {
            this.hideTowerInfoModal();
        });
        
        modal.appendChild(closeButton);
        
        // 添加到页面
        document.body.appendChild(modal);
        
        // 点击弹窗外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideTowerInfoModal();
            }
        });
    }

    /**
     * 显示塔信息弹窗
     */
    showTowerInfoModal(tower) {
        // 先隐藏其他弹窗
        this.hideTowerSelectionModal();
        
        // 清除之前选中的塔的状态
        if (this.modalSelectedTower && this.modalSelectedTower !== tower) {
            this.modalSelectedTower.selected = false;
        }
        
        this.modalSelectedTower = tower;
        // 设置当前塔为选中状态
        tower.selected = true;
        
        const modal = document.getElementById('towerInfoModal');
        if (!modal) {
            this.createTowerInfoModal();
        }
        
        // 更新塔信息
        const config = tower.config;
        document.getElementById('modalTowerTitle').textContent = `${config.icon} ${config.name}`;
        document.getElementById('modalTowerLevel').textContent = tower.level;
        document.getElementById('modalTowerDamage').textContent = tower.damage;
        document.getElementById('modalTowerRange').textContent = tower.range;
        document.getElementById('modalTowerSpeed').textContent = tower.attackSpeed.toFixed(1);
        
        // 更新升级按钮
        const upgradeBtn = document.getElementById('modalUpgradeBtn');
        if (tower.level >= 4) {
            upgradeBtn.textContent = '🏆 已满级';
            upgradeBtn.disabled = true;
            upgradeBtn.style.opacity = '0.5';
        } else {
            const upgradeCost = config.upgrades.cost[tower.level - 1];
            upgradeBtn.textContent = `⬆️ 升级 (💰 ${upgradeCost})`;
            const game = TowerDefense.Engine.Game.instance;
            upgradeBtn.disabled = game.gold < upgradeCost;
            upgradeBtn.style.opacity = upgradeBtn.disabled ? '0.5' : '1';
        }
        
        // 更新出售按钮
        const sellBtn = document.getElementById('modalSellBtn');
        const sellPrice = Math.floor(config.cost * 0.7 * tower.level);
        sellBtn.textContent = `💸 出售 (💰 ${sellPrice})`;
        
        // 显示弹窗
        document.getElementById('towerInfoModal').style.display = 'block';
    }

    /**
     * 隐藏塔信息弹窗
     */
    hideTowerInfoModal() {
        const modal = document.getElementById('towerInfoModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // 清除塔的选中状态
        if (this.modalSelectedTower) {
            this.modalSelectedTower.selected = false;
        }
        this.modalSelectedTower = null;
    }

    /**
     * 从弹窗升级塔
     */
    upgradeTowerFromModal() {
        if (this.modalSelectedTower) {
            const tower = this.modalSelectedTower;
            
            if (tower.level < 4) {
                // 直接调用塔的upgrade方法，它会处理金币检查和扣除
                if (tower.upgrade()) {
                    this.showTowerInfoModal(tower); // 刷新弹窗信息
                    this.updateResourceDisplay();
                }
            }
        }
    }

    /**
     * 从弹窗出售塔
     */
    sellTowerFromModal() {
        if (this.modalSelectedTower) {
            const game = TowerDefense.Engine.Game.instance;
            const tower = this.modalSelectedTower;
            const sellPrice = Math.floor(tower.config.cost * 0.7 * tower.level);
            
            game.gold += sellPrice;
            tower.active = false;
            
            this.hideTowerInfoModal();
            this.updateResourceDisplay();
        }
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
        
        // 优先检查是否点击了绿色区域（可建造区域）
        const gridResult = game.mapSystem.getGridAt(x, y);
        if (gridResult.isValidGrid) {
            // 检查该格子是否已有塔
            const existingTower = game.mapSystem.getTowerAtGrid(gridResult.gridX, gridResult.gridY);
            if (existingTower) {
                // 已有塔，显示塔信息弹窗
                uiManager.showTowerInfoModal(existingTower);
            } else {
                // 没有塔，显示塔选择弹窗
                uiManager.showTowerSelectionModal(gridResult.buildX, gridResult.buildY);
            }
        } else {
            // 检查是否点击了塔（在非格子区域）
            let clickedTower = null;
            for (let tower of game.towers) {
                if (tower.active && tower.isClicked(x, y)) {
                    clickedTower = tower;
                    break;
                }
            }
            
            if (clickedTower) {
                // 选择塔（保持原有的选择逻辑）
                uiManager.selectTower(clickedTower);
            } else {
                // 取消选择
                uiManager.deselectTower();
                uiManager.hideTowerSelectionModal();
                uiManager.hideTowerInfoModal();
            }
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
        this.maxMonstersInCircle = 50; // 圈子里最大怪物数量
        
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
        
        // 检查游戏结束条件 - 圈子里怪物超过50只
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
        this.isRunning = false; // 先停止当前游戏循环
        
        // 清空游戏对象
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        
        // 重置系统
        this.waveManager = new TowerDefense.Systems.WaveManager();
        this.uiManager.deselectTower();
        this.uiManager.hideTowerSelectionModal();
        this.uiManager.hideTowerInfoModal();
        
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
        
        // 重新启动游戏循环
        this.start();
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