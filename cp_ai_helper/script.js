// CP AI Prompt助手 - 主要功能实现

class CPAIHelper {
    constructor() {
        this.apiKey = localStorage.getItem('deepseek_api_key') || '';
        this.apiUrl = localStorage.getItem('deepseek_api_url') || 'https://api.deepseek.com';
        this.selectedModel = localStorage.getItem('deepseek_model') || 'deepseek-chat';
        this.apiBaseUrl = `${this.apiUrl}/v1/chat/completions`;
        this.dimensions = {
            persona: '角色扮演 (Persona)',
            instruction: '清晰指令 (Clear Instruction)',
            context: '提供背景 (Context)',
            examples: '给出示例 (Examples / Few-shot)',
            output: '定义输出 (Define Output)',
            stepbystep: '分步思考 (Step-by-Step / Chain of Thought)',
            audience: '指定受众 (Audience)',
            constraints: '设定约束 (Constraints)',
            style: '风格与语气 (Style & Tone)',
            reflection: '鼓励反思 (Reflection)'
        };

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.bindEvents();
        this.loadApiKey();
        this.checkApiStatus();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // API设置相关
        const saveApiKeyBtn = document.getElementById('saveApiKey');
        const testApiKeyBtn = document.getElementById('testApiKey');
        const apiKeyInput = document.getElementById('apiKey');
        const apiUrlInput = document.getElementById('apiUrl');
        
        if (saveApiKeyBtn) saveApiKeyBtn.addEventListener('click', () => this.saveApiSettings());
        if (testApiKeyBtn) testApiKeyBtn.addEventListener('click', () => this.testApiKey());
        if (apiKeyInput) apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiSettings();
        });
        if (apiUrlInput) apiUrlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveApiSettings();
        });

        // 弹窗控制
        const settingsBtn = document.getElementById('settingsBtn');
        const closeModal = document.getElementById('closeModal');
        const settingsModal = document.getElementById('settingsModal');
        
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.openSettingsModal());
        if (closeModal) closeModal.addEventListener('click', () => this.closeSettingsModal());
        if (settingsModal) settingsModal.addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettingsModal();
        });

        // 生成提示词
        const generatePrompts = document.getElementById('generatePrompts');
        const userInput = document.getElementById('userInput');
        
        if (generatePrompts) generatePrompts.addEventListener('click', () => this.generateAllPrompts());
        if (userInput) {
            userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) this.generateAllPrompts();
            });
            userInput.addEventListener('input', debounce(() => {
                this.autoUpdateFinalPrompt();
            }, 300));
        }

        // 重新生成单个维度
        document.querySelectorAll('.regenerate-btn').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    const dimension = e.target.getAttribute('data-dimension');
                    if (dimension) {
                        this.regenerateDimension(dimension);
                    }
                });
            }
        });

        // 最终提示词相关
        const copyFinalPrompt = document.getElementById('copyFinalPrompt');
        const testFinalPrompt = document.getElementById('testFinalPrompt');
        
        if (copyFinalPrompt) copyFinalPrompt.addEventListener('click', () => this.copyFinalPrompt());
        if (testFinalPrompt) testFinalPrompt.addEventListener('click', () => this.testFinalPrompt());

        // 维度内容变化监听
        document.querySelectorAll('.dimension-content').forEach(textarea => {
            if (textarea) {
                textarea.addEventListener('input', debounce(() => this.onDimensionContentChange(), 300));
            }
        });
    }

    /**
     * 加载保存的API设置
     */
    loadApiKey() {
        if (this.apiKey) {
            document.getElementById('apiKey').value = this.apiKey;
        }
        if (this.apiUrl) {
            document.getElementById('apiUrl').value = this.apiUrl;
        }
        if (this.selectedModel) {
            document.getElementById('modelSelect').value = this.selectedModel;
        }
    }

    /**
     * 保存API设置
     */
    saveApiSettings() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiUrlInput = document.getElementById('apiUrl');
        const modelSelect = document.getElementById('modelSelect');
        const apiKey = apiKeyInput.value.trim();
        const apiUrl = apiUrlInput.value.trim();
        const selectedModel = modelSelect.value;
        
        if (!apiKey) {
            this.showApiStatus('请输入有效的API Key', 'error');
            return;
        }
        
        if (!apiUrl) {
            this.showApiStatus('请输入有效的API域名', 'error');
            return;
        }
        
        // 验证URL格式
        try {
            new URL(apiUrl);
        } catch (error) {
            this.showApiStatus('API域名格式不正确，请输入完整的URL（如：https://api.deepseek.com）', 'error');
            return;
        }

        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.selectedModel = selectedModel;
        this.apiBaseUrl = `${apiUrl}/v1/chat/completions`;
        
        localStorage.setItem('deepseek_api_key', apiKey);
        localStorage.setItem('deepseek_api_url', apiUrl);
        localStorage.setItem('deepseek_model', selectedModel);
        
        this.showApiStatus('API设置保存成功！', 'success');
        this.checkApiStatus();
    }

    /**
     * 显示API状态信息
     */
    showApiStatus(message, type) {
        const statusElement = document.getElementById('apiStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `api-status ${type}`;
            statusElement.style.display = 'block';
            
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 3000);
        }
        
        // 如果是错误且没有API Key，自动打开设置弹窗
        if (type === 'error' && !this.apiKey && message.includes('API Key')) {
            this.openSettingsModal();
        }
    }

    /**
     * 检查API状态
     */
    checkApiStatus() {
        const hasApiKey = !!this.apiKey;
        const generateBtn = document.getElementById('generatePrompts');
        const regenerateBtns = document.querySelectorAll('.regenerate-btn');
        
        if (hasApiKey) {
            generateBtn.disabled = false;
            regenerateBtns.forEach(btn => btn.disabled = false);
        } else {
            generateBtn.disabled = true;
            regenerateBtns.forEach(btn => btn.disabled = true);
        }
    }

    /**
     * 测试API Key是否可用
     */
    async testApiKey() {
        const apiKeyInput = document.getElementById('apiKey');
        const apiUrlInput = document.getElementById('apiUrl');
        const modelSelect = document.getElementById('modelSelect');
        const apiKey = apiKeyInput.value.trim();
        const apiUrl = apiUrlInput.value.trim();
        const selectedModel = modelSelect.value;
        
        if (!apiKey) {
            this.showApiStatus('请先输入API Key', 'error');
            return;
        }
        
        if (!apiUrl) {
            this.showApiStatus('请先输入API域名', 'error');
            return;
        }
        
        const testBtn = document.getElementById('testApiKey');
        const originalText = testBtn.textContent;
        testBtn.textContent = '🔄 测试中...';
        testBtn.disabled = true;
        
        try {
            // 验证URL格式
            new URL(apiUrl);
            
            const testApiBaseUrl = `${apiUrl}/v1/chat/completions`;
            console.log('测试API连接:', {
                url: testApiBaseUrl,
                model: selectedModel,
                hasApiKey: !!apiKey
            });
            
            const requestBody = {
                model: selectedModel,
                messages: [
                    {
                        role: 'user',
                        content: '你好，这是一个API连接测试。请简单回复"连接成功"。'
                    }
                ],
                max_tokens: 50,
                temperature: 0.1
            };
            
            const response = await fetch(testApiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('测试API响应状态:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = `API请求失败: ${response.status} ${response.statusText}`;
                
                // 只有当响应是JSON格式时才尝试解析
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        if (errorData.error?.message) {
                            errorMessage = errorData.error.message;
                        } else if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                        console.log('API错误详情:', errorData);
                    } catch (parseError) {
                        console.error('解析JSON错误响应失败:', parseError);
                    }
                } else {
                    // 非JSON响应，可能是HTML错误页面
                    console.log('收到非JSON错误响应，Content-Type:', contentType);
                    if (response.status === 404) {
                        errorMessage = 'API端点不存在 (404)，请检查API域名和路径是否正确';
                    } else if (response.status === 401) {
                        errorMessage = 'API Key无效或已过期 (401)';
                    } else if (response.status === 403) {
                        errorMessage = 'API访问被拒绝 (403)，请检查权限';
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('测试API响应数据:', data);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                this.showApiStatus('✅ API Key测试成功！连接正常', 'success');
            } else {
                throw new Error('API响应格式异常');
            }
        } catch (error) {
            console.error('API测试失败:', error);
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                this.showApiStatus('❌ 网络连接失败，请检查API域名是否正确', 'error');
            } else {
                this.showApiStatus(`❌ API测试失败: ${error.message}`, 'error');
            }
        } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    /**
     * 调用API
     */
    async callDeepSeekAPI(prompt, maxTokens = 1000) {
        if (!this.apiKey) {
            throw new Error('请先设置API Key');
        }

        try {
            console.log('API调用信息:', {
                url: this.apiBaseUrl,
                model: this.selectedModel,
                hasApiKey: !!this.apiKey
            });

            const requestBody = {
                model: this.selectedModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.7
            };

            const response = await fetch(this.apiBaseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            console.log('API响应状态:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = `API请求失败: ${response.status} ${response.statusText}`;
                
                // 只有当响应是JSON格式时才尝试解析
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        if (errorData.error?.message) {
                            errorMessage = errorData.error.message;
                        } else if (errorData.message) {
                            errorMessage = errorData.message;
                        }
                        console.log('API错误详情:', errorData);
                    } catch (parseError) {
                        console.error('解析JSON错误响应失败:', parseError);
                    }
                } else {
                    // 非JSON响应，可能是HTML错误页面
                    console.log('收到非JSON错误响应，Content-Type:', contentType);
                    if (response.status === 404) {
                        errorMessage = 'API端点不存在 (404)，请检查API域名和路径是否正确';
                    } else if (response.status === 401) {
                        errorMessage = 'API Key无效或已过期 (401)';
                    } else if (response.status === 403) {
                        errorMessage = 'API访问被拒绝 (403)，请检查权限';
                    }
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API响应数据:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API响应格式异常');
            }
            
            return data.choices[0].message.content;
        } catch (error) {
            console.error('API调用错误:', error);
            throw error;
        }
    }

    /**
     * 显示加载状态
     */
    showLoading(show = true) {
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = show ? 'flex' : 'none';
    }

    /**
     * 生成所有维度的提示词（一次API调用）
     */
    async generateAllPrompts() {
        const userInput = document.getElementById('userInput').value.trim();
        
        if (!userInput) {
            alert('请先输入一个问题！');
            return;
        }

        if (!this.apiKey) {
            this.showApiStatus('请先设置API Key！', 'error');
            this.openSettingsModal();
            return;
        }

        this.showLoading(true);
        
        try {
            // 构建一次性生成所有维度的综合提示词
            const comprehensivePrompt = this.buildComprehensivePrompt(userInput);
            
            // 调用API一次性生成所有维度
            const result = await this.callDeepSeekAPI(comprehensivePrompt, 3000);
            
            // 解析并分配结果到各个维度
            this.parseAndAssignResults(result);
            
            this.showApiStatus('所有维度提示词生成完成！', 'success');
        } catch (error) {
            console.error('生成提示词失败:', error);
            this.showApiStatus(`生成失败: ${error.message}`, 'error');
            
            // 如果是API相关错误，打开设置弹窗
            if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
                this.openSettingsModal();
            }
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * 构建综合提示词，一次性生成所有十个维度
     */
    buildComprehensivePrompt(userInput) {
        return `请基于用户问题"${userInput}"，为这个问题生成十个维度的提示词优化建议。请严格按照以下格式输出，每个维度独立成段：

【角色扮演】
为这个任务设计一个合适的专家角色，提供具体的角色设定，包括专业背景、经验和特长。格式："你是一位..."

【清晰指令】
将用户问题转化为清晰、具体的指令，使用明确的动词（如分析、比较、总结、设计等），避免模糊的表达。

【提供背景】
提供必要的背景信息和上下文，帮助AI更好地理解任务的来龙去脉、目标和约束条件。

【给出示例】
提供1-2个具体的示例，展示期望的输入输出格式或风格。使用"示例1:..."的格式。

【定义输出】
明确定义输出要求，包括格式（如Markdown、JSON、列表等）、结构（标题、段落等）和长度要求。

【分步思考】
如果这是一个复杂问题，添加引导AI逐步思考的指令，如"请逐步分析"或"Let's think step by step"。

【指定受众】
明确指定目标受众，说明内容是为谁准备的，他们的背景知识水平如何。

【设定约束】
设定必要的约束条件，明确告诉AI不要做什么，避免什么内容或风格。

【风格与语气】
定义期望的写作风格和语气，如正式/非正式、幽默/严肃、简洁/详细等。

【鼓励反思】
如果这是创意或重要内容，添加让AI自我反思和改进的指令，如"请评估并改进你的回答"。

请确保每个维度的内容都是针对用户问题"${userInput}"量身定制的，实用且具体。`;
    }

    /**
     * 解析API返回结果并分配到各个维度
     */
    parseAndAssignResults(result) {
        // 定义维度标识符和对应的数据属性
        const dimensionMappings = {
            '【角色扮演】': 'persona',
            '【清晰指令】': 'instruction', 
            '【提供背景】': 'context',
            '【给出示例】': 'examples',
            '【定义输出】': 'output',
            '【分步思考】': 'stepbystep',
            '【指定受众】': 'audience',
            '【设定约束】': 'constraints',
            '【风格与语气】': 'style',
            '【鼓励反思】': 'reflection'
        };

        // 按维度标识符分割结果
        const sections = {};
        let currentSection = '';
        let currentContent = '';
        
        const lines = result.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // 检查是否是维度标题
            let foundDimension = null;
            for (const [marker, dimension] of Object.entries(dimensionMappings)) {
                if (trimmedLine.includes(marker)) {
                    foundDimension = dimension;
                    break;
                }
            }
            
            if (foundDimension) {
                // 保存之前的内容
                if (currentSection && currentContent.trim()) {
                    sections[currentSection] = currentContent.trim();
                }
                // 开始新的维度
                currentSection = foundDimension;
                currentContent = '';
            } else if (currentSection && trimmedLine) {
                // 添加内容到当前维度
                currentContent += (currentContent ? '\n' : '') + trimmedLine;
            }
        }
        
        // 保存最后一个维度的内容
        if (currentSection && currentContent.trim()) {
            sections[currentSection] = currentContent.trim();
        }

        // 将解析的内容分配到对应的文本框
        Object.keys(this.dimensions).forEach(dimension => {
            const textarea = document.querySelector(`textarea[data-dimension="${dimension}"]`);
            if (textarea) {
                const content = sections[dimension] || '生成失败，请重新尝试';
                textarea.value = content;
                
                // 添加成功动画
                if (sections[dimension]) {
                    textarea.parentElement.classList.add('success-animation');
                    setTimeout(() => {
                        textarea.parentElement.classList.remove('success-animation');
                    }, 600);
                }
            }
        });
        
        // 生成所有维度后自动更新最终提示词
        this.autoUpdateFinalPrompt();
    }

    /**
     * 生成单个维度的提示词
     */
    async generateDimensionPrompt(dimension, userInput) {
        const prompts = {
            persona: `基于用户问题"${userInput}"，为这个任务设计一个合适的专家角色。请提供一个具体的角色设定，包括专业背景、经验和特长。格式："你是一位..."`,
            
            instruction: `基于用户问题"${userInput}"，将其转化为清晰、具体的指令。使用明确的动词（如分析、比较、总结、设计等），避免模糊的表达。`,
            
            context: `基于用户问题"${userInput}"，提供必要的背景信息和上下文，帮助AI更好地理解任务的来龙去脉、目标和约束条件。`,
            
            examples: `基于用户问题"${userInput}"，提供1-2个具体的示例，展示期望的输入输出格式或风格。使用"示例1:..."的格式。`,
            
            output: `基于用户问题"${userInput}"，明确定义输出要求，包括格式（如Markdown、JSON、列表等）、结构（标题、段落等）和长度要求。`,
            
            stepbystep: `基于用户问题"${userInput}"，如果这是一个复杂问题，添加引导AI逐步思考的指令，如"请逐步分析"或"Let's think step by step"。`,
            
            audience: `基于用户问题"${userInput}"，明确指定目标受众，说明内容是为谁准备的，他们的背景知识水平如何。`,
            
            constraints: `基于用户问题"${userInput}"，设定必要的约束条件，明确告诉AI不要做什么，避免什么内容或风格。`,
            
            style: `基于用户问题"${userInput}"，定义期望的写作风格和语气，如正式/非正式、幽默/严肃、简洁/详细等。`,
            
            reflection: `基于用户问题"${userInput}"，如果这是创意或重要内容，添加让AI自我反思和改进的指令，如"请评估并改进你的回答"。`
        };

        try {
            const result = await this.callDeepSeekAPI(prompts[dimension], 500);
            const textarea = document.querySelector(`textarea[data-dimension="${dimension}"]`);
            if (textarea) {
                textarea.value = result.trim();
                // 添加成功动画
                textarea.parentElement.classList.add('success-animation');
                setTimeout(() => {
                    textarea.parentElement.classList.remove('success-animation');
                }, 600);
                
                // 自动更新最终提示词
                this.autoUpdateFinalPrompt();
            }
        } catch (error) {
            console.error(`生成${dimension}维度失败:`, error);
            const textarea = document.querySelector(`textarea[data-dimension="${dimension}"]`);
            if (textarea) {
                textarea.value = `生成失败: ${error.message}`;
            }
        }
    }

    /**
     * 重新生成单个维度
     */
    async regenerateDimension(dimension) {
        const userInput = document.getElementById('userInput').value.trim();
        
        if (!userInput) {
            alert('请先输入一个问题！');
            return;
        }

        if (!this.apiKey) {
            this.showApiStatus('请先设置API Key！', 'error');
            this.openSettingsModal();
            return;
        }

        const btn = document.querySelector(`button[data-dimension="${dimension}"]`);
        const originalText = btn.textContent;
        btn.textContent = '⏳';
        btn.disabled = true;

        try {
            await this.generateDimensionPrompt(dimension, userInput);
            this.showApiStatus(`${this.dimensions[dimension]}重新生成完成！`, 'success');
            // 重新生成后自动更新最终提示词
            this.autoUpdateFinalPrompt();
        } catch (error) {
            this.showApiStatus(`重新生成失败: ${error.message}`, 'error');
            
            // 如果是API相关错误，打开设置弹窗
            if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
                this.openSettingsModal();
            }
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    /**
     * 维度内容变化时的处理
     */
    onDimensionContentChange() {
        // 自动更新最终提示词
        this.autoUpdateFinalPrompt();
    }

    /**
     * 自动更新最终提示词
     */
    autoUpdateFinalPrompt() {
        const userInput = document.getElementById('userInput').value.trim();
        
        if (!userInput) {
            document.getElementById('finalPrompt').value = '';
            return;
        }

        // 收集所有维度的内容
        const dimensionContents = {};
        let hasContent = false;
        
        Object.keys(this.dimensions).forEach(dimension => {
            const textarea = document.querySelector(`textarea[data-dimension="${dimension}"]`);
            if (textarea && textarea.value.trim()) {
                dimensionContents[dimension] = textarea.value.trim();
                hasContent = true;
            }
        });

        if (!hasContent) {
            document.getElementById('finalPrompt').value = '';
            return;
        }

        // 构建并显示最终提示词
        const finalPrompt = this.buildFinalPromptFromDimensions(dimensionContents);
        document.getElementById('finalPrompt').value = finalPrompt;
    }

    /**
     * 打开设置弹窗
     */
    openSettingsModal() {
        document.getElementById('settingsModal').style.display = 'flex';
    }

    /**
     * 关闭设置弹窗
     */
    closeSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }







    /**
     * 从维度内容构建最终提示词
     */
    buildFinalPromptFromDimensions(dimensionContents) {
        let finalPrompt = '';
        
        // 添加角色扮演
        if (dimensionContents.persona) {
            finalPrompt += `${dimensionContents.persona}\n\n`;
        }
        
        // 添加背景信息
        if (dimensionContents.context) {
            finalPrompt += `背景信息：\n${dimensionContents.context}\n\n`;
        }
        
        // 添加清晰指令
        if (dimensionContents.instruction) {
            finalPrompt += `任务要求：\n${dimensionContents.instruction}\n\n`;
        }
        
        // 添加示例
        if (dimensionContents.examples) {
            finalPrompt += `参考示例：\n${dimensionContents.examples}\n\n`;
        }
        
        // 添加受众定义
        if (dimensionContents.audience) {
            finalPrompt += `目标受众：\n${dimensionContents.audience}\n\n`;
        }
        
        // 添加输出要求
        if (dimensionContents.output) {
            finalPrompt += `输出要求：\n${dimensionContents.output}\n\n`;
        }
        
        // 添加风格要求
        if (dimensionContents.style) {
            finalPrompt += `风格要求：\n${dimensionContents.style}\n\n`;
        }
        
        // 添加约束条件
        if (dimensionContents.constraints) {
            finalPrompt += `约束条件：\n${dimensionContents.constraints}\n\n`;
        }
        
        // 添加分步思考
        if (dimensionContents.stepbystep) {
            finalPrompt += `${dimensionContents.stepbystep}\n\n`;
        }
        
        // 添加反思要求
        if (dimensionContents.reflection) {
            finalPrompt += `${dimensionContents.reflection}\n\n`;
        }
        
        return finalPrompt.trim();
    }

    /**
     * 测试最终提示词
     */
    async testFinalPrompt() {
        const finalPrompt = document.getElementById('finalPrompt').value.trim();
        
        if (!finalPrompt) {
            alert('请先生成最终提示词！');
            return;
        }

        if (!this.apiKey) {
            this.showApiStatus('请先设置API Key！', 'error');
            this.openSettingsModal();
            return;
        }

        const testBtn = document.getElementById('testFinalPrompt');
        const originalText = testBtn.textContent;
        testBtn.textContent = '🔄 测试中...';
        testBtn.disabled = true;

        try {
            const result = await this.callDeepSeekAPI(finalPrompt, 1000);
            
            // 显示测试结果区域和结果内容
            const testResultSection = document.getElementById('testResultSection');
            const testResult = document.getElementById('testResult');
            
            testResultSection.style.display = 'block';
            testResult.value = result;
            testResult.style.display = 'block';
            
            // 滚动到测试结果
            testResult.scrollIntoView({ behavior: 'smooth' });
            
            this.showApiStatus('提示词测试完成！', 'success');
        } catch (error) {
             console.error('测试提示词失败:', error);
             this.showApiStatus(`测试失败: ${error.message}`, 'error');
             
             // 如果是API相关错误，打开设置弹窗
             if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
                 this.openSettingsModal();
             }
         } finally {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
        }
    }

    /**
     * 生成最终提示词
     */
    async generateFinalPrompt() {
        const userInput = document.getElementById('userInput').value.trim();
        
        if (!userInput) {
            alert('请先输入一个问题！');
            return;
        }

        // 收集所有维度的内容
        const dimensionContents = {};
        let hasContent = false;
        
        Object.keys(this.dimensions).forEach(dimension => {
            const textarea = document.querySelector(`textarea[data-dimension="${dimension}"]`);
            if (textarea && textarea.value.trim()) {
                dimensionContents[dimension] = textarea.value.trim();
                hasContent = true;
            }
        });

        if (!hasContent) {
            alert('请先生成各维度的提示词！');
            return;
        }

        // 构建最终提示词
        const finalPrompt = this.buildFinalPromptFromDimensions(dimensionContents);
        
        // 显示最终提示词
        document.getElementById('finalPrompt').value = finalPrompt;
        
        // 滚动到最终提示词区域
        document.querySelector('.final-prompt-section').scrollIntoView({ 
            behavior: 'smooth' 
        });
        
        this.showApiStatus('最终提示词生成完成！', 'success');
    }

    /**
     * 复制最终提示词
     */
    async copyFinalPrompt() {
        const finalPrompt = document.getElementById('finalPrompt').value;
        
        if (!finalPrompt.trim()) {
            alert('请先生成最终提示词！');
            return;
        }

        try {
            await navigator.clipboard.writeText(finalPrompt);
            this.showApiStatus('提示词已复制到剪贴板！', 'success');
            
            // 添加复制成功的视觉反馈
            const copyBtn = document.getElementById('copyFinalPrompt');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ 已复制';
            copyBtn.style.background = '#48bb78';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        } catch (error) {
            console.error('复制失败:', error);
            // 降级方案：选中文本
            const textarea = document.getElementById('finalPrompt');
            textarea.select();
            textarea.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                this.showApiStatus('提示词已复制到剪贴板！', 'success');
            } catch (fallbackError) {
                this.showApiStatus('复制失败，请手动选择复制', 'error');
            }
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new CPAIHelper();
    console.log('🎉 CP AI Prompt助手已启动！');
});

// 添加一些实用的工具函数

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 格式化文本
 */
function formatText(text) {
    return text
        .trim()
        .replace(/\n{3,}/g, '\n\n') // 移除多余的空行
        .replace(/[ \t]+/g, ' '); // 移除多余的空格
}

/**
 * 验证API Key格式
 */
function validateApiKey(apiKey) {
    // DeepSeek API Key通常以sk-开头
    return apiKey && typeof apiKey === 'string' && apiKey.length > 10;
}

// 导出给全局使用
window.CPAIHelper = CPAIHelper;
window.debounce = debounce;
window.throttle = throttle;
window.formatText = formatText;
window.validateApiKey = validateApiKey;