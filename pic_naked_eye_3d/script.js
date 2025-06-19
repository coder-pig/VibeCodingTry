/**
 * 裸眼3D图片生成器 - 主要JavaScript文件
 * 实现对比色图层叠加的3D效果
 */

class NakedEye3DGenerator {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 颜色设置
        this.bgColor = '#0500FB'; // 背景色（抠腚男孩蓝）
        this.bgTextColor = '#020F5F'; // 背景文字色
        this.fgTextColor = '#FE0191'; // 前景文字色
        
        // 全局设置
        this.offset = 5;
        this.opacity = 0.8;
        this.offset3D = 12; // 3D偏移量（增强效果）
        this.transparency = 0.8; // 前景层透明度
        
        // 文字管理
        this.textItems = [];
        this.textIdCounter = 0;
        this.selectedTextId = null;
        
        // 拖拽相关属性
        this.isDragging = false;
        this.draggedTextId = null;
        this.dragOffset = null;
        
        // 文字变换相关属性
        this.selectedTextBounds = null;
        this.transformMode = null; // 'move', 'resize', 'rotate'
        this.resizeHandle = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
        this.rotateCenter = null;
        this.initialAngle = 0;
        this.initialScale = null;
        this.initialSize = null;
        
        // 画布尺寸（默认9:16比例）
        this.canvasWidth = 540;
        this.canvasHeight = 960;
        
        this.initializeEventListeners();
        this.initializeDefaultTexts();
        this.updateCanvasSize();
        
        // 设置默认尺寸按钮为激活状态
        setTimeout(() => {
            this.updateSizePresetFocus();
        }, 0);
        
