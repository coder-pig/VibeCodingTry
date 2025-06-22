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
    Utils: {},
    // 资源管理
    Assets: {}
};

// ==================== 资源管理系统 ====================
/**
 * 图片资源管理器
 */
TowerDefense.Assets.ImageManager = class {
    constructor() {
        this.images = new Map();
        this.loadingPromises = new Map();
        this.loadedCount = 0;
        this.totalCount = 0;
    }

    /**
     * 预加载单个图片
     */
    async loadImage(name, url) {
        // 如果已经在缓存中，直接返回
        if (this.images.has(name)) {
            return this.images.get(name);
        }

        // 如果正在加载中，返回加载Promise
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name);
        }

        // 开始加载图片
        const loadPromise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // 处理跨域
            
            img.onload = () => {
                this.images.set(name, img);
                this.loadingPromises.delete(name);
                this.loadedCount++;
                console.log(`✅ 图片加载成功: ${name}`);
                resolve(img);
            };
            
            img.onerror = () => {
                this.loadingPromises.delete(name);
                console.warn(`❌ 图片加载失败: ${name}`);
                reject(new Error(`Failed to load image: ${name}`));
            };
            
            img.src = url;
        });

        this.loadingPromises.set(name, loadPromise);
        return loadPromise;
    }

    /**
     * 批量预加载图片
     */
    async loadImages(imageList, onProgress) {
        this.totalCount = imageList.length;
        this.loadedCount = 0;

        const promises = imageList.map(async (item) => {
            try {
                await this.loadImage(item.name, item.url);
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, item.name);
                }
            } catch (error) {
                console.warn(`Failed to load ${item.name}:`, error);
                if (onProgress) {
                    onProgress(this.loadedCount, this.totalCount, item.name);
                }
            }
        });

        await Promise.all(promises);
    }

    /**
     * 获取缓存的图片
     */
    getImage(name) {
        return this.images.get(name);
    }

    /**
     * 检查图片是否已加载
     */
    hasImage(name) {
        return this.images.has(name);
    }

    /**
     * 渲染图片（带降级处理）
     */
    renderSprite(ctx, imageName, x, y, width, height, fallbackEmoji) {
        const img = this.getImage(imageName);
        
        if (img && img.complete) {
            // 成功加载图片，正常渲染
            ctx.drawImage(img, x - width/2, y - height/2, width, height);
            return true;
        } else {
            // 图片未加载或加载失败，使用emoji降级
            if (fallbackEmoji) {
                ctx.font = `${height}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(fallbackEmoji, x, y);
            }
            return false;
        }
    }
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
        // 基础敌人
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
        },
        // 新增敌人类型
        assassin: {
            name: '刺客',
            health: 40,
            speed: 150,
            reward: 20,
            icon: '🥷',
            color: '#2F4F4F',
            size: 13
        },
        heavy_armor: {
            name: '重甲兵',
            health: 200,
            speed: 25,
            reward: 30,
            icon: '🛡️',
            color: '#4682B4',
            size: 22
        },
        flying_demon: {
            name: '飞行怪',
            health: 80,
            speed: 100,
            reward: 25,
            icon: '🦇',
            color: '#800080',
            size: 16
        },
        healer: {
            name: '治疗师',
            health: 60,
            speed: 50,
            reward: 35,
            icon: '⚕️',
            color: '#32CD32',
            size: 17
        },
        berserker: {
            name: '狂战士',
            health: 120,
            speed: 80,
            reward: 40,
            icon: '⚔️',
            color: '#DC143C',
            size: 19
        },
        giant: {
            name: '巨人',
            health: 300,
            speed: 20,
            reward: 50,
            icon: '🗿',
            color: '#8B4513',
            size: 28
        },
        ghost: {
            name: '幽灵',
            health: 70,
            speed: 90,
            reward: 30,
            icon: '👻',
            color: '#F0F8FF',
            size: 15
        },
        dragon: {
            name: '龙',
            health: 400,
            speed: 60,
            reward: 80,
            icon: '🐉',
            color: '#FF4500',
            size: 30
        },
        necromancer: {
            name: '死灵法师',
            health: 100,
            speed: 45,
            reward: 60,
            icon: '🧙‍♂️',
            color: '#4B0082',
            size: 18
        },
        demon: {
            name: '恶魔',
            health: 250,
            speed: 55,
            reward: 70,
            icon: '😈',
            color: '#8B0000',
            size: 24
        },
        elemental: {
            name: '元素',
            health: 180,
            speed: 70,
            reward: 45,
            icon: '🔥',
            color: '#FF6347',
            size: 20
        },
        golem: {
            name: '魔像',
            health: 350,
            speed: 15,
            reward: 65,
            icon: '🗿',
            color: '#696969',
            size: 26
        },
        vampire: {
            name: '吸血鬼',
            health: 160,
            speed: 85,
            reward: 55,
            icon: '🧛‍♂️',
            color: '#8B0000',
            size: 19
        },
        lich: {
            name: '巫妖',
            health: 280,
            speed: 35,
            reward: 90,
            icon: '💀',
            color: '#2F4F4F',
            size: 23
        },
        titan: {
            name: '泰坦',
            health: 600,
            speed: 30,
            reward: 120,
            icon: '⚡',
            color: '#FFD700',
            size: 32
        },
        final_boss: {
            name: '终极Boss',
            health: 1000,
            speed: 25,
            reward: 200,
            icon: '👹',
            color: '#8B0000',
            size: 35
        }
    },

    // 波次数据 - 30波设计
    WaveData: [
        // 第1-5波：基础教学阶段
        { enemies: [{ type: 'grunt', count: 5, interval: 1000 }] },
        { enemies: [{ type: 'grunt', count: 8, interval: 800 }] },
        { enemies: [{ type: 'grunt', count: 6, interval: 1000 }, { type: 'runner', count: 3, interval: 1500 }] },
        { enemies: [{ type: 'grunt', count: 10, interval: 600 }, { type: 'runner', count: 5, interval: 1200 }] },
        { enemies: [{ type: 'grunt', count: 8, interval: 800 }, { type: 'tank', count: 2, interval: 2000 }] },
        
        // 第6-10波：进阶阶段，引入新敌人
        { enemies: [{ type: 'grunt', count: 12, interval: 500 }, { type: 'runner', count: 6, interval: 1000 }, { type: 'assassin', count: 2, interval: 2000 }] },
        { enemies: [{ type: 'grunt', count: 15, interval: 400 }, { type: 'runner', count: 8, interval: 800 }, { type: 'tank', count: 3, interval: 1500 }, { type: 'assassin', count: 3, interval: 1800 }] },
        { enemies: [{ type: 'grunt', count: 10, interval: 600 }, { type: 'runner', count: 10, interval: 700 }, { type: 'heavy_armor', count: 2, interval: 2500 }] },
        { enemies: [{ type: 'grunt', count: 20, interval: 300 }, { type: 'runner', count: 12, interval: 600 }, { type: 'tank', count: 4, interval: 1200 }, { type: 'flying_demon', count: 3, interval: 2000 }] },
        { enemies: [{ type: 'grunt', count: 15, interval: 500 }, { type: 'runner', count: 10, interval: 800 }, { type: 'tank', count: 6, interval: 1000 }, { type: 'boss', count: 1, interval: 5000 }] },
        
        // 第11-15波：中级挑战
        { enemies: [{ type: 'grunt', count: 18, interval: 400 }, { type: 'assassin', count: 6, interval: 1000 }, { type: 'heavy_armor', count: 3, interval: 2000 }, { type: 'healer', count: 2, interval: 3000 }] },
        { enemies: [{ type: 'runner', count: 15, interval: 500 }, { type: 'tank', count: 8, interval: 1200 }, { type: 'flying_demon', count: 5, interval: 1500 }, { type: 'berserker', count: 3, interval: 2500 }] },
        { enemies: [{ type: 'grunt', count: 25, interval: 300 }, { type: 'assassin', count: 8, interval: 800 }, { type: 'ghost', count: 4, interval: 1800 }, { type: 'giant', count: 2, interval: 4000 }] },
        { enemies: [{ type: 'heavy_armor', count: 6, interval: 1000 }, { type: 'berserker', count: 5, interval: 1500 }, { type: 'flying_demon', count: 8, interval: 1200 }, { type: 'healer', count: 3, interval: 2500 }] },
        { enemies: [{ type: 'tank', count: 10, interval: 800 }, { type: 'ghost', count: 6, interval: 1400 }, { type: 'giant', count: 3, interval: 3000 }, { type: 'dragon', count: 1, interval: 6000 }] },
        
        // 第16-20波：高级挑战
        { enemies: [{ type: 'assassin', count: 12, interval: 600 }, { type: 'berserker', count: 8, interval: 1000 }, { type: 'necromancer', count: 3, interval: 2000 }, { type: 'elemental', count: 4, interval: 1800 }] },
        { enemies: [{ type: 'heavy_armor', count: 10, interval: 800 }, { type: 'giant', count: 5, interval: 2000 }, { type: 'demon', count: 3, interval: 2500 }, { type: 'vampire', count: 4, interval: 1500 }] },
        { enemies: [{ type: 'flying_demon', count: 15, interval: 500 }, { type: 'ghost', count: 10, interval: 1000 }, { type: 'dragon', count: 2, interval: 4000 }, { type: 'golem', count: 2, interval: 5000 }] },
        { enemies: [{ type: 'berserker', count: 12, interval: 700 }, { type: 'necromancer', count: 6, interval: 1500 }, { type: 'elemental', count: 8, interval: 1200 }, { type: 'lich', count: 2, interval: 4000 }] },
        { enemies: [{ type: 'giant', count: 8, interval: 1500 }, { type: 'demon', count: 6, interval: 2000 }, { type: 'vampire', count: 8, interval: 1200 }, { type: 'boss', count: 2, interval: 6000 }] },
        
        // 第21-25波：专家级挑战
        { enemies: [{ type: 'dragon', count: 4, interval: 2000 }, { type: 'golem', count: 4, interval: 2500 }, { type: 'lich', count: 3, interval: 3000 }, { type: 'titan', count: 1, interval: 8000 }] },
        { enemies: [{ type: 'necromancer', count: 10, interval: 1000 }, { type: 'elemental', count: 12, interval: 800 }, { type: 'vampire', count: 10, interval: 1200 }, { type: 'demon', count: 8, interval: 1800 }] },
        { enemies: [{ type: 'ghost', count: 20, interval: 400 }, { type: 'flying_demon', count: 15, interval: 600 }, { type: 'dragon', count: 5, interval: 2000 }, { type: 'golem', count: 3, interval: 3500 }] },
        { enemies: [{ type: 'giant', count: 12, interval: 1000 }, { type: 'lich', count: 6, interval: 2000 }, { type: 'titan', count: 2, interval: 6000 }, { type: 'boss', count: 3, interval: 5000 }] },
        { enemies: [{ type: 'demon', count: 15, interval: 800 }, { type: 'vampire', count: 12, interval: 1000 }, { type: 'dragon', count: 8, interval: 1500 }, { type: 'golem', count: 6, interval: 2500 }] },
        
        // 第26-29波：终极挑战
        { enemies: [{ type: 'elemental', count: 20, interval: 500 }, { type: 'lich', count: 10, interval: 1200 }, { type: 'titan', count: 4, interval: 4000 }, { type: 'dragon', count: 6, interval: 2000 }] },
        { enemies: [{ type: 'golem', count: 10, interval: 1500 }, { type: 'demon', count: 18, interval: 700 }, { type: 'vampire', count: 15, interval: 900 }, { type: 'boss', count: 4, interval: 4000 }] },
        { enemies: [{ type: 'titan', count: 6, interval: 2500 }, { type: 'dragon', count: 10, interval: 1200 }, { type: 'lich', count: 8, interval: 1800 }, { type: 'final_boss', count: 1, interval: 10000 }] },
        { enemies: [{ type: 'giant', count: 20, interval: 600 }, { type: 'golem', count: 15, interval: 1000 }, { type: 'titan', count: 8, interval: 2000 }, { type: 'boss', count: 6, interval: 3000 }] },
        
        // 第30波：最终Boss战
        { enemies: [{ type: 'final_boss', count: 3, interval: 8000 }, { type: 'titan', count: 10, interval: 1500 }, { type: 'dragon', count: 15, interval: 1000 }, { type: 'lich', count: 12, interval: 1200 }, { type: 'demon', count: 20, interval: 500 }] }
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
            // 第一行路径 (从左到右) - [0,3]是怪物出生点（巢穴）
            [0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
            // 向下转弯
            [7, 3], [7, 4], [7, 5], [7, 6],
            // 第二段路径 (从右到左)
            [6, 6], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
            // 向下转弯
            [0, 7], [0, 8], [0, 9],
            // 第三段路径 (从左到右)
            [1, 9], [2, 9], [3, 9], [3, 9], [4, 9], [5, 9], [6, 9], [7, 9], [8, 9], [9, 9],
            // 向上转弯到终点
            [9, 8], [9, 7], [9, 6], [9, 5], [9, 4], [9, 3], [9, 2], [9, 1], [9, 0],
            // 连接回起点的路径 (从右到左，顶部一行)
            [8, 0], [7, 0], [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0],
            // 向下回到起点
            [0, 0], [0, 1], [0, 2]
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

        // 绘制塔的图标 - 优先使用图片，降级到emoji
        const game = window.game;
        let useImage = false;
        
        if (game && game.imageManager) {
            // 根据塔类型选择对应的图片
            let imageName = null;
            if (this.type === 'arrow') {
                imageName = 'arrow_tower';
            } else if (this.type === 'cannon') {
                imageName = 'cannon_tower';
            } else if (this.type === 'ice') {
                imageName = 'ice_tower';
            } else if (this.type === 'poison') {
                imageName = 'poison_tower';
            } else if (this.type === 'heroic_totem') {
                imageName = 'heroic_totem';
            } else if (this.type === 'speed_beacon') {
                imageName = 'speed_beacon';
            } else if (this.type === 'weakness_curse') {
                imageName = 'weakness_curse';
            } else if (this.type === 'slow_field') {
                imageName = 'slow_field';
            } else if (this.type === 'bank_tower') {
                imageName = 'bank_tower';
            }
            
            if (imageName) {
                useImage = game.imageManager.renderSprite(
                    ctx, 
                    imageName, 
                    this.x, 
                    this.y, 
                    this.size, 
                    this.size, 
                    this.config.icon
                );
            }
        }

        // 只有在没有使用图片时才绘制背景颜色
        if (!useImage) {
            // 绘制塔身
            if (this.towerType === 'support') {
                // 辅助型塔绘制为圆形
                ctx.fillStyle = this.config.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 攻击型塔和功能型塔绘制为方形
                ctx.fillStyle = this.config.color;
                ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            }
        }
        
        // 如果没有使用图片，则使用原来的emoji渲染
        if (!useImage) {
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(this.config.icon, this.x, this.y);
        }

        // 绘制等级
        if (this.level > 1) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.fillText(this.level, this.x + this.size / 3, this.y - this.size / 3);
        }

        // 绘制选中边框
        if (this.selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            if (this.towerType === 'support') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2 + 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.strokeRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
            }
        }

        // 银行塔特殊效果 - 金币飘动动画
        if (this.towerType === 'functional' && this.type === 'bank_tower') {
            const time = Date.now() * 0.003;
            const offsetY = Math.sin(time) * 3;
            ctx.fillStyle = '#FFD700';
            ctx.font = '12px Arial';
            ctx.fillText('💰', this.x, this.y - this.size / 2 - 10 + offsetY);
        }
    }

    /**
     * 检查点击
     */
    isClicked(x, y) {
        return TowerDefense.Utils.pointInRect(x, y, {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
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

        // 绘制敌人图标 - 优先使用图片，降级到emoji
        const game = window.game; // 获取全局游戏实例
        let useImage = false;
        
        // 检查icon是否为URL
        if (this.config.icon.startsWith('http')) {
            // 如果是URL，直接创建图片对象并渲染
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // 检查图片是否已经加载
            if (this.iconImage && this.iconImage.complete && this.iconImage.src === this.config.icon) {
                // 图片已加载，直接渲染
                ctx.drawImage(this.iconImage, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
                useImage = true;
            } else if (!this.iconImage || this.iconImage.src !== this.config.icon) {
                // 图片未加载或URL变化，重新加载
                this.iconImage = img;
                img.src = this.config.icon;
                img.onload = () => {
                    // 图片加载完成后会在下一帧渲染
                };
            }
        } else if (game && game.imageManager) {
             // 根据敌人类型选择对应的图片
             let imageName = null;
             if (this.config.name === '小鬼') {
                 imageName = 'grunt';
             } else if (this.config.name === '狼骑兵') {
                 imageName = 'runner';
             } else if (this.config.name === '石头人') {
                 imageName = 'tank';
             } else if (this.config.name === 'Boss') {
                 imageName = 'boss';
             } else if (this.config.name === '刺客') {
                 imageName = 'assassin';
             } else if (this.config.name === '重甲兵') {
                 imageName = 'heavy_armor';
             } else if (this.config.name === '飞行怪') {
                 imageName = 'flying_demon';
             } else if (this.config.name === '治疗师') {
                 imageName = 'healer';
             } else if (this.config.name === '狂战士') {
                 imageName = 'berserker';
             } else if (this.config.name === '巨人') {
                 imageName = 'giant';
             } else if (this.config.name === '幽灵') {
                 imageName = 'ghost';
             } else if (this.config.name === '龙') {
                 imageName = 'dragon';
             } else if (this.config.name === '死灵法师') {
                 imageName = 'necromancer';
             } else if (this.config.name === '恶魔') {
                 imageName = 'demon';
             } else if (this.config.name === '元素') {
                 imageName = 'elemental';
             } else if (this.config.name === '魔像') {
                 imageName = 'golem';
             } else if (this.config.name === '吸血鬼') {
                 imageName = 'vampire';
             } else if (this.config.name === '巫妖') {
                 imageName = 'lich';
             } else if (this.config.name === '泰坦') {
                 imageName = 'titan';
             } else if (this.config.name === '终极Boss') {
                 imageName = 'final_boss';
             }
            
            if (imageName) {
                useImage = game.imageManager.renderSprite(
                    ctx, 
                    imageName, 
                    this.x, 
                    this.y, 
                    this.size * 2, 
                    this.size * 2, 
                    this.config.icon
                );
            }
        }
        
        // 如果没有使用图片，则使用原来的emoji渲染
        if (!useImage) {
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.fillText(this.config.icon, this.x, this.y);
        }

        // 绘制血条
        const barWidth = this.size * 2;
        const barHeight = 4;
        const barY = this.y - this.size - 8;

        // 血条背景
        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth, barHeight);

        // 血条前景
        ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
        const healthPercent = this.health / this.maxHealth;
        ctx.fillRect(this.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

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
 * 特效基类
 */
TowerDefense.Entities.Effect = class extends TowerDefense.Entities.GameObject {
    constructor(x, y, type, duration = 1000) {
        super(x, y);
        this.type = type;
        this.duration = duration;
        this.startTime = Date.now();
        this.size = 30;
        this.alpha = 1.0;
    }

    /**
     * 更新特效
     */
    update(deltaTime) {
        const elapsed = Date.now() - this.startTime;
        const progress = elapsed / this.duration;
        
        if (progress >= 1) {
            this.destroy();
            return;
        }
        
        // 淡出效果
        this.alpha = 1 - progress;
        
        // 爆炸特效会逐渐变大
        if (this.type === 'explosion') {
            this.size = 30 + progress * 40;
        }
    }

    /**
     * 渲染特效
     */
    render(ctx) {
        const game = window.game;
        let useImage = false;
        
        if (game && game.imageManager) {
            // 根据特效类型选择对应的图片
            let imageName = null;
            if (this.type === 'explosion') {
                imageName = 'explosion_effect';
            } else if (this.type === 'freeze') {
                imageName = 'freeze_effect';
            } else if (this.type === 'poison') {
                imageName = 'poison_effect';
            }
            
            if (imageName) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                useImage = game.imageManager.renderSprite(
                    ctx, 
                    imageName, 
                    this.x, 
                    this.y, 
                    this.size, 
                    this.size, 
                    null
                );
                ctx.restore();
            }
        }
        
        // 如果没有使用图片，则使用简单的圆形特效
        if (!useImage) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            
            if (this.type === 'explosion') {
                ctx.fillStyle = '#FF6B35';
            } else if (this.type === 'freeze') {
                ctx.fillStyle = '#87CEEB';
            } else if (this.type === 'poison') {
                ctx.fillStyle = '#9ACD32';
            }
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
};

/**
 * 弹道基类
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
                // 创建爆炸特效
                this.createEffect('explosion');
                break;
            case 'ice':
                // 减速效果
                this.target.applySlow(this.config.slowEffect, this.config.slowDuration);
                // 创建冰冻特效
                this.createEffect('freeze');
                break;
            case 'poison':
                // 中毒效果
                this.target.applyPoison(this.config.poisonDamage, this.config.poisonDuration);
                // 创建中毒特效
                this.createEffect('poison');
                break;
        }

        this.destroy();
    }

    /**
     * 创建特效
     */
    createEffect(type) {
        const game = TowerDefense.Engine.Game.instance;
        if (game) {
            const effect = new TowerDefense.Entities.Effect(this.x, this.y, type, 800);
            game.effects.push(effect);
        }
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
        // 优先使用图片，降级到圆形
        const game = window.game;
        let useImage = false;
        
        if (game && game.imageManager) {
            // 根据塔类型选择对应的弹道图片
            let imageName = null;
            if (this.towerType === 'arrow') {
                imageName = 'arrow_projectile';
            } else if (this.towerType === 'cannon') {
                imageName = 'cannon_projectile';
            } else if (this.towerType === 'ice') {
                imageName = 'ice_projectile';
            } else if (this.towerType === 'poison') {
                imageName = 'poison_projectile';
            }
            
            if (imageName) {
                useImage = game.imageManager.renderSprite(
                    ctx, 
                    imageName, 
                    this.x, 
                    this.y, 
                    this.size * 2, 
                    this.size * 2, 
                    null
                );
            }
        }
        
        // 如果没有使用图片，则使用原来的圆形渲染
        if (!useImage) {
            ctx.fillStyle = this.config.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
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
        // 不再绘制格子边框
        // 用户要求移除格子边框
    }

    /**
     * 渲染路径格子（土路纹理）
     */
    renderPathGrid(ctx) {
        const game = TowerDefense.Engine.Game.instance;
        const dirtRoadImg = game && game.imageManager ? game.imageManager.getImage('dirt_road') : null;
        const monsterNestImg = game && game.imageManager ? game.imageManager.getImage('monster_nest') : null;
        
        for (let pathGrid of this.mapData.pathGrid) {
            const x = this.mapData.offsetX + pathGrid[0] * this.mapData.gridSize;
            const y = this.mapData.offsetY + pathGrid[1] * this.mapData.gridSize;

            // 检查是否是怪物出生点[0,3]
            if (pathGrid[0] === 0 && pathGrid[1] === 3) {
                // 渲染怪物巢穴
                if (monsterNestImg && monsterNestImg.complete) {
                    ctx.drawImage(monsterNestImg, x, y, this.mapData.gridSize, this.mapData.gridSize);
                } else {
                    // 降级显示：深红色背景 + 怪物emoji
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(x, y, this.mapData.gridSize, this.mapData.gridSize);
                    ctx.font = '30px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#FF6B6B';
                    ctx.fillText('🕳️', x + this.mapData.gridSize / 2, y + this.mapData.gridSize / 2);
                }
            } else {
                // 普通路径格子
                if (dirtRoadImg && dirtRoadImg.complete) {
                    // 使用土路图片纹理
                    ctx.drawImage(dirtRoadImg, x, y, this.mapData.gridSize, this.mapData.gridSize);
                } else {
                    // 降级到红色填充
                    ctx.fillStyle = '#FF5252';
                    ctx.fillRect(x, y, this.mapData.gridSize, this.mapData.gridSize);
                }
            }

            // 不再绘制边框
            // 用户要求格子连接处的边框宽度设置为0
            ctx.lineWidth = 0;
        }

        // 不再绘制路径方向箭头
        // 用户要求移除箭头
    }

    /**
     * 渲染路径方向箭头
     */
    renderPathArrows(ctx) {
        // 不再绘制箭头
        // 用户要求移除方格箭头
    }

    /**
     * 渲染可建造区域格子（草地纹理）
     */
    renderBuildableGrid(ctx) {
        const game = TowerDefense.Engine.Game.instance;
        const grassTileImg = game && game.imageManager ? game.imageManager.getImage('grass_tile') : null;
        
        for (let area of this.mapData.buildableAreas) {
            // 始终为可建造区域绘制草地背景
            if (grassTileImg && grassTileImg.complete) {
                ctx.drawImage(grassTileImg, area.x, area.y, area.width, area.height);
                
                // 不再绘制边框
                ctx.lineWidth = 0;
            } else {
                // 降级到绿色填充
                ctx.fillStyle = 'rgba(76, 175, 80, 0.5)';
                ctx.fillRect(area.x, area.y, area.width, area.height);
                // 不再绘制边框
                ctx.lineWidth = 0;
            }
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
            
            // 创建图片元素或使用emoji作为降级
            let iconHtml;
            // 直接使用图片URL，不依赖ImageManager的加载状态
            const imageAssets = [
                { name: 'arrow_tower', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251345.png' },
                { name: 'cannon_tower', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251346.png' },
                { name: 'ice_tower', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251347.png' },
                { name: 'poison_tower', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251348.png' },
                { name: 'heroic_totem', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251349.png' },
                { name: 'speed_beacon', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251351.png' },
                { name: 'weakness_curse', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251352.png' },
                { name: 'slow_field', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251353.png' },
                { name: 'bank_tower', url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251354.png' }
            ];
            
            // 处理特殊塔类型的名称映射
            let towerImageName;
            if (['heroic_totem', 'speed_beacon', 'weakness_curse', 'slow_field', 'bank_tower'].includes(towerType)) {
                towerImageName = towerType; // 这些塔类型直接使用原名
            } else {
                towerImageName = towerType + '_tower'; // 其他塔类型加上_tower后缀
            }
            const imageAsset = imageAssets.find(asset => asset.name === towerImageName);
            
            if (imageAsset) {
                iconHtml = `<img src="${imageAsset.url}" style="width: 40px; height: 40px; object-fit: contain; margin-bottom: 5px;" alt="${config.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                           <div style="font-size: 24px; margin-bottom: 5px; display: none;">${config.icon}</div>`;
            } else {
                iconHtml = `<div style="font-size: 24px; margin-bottom: 5px;">${config.icon}</div>`;
            }
            
            button.innerHTML = `
                ${iconHtml}
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
        this.effects = [];

        // 系统
        this.mapSystem = new TowerDefense.Systems.MapSystem();
        this.waveManager = new TowerDefense.Systems.WaveManager();
        this.uiManager = new TowerDefense.Systems.UIManager();
        
        // 资源管理
        this.imageManager = new TowerDefense.Assets.ImageManager();

        // Canvas和渲染
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.inputManager = new TowerDefense.Engine.InputManager(this.canvas);

        this.init();
    }

    /**
     * 初始化游戏
     */
    async init() {
        // 预加载图片资源
        await this.loadGameAssets();
        
        this.updateUI();
        this.start();
    }

    /**
     * 加载游戏资源
     */
    async loadGameAssets() {
        const imageAssets = [
            // 敌人图片
            {
                name: 'grunt',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201106866.png'
            },
            {
                name: 'runner',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201136287.png'
            },
            {
                name: 'tank',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201138328.png'
            },
            {
                name: 'boss',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201139870.png'
            },
            // 新增敌人图片
            {
                name: 'assassin',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245116.png'
            },
            {
                name: 'heavy_armor',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245115.png'
            },
            {
                name: 'flying_demon',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245114.png'
            },
            {
                name: 'healer',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245113.png'
            },
            {
                name: 'berserker',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245112.png'
            },
            {
                name: 'giant',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245111.png'
            },
            {
                name: 'ghost',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/2025062222245110.png'
            },
            {
                name: 'dragon',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224519.png'
            },
            {
                name: 'necromancer',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224518.png'
            },
            {
                name: 'demon',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224517.png'
            },
            {
                name: 'elemental',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224516.png'
            },
            {
                name: 'golem',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224515.png'
            },
            {
                name: 'vampire',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224514.png'
            },
            {
                name: 'lich',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224513.png'
            },
            {
                name: 'titan',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224512.png'
            },
            {
                name: 'final_boss',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506222224511.png'
            },
            // 塔图片
            {
                name: 'arrow_tower',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251345.png'
            },
            {
                name: 'cannon_tower',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251346.png'
            },
            {
                name: 'ice_tower',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251347.png'
            },
            {
                name: 'poison_tower',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251348.png'
            },
            {
                name: 'heroic_totem',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251349.png'
            },
            {
                name: 'speed_beacon',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251351.png'
            },
            {
                name: 'weakness_curse',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251352.png'
            },
            {
                name: 'slow_field',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251353.png'
            },
            {
                name: 'bank_tower',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251354.png'
            },
            // 弹道图片
            {
                name: 'arrow_projectile',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251355.png'
            },
            {
                name: 'cannon_projectile',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251356.png'
            },
            {
                name: 'ice_projectile',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251357.png'
            },
            {
                name: 'poison_projectile',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251358.png'
            },
            // 特效图片
            {
                name: 'explosion_effect',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251359.png'
            },
            {
                name: 'freeze_effect',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251360.png'
            },
            {
                name: 'poison_effect',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201251361.png'
            },
            // 地图纹理图片
            {
                name: 'dirt_road',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201641383.png'
            },
            {
                name: 'grass_tile',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201642360.png'
            },
            // 怪物巢穴图片
            {
                name: 'monster_nest',
                url: 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506201828706.png'
            }
        ];

        try {
            console.log('🎮 开始加载游戏资源...');
            await this.imageManager.loadImages(imageAssets, (loaded, total, name) => {
                console.log(`📦 资源加载进度: ${loaded}/${total} - ${name}`);
            });
            console.log('✅ 所有游戏资源加载完成！');
        } catch (error) {
            console.warn('⚠️ 部分资源加载失败，将使用emoji降级显示:', error);
        }
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

        // 更新特效
        for (let effect of this.effects) {
            if (effect.active) {
                effect.update(deltaTime);
            }
        }

        // 清理无效对象
        this.towers = this.towers.filter(tower => tower.active);
        this.enemies = this.enemies.filter(enemy => enemy.active);
        this.projectiles = this.projectiles.filter(projectile => projectile.active);
        this.effects = this.effects.filter(effect => effect.active);

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

        // 渲染特效
        for (let effect of this.effects) {
            if (effect.active) {
                effect.render(this.ctx);
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
        this.effects = [];

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
document.addEventListener('DOMContentLoaded', async () => {
    // 创建游戏实例
    const game = new TowerDefense.Engine.Game();
    window.game = game; // 设置为全局变量，供其他组件访问

    console.log('🎮 TD塔防游戏已启动!');
    console.log('📋 游戏说明:');
    console.log('- 点击绿色区域建造塔');
    console.log('- 点击塔可以查看信息和升级');
    console.log('- 阻止敌人到达终点!');
    console.log('- 祝你游戏愉快! (◕‿◕)♡');
});