        this.generatePreview();
    }

    /**
     * 初始化默认文字
     */
    initializeDefaultTexts() {
        // 文字库
        const textPool = ['JueJin', 'Vibe Coding', 'Trae', '掘金MCP'];
        
        // 生成随机位置，确保文字完全显示在画布内
        const getRandomPosition = (fontSize) => {
            const margin = fontSize; // 留出字体大小的边距
            const x = margin + Math.random() * (this.canvasWidth - 2 * margin);
            const y = margin + Math.random() * (this.canvasHeight - 2 * margin);
            return { x, y };
        };
        
        // 随机选择文字和层级，生成8个文字项
        for (let i = 0; i < 8; i++) {
            // 随机选择文字
            const randomText = textPool[Math.floor(Math.random() * textPool.length)];
            
            // 随机选择层级（前景或背景）
            const layer = Math.random() < 0.5 ? 'bg' : 'fg';
            
            // 随机字体大小（40-80px）
            const fontSize = 40 + Math.floor(Math.random() * 41);
            
            // 生成随机位置
            const position = getRandomPosition(fontSize);
            
            // 添加文字项
            this.addTextItem(layer, randomText, fontSize, position.x, position.y);
        }
    }

    /**
     * 初始化事件监听器
     */
    initializeEventListeners() {
        // 颜色预设选择
        document.querySelectorAll('.preset').forEach(preset => {
            preset.addEventListener('click', () => {
                this.selectColorPreset(preset);
            });
        });

        // 自定义颜色选择
        document.getElementById('bgColor').addEventListener('input', (e) => {
            this.bgColor = e.target.value;
            this.generatePreview();
        });

        document.getElementById('bgTextColor').addEventListener('input', (e) => {
            this.bgTextColor = e.target.value;
            this.generatePreview();
        });

        document.getElementById('fgTextColor').addEventListener('input', (e) => {
            this.fgTextColor = e.target.value;
            this.generatePreview();
        });

        // 画布尺寸设置
        document.querySelectorAll('.size-preset').forEach(preset => {
            preset.addEventListener('click', () => {
                this.selectSizePreset(preset);
            });
        });

        document.getElementById('canvasWidth').addEventListener('change', (e) => {
            this.canvasWidth = parseInt(e.target.value);
            this.updateSizePresetFocus();
            this.updateCanvasSize();
            this.generatePreview();
        });

        document.getElementById('canvasHeight').addEventListener('change', (e) => {
            this.canvasHeight = parseInt(e.target.value);
            this.updateSizePresetFocus();
            this.updateCanvasSize();
            this.generatePreview();
        });

        // 文字管理
        document.getElementById('addTextBtn').addEventListener('click', () => {
            this.addNewText();
        });
        
        // 清空所有文字按钮
        document.getElementById('clearAllTextBtn').addEventListener('click', () => {
            this.clearAllText();
        });

        // 全局字体选择器
        const globalFontSelect = document.getElementById('fontSelect');
        if (globalFontSelect) {
            globalFontSelect.addEventListener('change', (e) => {
                // 更新所有现有文字项的字体
                this.textItems.forEach(textItem => {
                    textItem.fontFamily = e.target.value;
                });
                this.generatePreview();
            });
        }

        // 全局控制滑块
        document.getElementById('offset').addEventListener('input', (e) => {
            this.offset = parseInt(e.target.value);
            this.offset3D = this.offset; // 同步更新3D偏移量
            document.getElementById('offsetValue').textContent = this.offset + 'px';
            this.generatePreview();
        });

        document.getElementById('opacity').addEventListener('input', (e) => {
            this.opacity = parseFloat(e.target.value);
            this.transparency = this.opacity; // 同步更新透明度
            document.getElementById('opacityValue').textContent = this.opacity;
            this.generatePreview();
        });



        // 按钮事件
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadImage();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetAll();
        });

        // 画布点击事件
        this.canvas.addEventListener('click', (e) => {
            this.handleCanvasClick(e);
        });
        
        // 画布鼠标按下事件
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleCanvasMouseDown(e);
        });
        
        // 画布鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleCanvasMouseMove(e);
        });
        
        // 画布鼠标释放事件
        this.canvas.addEventListener('mouseup', (e) => {
            this.handleCanvasMouseUp(e);
        });
        
        // 键盘删除事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedTextId !== null) {
                this.deleteTextItem(this.selectedTextId);
            }
        });
    }

    /**
     * 选择颜色预设
     */
    selectColorPreset(preset) {
        // 移除其他预设的激活状态
        document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
        
        // 激活当前预设
        preset.classList.add('active');
        
        // 获取颜色值
        this.bgColor = preset.dataset.bg;
        this.fgTextColor = preset.dataset.fg;
        
        // 获取背景文字颜色，如果没有设置则使用对比色
        this.bgTextColor = preset.dataset.bgText || this.getContrastColor(this.bgColor);
        
        // 更新自定义颜色选择器
        document.getElementById('bgColor').value = this.bgColor;
        document.getElementById('bgTextColor').value = this.bgTextColor;
        document.getElementById('fgTextColor').value = this.fgTextColor;
        
        // 生成预览
        this.generatePreview();
    }
    
    /**
     * 选择画布尺寸预设
     */
    selectSizePreset(preset) {
        // 获取尺寸值
        this.canvasWidth = parseInt(preset.dataset.width);
        this.canvasHeight = parseInt(preset.dataset.height);
        
        // 更新输入框
        document.getElementById('canvasWidth').value = this.canvasWidth;
        document.getElementById('canvasHeight').value = this.canvasHeight;
        
        // 更新按钮焦点状态
        this.updateSizePresetFocus();
        
        // 更新画布尺寸
        this.updateCanvasSize();
        
        // 生成预览
        this.generatePreview();
    }
    
    /**
     * 更新尺寸预设按钮的焦点状态
     */
    updateSizePresetFocus() {
        // 移除所有按钮的激活状态
        document.querySelectorAll('.size-preset').forEach(p => p.classList.remove('active'));
        
        // 查找匹配当前尺寸的按钮
        const matchingButton = document.querySelector(
            `.size-preset[data-width="${this.canvasWidth}"][data-height="${this.canvasHeight}"]`
        );
        
        // 如果找到匹配的按钮，设置为激活状态
        if (matchingButton) {
            matchingButton.classList.add('active');
        }
    }

    /**
     * 更新画布尺寸
     */
    updateCanvasSize() {
        this.canvas.width = this.canvasWidth;
        this.canvas.height = this.canvasHeight;
        
        // 调整文字位置以适应新的画布尺寸
        this.adjustTextPositions();
    }
    
    /**
     * 调整文字位置以适应新的画布尺寸
     */
    adjustTextPositions() {
        // 如果没有文字项，直接返回
        if (this.textItems.length === 0) return;
        
        // 计算画布中心
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 遍历所有文字项
        this.textItems.forEach(item => {
            // 如果文字位置超出画布范围，将其移动到画布中心
            if (item.x < 0 || item.x > this.canvas.width || item.y < 0 || item.y > this.canvas.height) {
                item.x = centerX;
                item.y = centerY;
            }
        });
    }

    /**
     * 添加新文字
     */
    addNewText() {
        const layer = document.getElementById('textLayerSelect').value;
        const text = layer === 'bg' ? 'New Background Text' : 'New Foreground Text';
        const fontSize = 60;
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        this.addTextItem(layer, text, fontSize, x, y);
        this.generatePreview();
    }
    
    /**
     * 添加文字项
     */
    addTextItem(layer, text, fontSize, x, y) {
        const id = this.textIdCounter++;
        const fontSelect = document.getElementById('fontSelect');
        const selectedFont = fontSelect ? fontSelect.value : 'system';
        
        const textItem = {
            id,
            layer,
            text,
            fontSize,
            x,
            y,
            fontFamily: selectedFont,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            isDragging: false,
            dragOffsetX: 0,
            dragOffsetY: 0
        };
        
        this.textItems.push(textItem);
        this.renderTextItem(textItem);
        this.selectTextItem(id);
        
        return textItem;
    }
    
    /**
     * 渲染文字项到DOM
     */
    renderTextItem(textItem) {
        const textList = document.getElementById('textList');
        const textItemElement = document.createElement('div');
        textItemElement.className = 'text-item';
        textItemElement.dataset.id = textItem.id;
        
        // 创建文字项头部
        const header = document.createElement('div');
        header.className = 'text-item-header';
        
        const title = document.createElement('div');
        title.className = 'text-item-title';
        
        const layerBadge = document.createElement('span');
        layerBadge.className = `layer-badge ${textItem.layer}`;
        layerBadge.textContent = textItem.layer === 'bg' ? '背景层' : '前景层';
        
        const titleText = document.createElement('span');
        titleText.textContent = `文字 #${textItem.id + 1}`;
        
        title.appendChild(layerBadge);
        title.appendChild(titleText);
        
        const controls = document.createElement('div');
        controls.className = 'text-item-controls';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            this.deleteTextItem(textItem.id);
        });
        
        const dragHint = document.createElement('span');
        dragHint.className = 'drag-hint';
        dragHint.textContent = '点击画布上的文字可直接拖拽';
        
        controls.appendChild(deleteBtn);
        controls.appendChild(dragHint);
        
        header.appendChild(title);
        header.appendChild(controls);
        
        // 创建文字内容编辑区
        const content = document.createElement('div');
        content.className = 'text-item-content';
        
        const textarea = document.createElement('textarea');
        textarea.value = textItem.text;
        textarea.placeholder = '输入文字内容...';
        textarea.addEventListener('input', (e) => {
            textItem.text = e.target.value;
            this.generatePreview();
        });
        
        content.appendChild(textarea);
        
        // 创建文字属性控制区
        const properties = document.createElement('div');
        properties.className = 'text-item-properties';
        
        // 字体选择控制
        const fontGroup = document.createElement('div');
        fontGroup.className = 'property-group';
        
        const fontLabel = document.createElement('label');
        fontLabel.textContent = '字体';
        
        const fontSelect = document.createElement('select');
        fontSelect.className = 'font-selector-item';
        fontSelect.innerHTML = `
            <option value="system">系统默认</option>
            <option value="'Noto Sans SC', sans-serif">思源黑体</option>
            <option value="'Noto Serif SC', serif">思源宋体</option>
            <option value="'Ma Shan Zheng', cursive">马善政楷体</option>
            <option value="'ZCOOL XiaoWei', serif">站酷小薇</option>
            <option value="'ZCOOL KuaiLe', cursive">站酷快乐体</option>
            <option value="'Liu Jian Mao Cao', cursive">刘建毛草</option>
            <option value="'Zhi Mang Xing', cursive">志芒星</option>
        `;
        fontSelect.value = textItem.fontFamily || 'system';
        fontSelect.addEventListener('change', (e) => {
            textItem.fontFamily = e.target.value;
            // 直接调用全局 generator 实例的方法
            if (window.generator) {
                window.generator.generatePreview();
            }
        });
        
        fontGroup.appendChild(fontLabel);
        fontGroup.appendChild(fontSelect);
        
        // 字体大小控制
        const fontSizeGroup = document.createElement('div');
        fontSizeGroup.className = 'property-group';
        
        const fontSizeLabel = document.createElement('label');
        fontSizeLabel.textContent = '字体大小';
        
        const fontSizeInput = document.createElement('input');
        fontSizeInput.type = 'range';
        fontSizeInput.min = '10';
        fontSizeInput.max = '200';
        fontSizeInput.value = textItem.fontSize;
        fontSizeInput.addEventListener('input', (e) => {
            textItem.fontSize = parseInt(e.target.value);
            fontSizeValue.textContent = textItem.fontSize + 'px';
            this.generatePreview();
        });
        
        const fontSizeValue = document.createElement('span');
        fontSizeValue.textContent = textItem.fontSize + 'px';
        
        fontSizeGroup.appendChild(fontSizeLabel);
        fontSizeGroup.appendChild(fontSizeInput);
        fontSizeGroup.appendChild(fontSizeValue);
        
        // 位置控制
        const positionGroup = document.createElement('div');
        positionGroup.className = 'property-group';
        
        const positionLabel = document.createElement('label');
        positionLabel.textContent = '位置 (x, y)';
        
        const positionValue = document.createElement('span');
        positionValue.textContent = `(${Math.round(textItem.x)}, ${Math.round(textItem.y)})`;
        positionValue.dataset.id = textItem.id;
        
        positionGroup.appendChild(positionLabel);
        positionGroup.appendChild(positionValue);
        
        properties.appendChild(fontGroup);
        properties.appendChild(fontSizeGroup);
        properties.appendChild(positionGroup);
        
        // 组装文字项
        textItemElement.appendChild(header);
        textItemElement.appendChild(content);
        textItemElement.appendChild(properties);
        
        // 添加点击事件
        textItemElement.addEventListener('click', () => {
            this.selectTextItem(textItem.id);
        });
        
        // 添加到列表
        textList.appendChild(textItemElement);
    }
    
    /**
     * 选择文字项
     */
    selectTextItem(id) {
        this.selectedTextId = id;
        
        // 计算选中文字的边界
        const selectedText = this.textItems.find(item => item.id === id);
        if (selectedText) {
            this.selectedTextBounds = this.getTextBounds(selectedText);
        } else {
            this.selectedTextBounds = null;
        }
        
        // 更新UI
        document.querySelectorAll('.text-item').forEach(item => {
            if (parseInt(item.dataset.id) === id) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // 重新生成预览以显示控制框
        this.generatePreview();
    }
    
    /**
     * 删除文字项
     */
    deleteTextItem(id) {
        // 从数组中移除
        this.textItems = this.textItems.filter(item => item.id !== id);
        
        // 从DOM中移除
        const textItem = document.querySelector(`.text-item[data-id="${id}"]`);
        if (textItem) {
            textItem.remove();
        }
        
        // 如果删除的是当前选中的项，取消选择
        if (this.selectedTextId === id) {
            this.selectedTextId = null;
        }
        
        // 重新生成预览
        this.generatePreview();
    }
    
    /**
     * 清空所有文字项
     */
    clearAllText() {
        // 清空文字数组
        this.textItems = [];
        
        // 清空DOM中的文字列表
        const textList = document.getElementById('textList');
        if (textList) {
            textList.innerHTML = '';
        }
        
        // 取消当前选择
        this.selectedTextId = null;
        
        // 重新生成预览
        this.generatePreview();
    }
    
    /**
     * 处理画布点击事件
     */
    handleCanvasClick(e) {
        // 获取画布相对于视口的位置
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        

        
        // 检查点击位置是否有文字
        const clickedText = this.getTextAtPosition(x, y);
        if (clickedText) {
            this.selectTextItem(clickedText.id);
        } else {
            // 取消选中
            this.selectedTextId = null;
            document.querySelectorAll('.text-item').forEach(item => {
                item.classList.remove('selected');
            });
        }
    }
    
    /**
     * 处理画布鼠标按下事件
     */
    handleCanvasMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 如果有选中的文字，先检查是否点击了控制点
        if (this.selectedTextId !== null && this.selectedTextBounds) {
            const controlType = this.getControlAtPosition(x, y);
            if (controlType) {
                this.transformMode = controlType.mode;
                this.resizeHandle = controlType.handle;
                this.isDragging = true;
                
                const selectedText = this.textItems.find(item => item.id === this.selectedTextId);
                if (controlType.mode === 'rotate') {
                    this.rotateCenter = { x: selectedText.x, y: selectedText.y };
                    this.initialAngle = Math.atan2(y - this.rotateCenter.y, x - this.rotateCenter.x) * 180 / Math.PI - selectedText.rotation;
                } else if (controlType.mode === 'resize') {
                    this.dragOffset = { x, y };
                    this.initialScale = { x: selectedText.scaleX, y: selectedText.scaleY };
                    this.initialSize = { width: this.selectedTextBounds.width, height: this.selectedTextBounds.height };
                } else if (controlType.mode === 'move') {
                    this.dragOffset = {
                        x: x - selectedText.x,
                        y: y - selectedText.y
                    };
                }
                return;
            }
        }
         
         // 检查点击位置是否有文字
        const clickedText = this.getTextAtPosition(x, y);
        if (clickedText) {
            // 选中文字项
            this.selectTextItem(clickedText.id);
            
            // 只有在文字内容区域才允许拖拽移动
            const bounds = this.getTextBounds(clickedText);
            const isInTextContent = x >= bounds.left + 20 && x <= bounds.right - 20 && 
                                   y >= bounds.top + 20 && y <= bounds.bottom - 20;
            
            if (isInTextContent) {
                this.transformMode = 'move';
                this.isDragging = true;
                this.draggedTextId = clickedText.id;
                this.dragOffset = {
                    x: x - clickedText.x,
                    y: y - clickedText.y
                };
                this.canvas.style.cursor = 'grabbing';
            }
        } else {
            // 点击空白区域，取消选中
            this.selectedTextId = null;
            this.selectedTextBounds = null;
            this.generatePreview();
        }
    }
    
    /**
     * 获取控制点位置
     */
    getControlAtPosition(x, y) {
        if (!this.selectedTextBounds) return null;
        
        const handleSize = 16; // 控制点尺寸
        const tolerance = 8; // 容错范围
        const bounds = this.selectedTextBounds;
        
        // 检查旋转控制点（绿色圆点）
        const rotateHandleDistance = 30;
        const rotateX = bounds.centerX;
        const rotateY = bounds.top - rotateHandleDistance;
        if (Math.abs(x - rotateX) <= handleSize/2 + tolerance && Math.abs(y - rotateY) <= handleSize/2 + tolerance) {
            return { mode: 'rotate' };
        }
        
        // 检查缩放控制点（小方格）
        const handles = [
            { x: bounds.left, y: bounds.top, type: 'nw' },
            { x: bounds.right, y: bounds.top, type: 'ne' },
            { x: bounds.left, y: bounds.bottom, type: 'sw' },
            { x: bounds.right, y: bounds.bottom, type: 'se' },
            { x: bounds.centerX, y: bounds.top, type: 'n' },
            { x: bounds.centerX, y: bounds.bottom, type: 's' },
            { x: bounds.left, y: bounds.centerY, type: 'w' },
            { x: bounds.right, y: bounds.centerY, type: 'e' }
        ];
        
        for (const handle of handles) {
            if (Math.abs(x - handle.x) <= handleSize/2 + tolerance && Math.abs(y - handle.y) <= handleSize/2 + tolerance) {
                return { mode: 'resize', handle: handle.type };
            }
        }
        
        return null;
    }
    
    /**
     * 处理画布鼠标移动事件
     */
    handleCanvasMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.isDragging) {
            
            // 处理文字变换
            const selectedText = this.textItems.find(item => item.id === this.selectedTextId || item.id === this.draggedTextId);
            if (selectedText) {
                if (this.transformMode === 'move') {
                    selectedText.x = x - this.dragOffset.x;
                    selectedText.y = y - this.dragOffset.y;
                    
                    // 更新位置显示
                    const positionValue = document.querySelector(`.property-group span[data-id="${selectedText.id}"]`);
                    if (positionValue) {
                        positionValue.textContent = `(${Math.round(selectedText.x)}, ${Math.round(selectedText.y)})`;
                    }
                } else if (this.transformMode === 'rotate') {
                    const angle = Math.atan2(y - this.rotateCenter.y, x - this.rotateCenter.x) * 180 / Math.PI;
                    selectedText.rotation = angle - this.initialAngle;
                } else if (this.transformMode === 'resize') {
                    const deltaX = x - this.dragOffset.x;
                    const deltaY = y - this.dragOffset.y;
                    
                    let scaleFactorX = 1;
                    let scaleFactorY = 1;
                    
                    if (this.resizeHandle.includes('e')) {
                        scaleFactorX = 1 + deltaX / this.initialSize.width;
                    } else if (this.resizeHandle.includes('w')) {
                        scaleFactorX = 1 - deltaX / this.initialSize.width;
                    }
                    
                    if (this.resizeHandle.includes('s')) {
                        scaleFactorY = 1 + deltaY / this.initialSize.height;
                    } else if (this.resizeHandle.includes('n')) {
                        scaleFactorY = 1 - deltaY / this.initialSize.height;
                    }
                    
                    // 保持最小缩放比例
                    scaleFactorX = Math.max(0.1, scaleFactorX);
                    scaleFactorY = Math.max(0.1, scaleFactorY);
                    
                    selectedText.scaleX = this.initialScale.x * scaleFactorX;
                    selectedText.scaleY = this.initialScale.y * scaleFactorY;
                    
                    // 更新字体大小滑块的值
                    const newFontSize = Math.round(selectedText.fontSize * selectedText.scaleY);
                    const fontSizeInput = document.querySelector(`.text-item[data-id="${selectedText.id}"] input[type="range"]`);
                    const fontSizeValue = document.querySelector(`.text-item[data-id="${selectedText.id}"] .property-group span`);
                    if (fontSizeInput && fontSizeValue) {
                        fontSizeInput.value = newFontSize;
                        fontSizeValue.textContent = newFontSize + 'px';
                    }
                }
                this.generatePreview();
            }
        } else {
            // 更新鼠标样式
            let cursor = 'default';
            

            
            // 检查是否悬停在文字控制点上
            if (cursor === 'default' && this.selectedTextId !== null && this.selectedTextBounds) {
                const controlType = this.getControlAtPosition(x, y);
                if (controlType) {
                    if (controlType.mode === 'rotate') {
                        cursor = 'crosshair';
                    } else if (controlType.mode === 'resize') {
                        const handle = controlType.handle;
                        if (handle === 'nw' || handle === 'se') cursor = 'nw-resize';
                        else if (handle === 'ne' || handle === 'sw') cursor = 'ne-resize';
                        else if (handle === 'n' || handle === 's') cursor = 'ns-resize';
                        else if (handle === 'e' || handle === 'w') cursor = 'ew-resize';
                    }
                } else {
                    const hoveredText = this.getTextAtPosition(x, y);
                    if (hoveredText) {
                        const bounds = this.getTextBounds(hoveredText);
                        const isInTextContent = x >= bounds.left + 20 && x <= bounds.right - 20 && 
                                               y >= bounds.top + 20 && y <= bounds.bottom - 20;
                        cursor = isInTextContent ? 'grab' : 'default';
                    }
                }
            }
            

            
            // 检查是否悬停在文字上（未选中状态）
            if (cursor === 'default') {
                const hoveredText = this.getTextAtPosition(x, y);
                cursor = hoveredText ? 'pointer' : 'default';
            }
            
            this.canvas.style.cursor = cursor;
        }
    }
    
    /**
     * 处理画布鼠标释放事件
     */
    handleCanvasMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedTextId = null;
            this.dragOffset = null;
            this.transformMode = null;
            this.resizeHandle = null;
            this.rotateCenter = null;
            this.initialAngle = null;
            this.initialScale = null;
            this.initialSize = null;
            this.canvas.style.cursor = 'default';
            
            // 根据操作类型显示不同的通知
            if (this.selectedTextId !== null) {
                this.showNotification('文字位置已更新', 'success');
            }
        }
    }
    

    
    /**
     * 获取指定位置的文字项
     */
    getTextAtPosition(x, y) {
        // 按照z-index倒序检查（后绘制的在上层）
        for (let i = this.textItems.length - 1; i >= 0; i--) {
            const textItem = this.textItems[i];
            if (!textItem.text.trim()) continue;
            
            // 使用getTextBounds方法获取准确的边界
            const bounds = this.getTextBounds(textItem);
            
            // 增加点击容错范围，让点击更容易
            const tolerance = 5;
            const expandedBounds = {
                left: bounds.left - tolerance,
                right: bounds.right + tolerance,
                top: bounds.top - tolerance,
                bottom: bounds.bottom + tolerance
            };
            
            // 如果文字有旋转，需要进行反向旋转变换来检测点击
            if (textItem.rotation && textItem.rotation !== 0) {
                // 将点击坐标转换到文字的本地坐标系
                const centerX = textItem.x;
                const centerY = textItem.y;
                const angle = -textItem.rotation * Math.PI / 180; // 反向旋转
                
                // 旋转变换
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const dx = x - centerX;
                const dy = y - centerY;
                const rotatedX = centerX + dx * cos - dy * sin;
                const rotatedY = centerY + dx * sin + dy * cos;
                
                // 检查旋转后的坐标是否在边界内
                if (rotatedX >= expandedBounds.left && rotatedX <= expandedBounds.right &&
                    rotatedY >= expandedBounds.top && rotatedY <= expandedBounds.bottom) {
                    return textItem;
                }
            } else {
                // 没有旋转的情况，直接检查边界
                if (x >= expandedBounds.left && x <= expandedBounds.right &&
                    y >= expandedBounds.top && y <= expandedBounds.bottom) {
                    return textItem;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 绘制变换控制框
     */
    drawTransformControls(ctx) {
        const selectedText = this.textItems.find(item => item.id === this.selectedTextId);
        if (!selectedText || !selectedText.text.trim()) return;
        
        ctx.save();
        
        // 计算文字边界
        const bounds = this.getTextBounds(selectedText);
        this.selectedTextBounds = bounds;
        
        // 绘制选择框
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
        
        // 绘制控制点
        const handleSize = 16; // 与检测逻辑匹配的控制点尺寸
        const handles = [
            { x: bounds.left, y: bounds.top, type: 'nw' },
            { x: bounds.right, y: bounds.top, type: 'ne' },
            { x: bounds.left, y: bounds.bottom, type: 'sw' },
            { x: bounds.right, y: bounds.bottom, type: 'se' },
            { x: bounds.centerX, y: bounds.top, type: 'n' },
            { x: bounds.centerX, y: bounds.bottom, type: 's' },
            { x: bounds.left, y: bounds.centerY, type: 'w' },
            { x: bounds.right, y: bounds.centerY, type: 'e' }
        ];
        
        ctx.fillStyle = '#007bff';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2; // 增加边框宽度
        ctx.setLineDash([]);
        
        handles.forEach(handle => {
            ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
            ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        });
        
        // 绘制旋转控制点
        const rotateHandleDistance = 30;
        const rotateX = bounds.centerX;
        const rotateY = bounds.top - rotateHandleDistance;
        
        // 旋转控制线
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bounds.centerX, bounds.top);
        ctx.lineTo(rotateX, rotateY);
        ctx.stroke();
        
        // 旋转控制点（更大的圆形）
        ctx.fillStyle = '#28a745';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rotateX, rotateY, handleSize/2 + 4, 0, 2 * Math.PI); // 更大的旋转控制点
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 获取文字边界
     */
    getTextBounds(textItem) {
        // 创建临时画布用于测量
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const fontFamily = textItem.fontFamily && textItem.fontFamily !== 'system' 
            ? textItem.fontFamily 
            : 'Arial, sans-serif';
        tempCtx.font = `bold ${textItem.fontSize * textItem.scaleY}px ${fontFamily}`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'top';
        
        const lines = textItem.text.split('\n');
        const lineHeight = textItem.fontSize * textItem.scaleY * 1.2;
        const totalHeight = lines.length * lineHeight;
        
        let maxWidth = 0;
        lines.forEach(line => {
            const metrics = tempCtx.measureText(line);
            maxWidth = Math.max(maxWidth, metrics.width * textItem.scaleX);
        });
        
        const padding = 10;
        const left = textItem.x - maxWidth/2 - padding;
        const top = textItem.y - totalHeight/2 - padding;
        const width = maxWidth + padding * 2;
        const height = totalHeight + padding * 2;
        
        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height,
            centerX: left + width/2,
            centerY: top + height/2
        };
    }
    


    /**
     * 生成3D预览效果
     */
    generatePreview() {
        if (!this.canvas) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 设置画布背景
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景层
        this.drawBackgroundLayer();
        
        // 绘制前景层
        this.drawForegroundLayer();
        
        // 应用3D效果
        this.apply3DEffect();
    }

    /**
     * 绘制背景层
     */
    drawBackgroundLayer() {
        // 填充背景色
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景层文字
        this.drawTextLayer(this.ctx, 'bg');
        

        
        // 绘制变换控制框（在背景层的最后绘制，确保在所有内容之上）
        this.drawTransformControls(this.ctx);
    }

    /**
     * 绘制前景层
     */
    drawForegroundLayer() {
        // 创建临时画布用于前景层
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 前景层保持透明，不填充背景色
        
        // 绘制前景层文字（带偏移）
        this.drawTextLayer(tempCtx, 'fg', this.offset3D);
        

        
        // 应用透明度并合成到主画布
        this.ctx.globalAlpha = this.transparency;
        this.ctx.drawImage(tempCanvas, 0, 0);
        this.ctx.globalAlpha = 1.0;
    }



    /**
     * 绘制文字层
     */
    drawTextLayer(ctx, layer, offsetX = 0) {
        // 过滤出指定层的文字项
        const layerTexts = this.textItems.filter(item => item.layer === layer);
        
        layerTexts.forEach(textItem => {
            if (textItem.text.trim()) {
                ctx.save();
                
                // 应用变换
                ctx.translate(textItem.x + offsetX, textItem.y);
                ctx.rotate(textItem.rotation * Math.PI / 180);
                ctx.scale(textItem.scaleX, textItem.scaleY);
                
                // 设置文字颜色
                ctx.fillStyle = layer === 'bg' ? this.bgTextColor : this.fgTextColor;
                
                // 设置字体
                const fontFamily = textItem.fontFamily && textItem.fontFamily !== 'system' 
                    ? textItem.fontFamily 
                    : 'Arial, sans-serif';
                ctx.font = `bold ${textItem.fontSize}px ${fontFamily}`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 添加文字阴影效果
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                
                // 绘制多行文字
                const lines = textItem.text.split('\n');
                const lineHeight = textItem.fontSize * 1.2;
                const startY = -(lines.length - 1) * lineHeight / 2;
                
                lines.forEach((line, index) => {
                    ctx.fillText(
                        line, 
                        0, 
                        startY + index * lineHeight
                    );
                });
                
                ctx.restore();
            }
        });
        
        // 绘制选中文字的变换控制框
        if (layer === 'bg' && this.selectedTextId !== null) {
            this.drawTransformControls(ctx);
        }
    }



    /**
     * 下载生成的图片
     */
    downloadImage() {
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `naked-eye-3d-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 显示成功提示
        this.showNotification('图片下载成功！ 📸', 'success');
    }

    /**
     * 重置所有设置
     */
    resetAll() {
        // 重置颜色
        this.bgColor = '#0500FB';
        this.bgTextColor = '#020F5F';
        this.fgTextColor = '#FE0191';
        document.getElementById('bgColor').value = this.bgColor;
        document.getElementById('bgTextColor').value = this.bgTextColor;
        document.getElementById('fgTextColor').value = this.fgTextColor;
        
        // 重置画布尺寸
        this.canvasWidth = 540;
        this.canvasHeight = 960;
        document.getElementById('canvasWidth').value = this.canvasWidth;
        document.getElementById('canvasHeight').value = this.canvasHeight;
        
        // 重置文字项
        this.textItems = [];
        this.textIdCounter = 0;
        this.selectedTextId = null;
        document.getElementById('textList').innerHTML = '';
        
        // 重置控制参数
        this.offset = 5;
        this.opacity = 0.8;
        document.getElementById('offset').value = this.offset;
        document.getElementById('opacity').value = this.opacity;
        document.getElementById('offsetValue').textContent = this.offset + 'px';
        document.getElementById('opacityValue').textContent = this.opacity;
        

        
        // 移除预设激活状态
        document.querySelectorAll('.preset').forEach(p => p.classList.remove('active'));
        
        // 更新尺寸按钮焦点状态
        this.updateSizePresetFocus();
        
        // 更新画布尺寸
        this.updateCanvasSize();
        
        // 重新初始化默认文字
        this.initializeDefaultTexts();
        
        // 重新生成预览
        this.generatePreview();
        
        this.showNotification('已重置所有设置！ 🔄', 'info');
    }

    /**
     * 显示通知消息
     */
    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 设置样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#28a745' : 
                           type === 'error' ? '#dc3545' : '#17a2b8'
        });
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    /**
     * 获取互补色
     */
    getComplementaryColor(hex) {
        // 移除 # 符号
        hex = hex.replace('#', '');
        
        // 转换为 RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 计算互补色
        const compR = 255 - r;
        const compG = 255 - g;
        const compB = 255 - b;
        
        // 转换回十六进制
        return `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`;
    }

    /**
     * 应用3D效果
     */
    apply3DEffect() {
        // 创建临时画布用于高级效果处理
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 复制当前画布内容
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // 应用模糊效果增强3D感
        this.ctx.save();
        this.ctx.filter = 'blur(1.5px)';
        this.ctx.globalAlpha = 0.6;
        this.ctx.drawImage(tempCanvas, 2, 2);
        this.ctx.restore();
        
        // 添加额外的阴影层增强立体感
        this.ctx.save();
        this.ctx.filter = 'blur(0.8px)';
        this.ctx.globalAlpha = 0.4;
        this.ctx.drawImage(tempCanvas, -1, -1);
        this.ctx.restore();
        
        // 叠加原始清晰图像
        this.ctx.globalAlpha = 1;
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    /**
     * 获取对比色
     */
    getContrastColor(hex) {
        // 移除 # 符号
        hex = hex.replace('#', '');
        
        // 转换为 RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 计算亮度
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // 返回黑色或白色作为对比色
        return brightness > 128 ? '#000000' : '#FFFFFF';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.generator = new NakedEye3DGenerator();
    
    // 添加页面加载动画
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
    
    console.log('🎨 裸眼3D图片生成器已加载完成！');
});