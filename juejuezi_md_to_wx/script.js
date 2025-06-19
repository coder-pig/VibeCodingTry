/**
 * 掘掘子Markdown微信公众号排版工具
 * 主要功能：实时预览、主题切换、复制HTML代码、模板插入等
 */

class MarkdownConverter {
    constructor() {
        this.initElements();
        this.initMarked();
        this.bindEvents();
        this.loadFromStorage();
        this.updatePreview();
    }

    /**
     * 初始化DOM元素引用
     */
    initElements() {
        this.markdownInput = document.getElementById('markdownInput');
        this.preview = document.getElementById('preview');
        this.themeSelect = document.getElementById('themeSelect');
        this.copyBtn = document.getElementById('copyBtn');
        this.copyDropdownBtn = document.getElementById('copyDropdownBtn');
        this.copyDropdownMenu = document.getElementById('copyDropdownMenu');
        this.copyOptions = document.querySelectorAll('.copy-option');
        this.clearBtn = document.getElementById('clearBtn');
        this.insertTemplate = document.getElementById('insertTemplate');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenModal = document.getElementById('fullscreenModal');
        this.fullscreenPreview = document.getElementById('fullscreenPreview');
        this.closeModal = document.getElementById('closeModal');
        this.copyToast = document.getElementById('copyToast');
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
        
        // 当前选择的复制格式，默认为公众号格式
        this.currentCopyFormat = 'wechat';
    }

    /**
     * 初始化Marked配置
     */
    initMarked() {
        // 配置marked选项
        marked.setOptions({
            highlight: function(code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(code, { language: lang }).value;
                    } catch (err) {
                        console.error('代码高亮错误:', err);
                    }
                }
                return hljs.highlightAuto(code).value;
            },
            langPrefix: 'hljs language-',
            breaks: true,
            gfm: true
        });

        // 自定义渲染器
        const renderer = new marked.Renderer();
        
        // 自定义链接渲染，添加微信公众号友好的样式
        renderer.link = (href, title, text) => {
            const titleAttr = title ? ` title="${title}"` : '';
            const theme = this.themeSelect ? this.themeSelect.value : 'wechat';
            
            // 在AI主题下使用url.html的样式
            if (theme === 'ai') {
                return `<br><ul class="list-paddingleft-1">
    <li style="box-sizing: border-box;">
        <p style="text-align: left;box-sizing: border-box;"><span
                style="font-size: 12px;color: rgb(51, 105, 232);box-sizing: border-box;font-weight: bold;">${text}<br
                    style="box-sizing: border-box;"></span><span
                style="font-size: 12px;color: rgba(74, 71, 71, 0.59);box-sizing: border-box;">${href}</span>
        </p>
    </li>
</ul><br>`;
            }
            
            // 默认样式
            return `<a href="${href}"${titleAttr} target="_blank" rel="noopener">${text}</a>`;
        };

        // 自定义图片渲染（支持防盗链处理）
        renderer.image = function(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : '';
            const altAttr = text ? ` alt="${text}"` : '';
            
            // 处理防盗链问题的图片代理
            let proxiedHref = href;
            
            // 检测是否需要代理（常见的防盗链域名）
            const needsProxy = /\.(yuque\.com|notion\.so|feishu\.cn|dingtalk\.com|aliyun\.com|qpic\.cn)/i.test(href);
            
            if (needsProxy) {
                // 使用多个代理服务，提高成功率
                const proxyServices = [
                    'https://images.weserv.nl/?url=',
                    'https://pic1.xuehuaimg.com/proxy/',
                    'https://cors-anywhere.azm.workers.dev/'
                ];
                
                // 随机选择一个代理服务
                const randomProxy = proxyServices[Math.floor(Math.random() * proxyServices.length)];
                proxiedHref = randomProxy + encodeURIComponent(href);
            }
            
            return `<section style="margin: 12px 0px; text-align: center; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;"><img src="${proxiedHref}" data-original="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0px;" data-retry-count="0" /></section>`;
        };

        // 自定义表格渲染
        renderer.table = function(header, body) {
            return `<table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
<thead style="background: #f8f9fa;">
${header}</thead>
<tbody>
${body}</tbody>
</table>`;
        };

        renderer.tablerow = function(content) {
            return `<tr style="border-bottom: 1px solid #e1e8ed;">
${content}</tr>
`;
        };

        renderer.tablecell = function(content, flags) {
            const type = flags.header ? 'th' : 'td';
            const style = flags.header 
                ? 'padding: 12px; text-align: left; font-weight: 600; color: #2c3e50;'
                : 'padding: 12px; text-align: left;';
            return `<${type} style="${style}">${content}</${type}>
`;
        };

        marked.use({ renderer });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入框实时更新
        this.markdownInput.addEventListener('input', () => {
            this.updatePreview();
            this.updateWordCount();
            this.saveToStorage();
        });

        // 主题切换
        this.themeSelect.addEventListener('change', () => {
            this.changeTheme();
            this.saveToStorage();
        });

        // 复制按钮（默认公众号格式）
        this.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // 下拉按钮点击
        this.copyDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdownMenu();
        });

        // 复制格式选项点击
        this.copyOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation(); // 阻止事件冒泡
                const format = option.getAttribute('data-format');
                this.selectCopyFormat(format);
                this.hideDropdownMenu();
            });
        });

        // 阻止下拉菜单本身的点击事件冒泡
        this.copyDropdownMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', () => {
            this.hideDropdownMenu();
        });

        // 清空内容
        this.clearBtn.addEventListener('click', () => {
            this.clearContent();
        });

        // 插入模板
        this.insertTemplate.addEventListener('click', () => {
            this.insertSampleTemplate();
        });

        // 图片加载错误处理
        this.preview.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);

        // 全屏预览
        this.fullscreenBtn.addEventListener('click', () => {
            this.openFullscreen();
        });

        // 关闭模态框
        this.closeModal.addEventListener('click', () => {
            this.closeFullscreen();
        });

        // 点击模态框背景关闭
        this.fullscreenModal.addEventListener('click', (e) => {
            if (e.target === this.fullscreenModal) {
                this.closeFullscreen();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveToStorage();
                        this.showToast('💾 内容已保存到本地存储');
                        break;
                    case 'k':
                        e.preventDefault();
                        this.clearContent();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.copyToClipboard();
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.closeFullscreen();
            }
        });

        // Tab键支持
        this.markdownInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.markdownInput.selectionStart;
                const end = this.markdownInput.selectionEnd;
                const value = this.markdownInput.value;
                
                this.markdownInput.value = value.substring(0, start) + '    ' + value.substring(end);
                this.markdownInput.selectionStart = this.markdownInput.selectionEnd = start + 4;
                
                this.updatePreview();
            }
        });
    }

    /**
     * 预处理markdown文本，修复加粗语法问题
     */
    preprocessMarkdown(text) {
        // 修复末尾有空格的加粗语法问题，如：**UI设计稿 ** -> **UI设计稿**
        let processedText = text.replace(/\*\*([^*]+?)\s+\*\*/g, '**$1**')
                               .replace(/\*([^*]+?)\s+\*/g, '*$1*');
        
        // 修复加粗语法中间有多余空格的问题，如：** 文本 ** -> **文本**
        processedText = processedText.replace(/\*\*\s+([^*]+?)\s+\*\*/g, '**$1**')
                                   .replace(/\*\s+([^*]+?)\s+\*/g, '*$1*');
        
        // 修复加粗语法开头有空格的问题，如：** 文本** -> **文本**
        processedText = processedText.replace(/\*\*\s+([^*]+?)\*\*/g, '**$1**')
                                   .replace(/\*\s+([^*]+?)\*/g, '*$1*');
        
        return processedText;
    }

    /**
     * 更新预览内容
     */
    updatePreview() {
        try {
            let markdownText = this.markdownInput.value;
            // 预处理markdown文本
            markdownText = this.preprocessMarkdown(markdownText);
            const html = marked.parse(markdownText);
            const cleanHtml = DOMPurify.sanitize(html);
            
            // 检查当前主题
            const currentTheme = this.themeSelect.value;
            
            // 如果是AI主题，添加背景图片
            if (currentTheme === 'ai') {
                // 添加背景图片的section元素
                const backgroundSection = `<section style="background-image: url('https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506101715264.webp'); visibility: visible; margin-bottom: 0px;" data-mpa-powered-by="yiban.io" data-lazy-bgimg="https://mmbiz.qpic.cn/mmbiz_jpg/GoRPyTxk6kAXABbdl7gBH9c3sdicvLYf89k5Za31LIYaxBcialiaDTnJOibpGaWJ5PuCYQbv5M5FMiaMrzhUxAfuvzw/640?wx_fmt=jpeg" class="" data-fail="0">
${cleanHtml}
</section>`;
                this.preview.innerHTML = backgroundSection;
            } else {
                this.preview.innerHTML = cleanHtml;
            }
            
            // 代码高亮
            this.preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // 处理代码块，添加Mac风格
            this.applyMacStyleToCodeBlocks();
        } catch (error) {
            console.error('Markdown解析错误:', error);
            this.preview.innerHTML = '<p style="color: #e74c3c;">⚠️ Markdown解析出错，请检查语法</p>';
        }
    }

    /**
     * 应用Mac风格到代码块
     */
    applyMacStyleToCodeBlocks() {
        // 查找所有代码块
        const codeBlocks = this.preview.querySelectorAll('pre');
        
        codeBlocks.forEach(pre => {
            const codeElement = pre.querySelector('code');
            if (!codeElement) return;
            
            // 如果已经是Mac风格代码块的子元素，则跳过
            if (pre.parentNode.classList.contains('mac-style-code-block')) return;
            
            // 获取代码内容和语言
            const codeText = codeElement.textContent;
            let language = 'html';
            if (codeElement.className) {
                const langMatch = codeElement.className.match(/language-(\w+)/);
                if (langMatch) language = langMatch[1];
            }
            
            // 创建Mac风格代码块
            const macStyleBlock = document.createElement('div');
            macStyleBlock.className = 'mac-style-code-block';
            macStyleBlock.innerHTML = `
                <div class="mac-window">
                    <div class="mac-window-header">
                        <div class="mac-btn mac-close"></div>
                        <div class="mac-btn mac-minimize"></div>
                        <div class="mac-btn mac-maximize"></div>
                    </div>
                    <pre class="hljs">
                        <code class="language-${language}">${codeElement.innerHTML}</code>
                    </pre>
                </div>
            `;
            
            // 替换原来的pre元素
            pre.parentNode.replaceChild(macStyleBlock, pre);
        });
    }
    
    /**
     * 切换主题
     */
    changeTheme() {
        const theme = this.themeSelect.value;
        
        // 移除所有主题类
        this.preview.className = 'preview-content';
        this.fullscreenPreview.className = 'fullscreen-preview';
        
        // 添加新主题类
        this.preview.classList.add(`${theme}-theme`);
        this.fullscreenPreview.classList.add(`${theme}-theme`);
        
        // 更新全屏预览内容
        this.fullscreenPreview.innerHTML = this.preview.innerHTML;
    }

    /**
     * 切换主题
     */
    switchTheme(theme) {
        // 移除所有主题类
        const themeClasses = [
            'wechat-theme',
            'ai-theme',
            'reading-notes-theme'
        ];
        
        themeClasses.forEach(cls => {
            this.preview.classList.remove(cls);
        });
        
        // 添加新主题类
        this.preview.classList.add(`${theme}-theme`);
        
        // 保存主题设置
        localStorage.setItem('selectedTheme', theme);
        
        // 更新预览
        this.updatePreview();
    }

    /**
     * 获取当前主题的内联样式
     */
    getInlineStyles() {
        const theme = this.themeSelect.value;
        const styles = {
            wechat: {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif; line-height: 1.8; color: #333; font-size: 16px; word-wrap: break-word;',
                h1: 'font-size: 24px; font-weight: 700; color: #2c3e50; margin: 20px 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #3498db; text-align: center;',
                h2: 'font-size: 20px; font-weight: 600; color: #2c3e50; margin: 18px 0 12px 0; padding-left: 15px; border-left: 5px solid #3498db;',
                h3: 'font-size: 18px; font-weight: 600; color: #34495e; margin: 16px 0 10px 0;',
                p: 'margin: 12px 0; text-align: justify;',
                strong: 'color: #e74c3c; font-weight: bold; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                em: 'color: #8e44ad; font-style: italic; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                blockquote: 'margin: 15px 0; padding: 15px 20px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 0 8px 8px 0; color: #555;',
                code: 'background: #f1f2f6; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 0.9em;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5;',
                a: 'color: #3498db; text-decoration: none; border-bottom: 1px solid #3498db;',
                ul: 'margin: 12px 0; padding-left: 25px;',
                ol: 'margin: 12px 0; padding-left: 25px;',
                li: 'margin: 5px 0;'
            },
            ai: {
                base: 'font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif; line-height: 1.75; color: #333; letter-spacing: 1.5px; padding: 0 1.0em; text-align: justify; background-color: #ffffff;',
                h1: 'font-size: 20px; font-weight: bold; color: #2c3e50; margin: 22px 0 18px 0; padding-bottom: 12px; border-bottom: 2px solid #5a78ea; letter-spacing: 1.5px; line-height: 1.75; text-align: center;',
                h2: 'position: relative; font-size: 20px; font-weight: bold; color: #5a78ea; margin: 20px 0 15px 0; padding: 10px 0; letter-spacing: 1.5px; line-height: 1.75; text-align: center;',
                h3: 'font-size: 16px; font-weight: bold; color: #5a78ea; margin: 16px 0 10px 0; letter-spacing: 1.5px; line-height: 1.75; text-align: center; position: relative;',
                p: 'margin: 12px 0; text-align: justify; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                strong: 'color: #e74c3c; font-weight: bold; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                em: 'color: #8e44ad; font-style: italic; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                blockquote: 'margin: 15px 0; padding: 15px 20px; background: #f8f9fa; border-left: 4px solid #5a78ea; border-radius: 0 8px 8px 0; color: #555; font-size: 15px; line-height: 1.5; letter-spacing: 0.5px;',
                code: 'background: #f1f2f6; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; font-size: 15px; letter-spacing: 0.5px;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; line-height: 1.5; position: relative;',
                a: 'color: #5a78ea; text-decoration: none; border-bottom: 1px solid #5a78ea; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease;',
                ul: 'margin: 12px 0; padding-left: 25px; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                ol: 'margin: 12px 0; padding-left: 25px; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                li: 'margin: 5px 0; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;'
            },
            'reading-notes': {
                base: 'font-family: -apple-system-font, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif; line-height: 1.75; color: #333; letter-spacing: 1.5px; padding: 0 1.0em; text-align: justify; background-color: #ffffff; background-image: radial-gradient(circle at 1px 1px, rgba(255, 107, 53, 0.15) 1px, transparent 0); background-size: 20px 20px; background-position: 0 0;',
                h1: 'font-size: 20px; font-weight: bold; color: #2c3e50; margin: 22px 0 18px 0; padding-bottom: 12px; border-bottom: 2px solid #ff6b35; letter-spacing: 1.5px; line-height: 1.75; text-align: center;',
                h2: 'position: relative; font-size: 20px; font-weight: bold; color: #ff6b35; margin: 20px 0 15px 0; padding: 10px 0; letter-spacing: 1.5px; line-height: 1.75; text-align: center;',
                h3: 'font-size: 16px; font-weight: bold; color: #ff6b35; margin: 16px 0 10px 0; letter-spacing: 1.5px; line-height: 1.75; text-align: center; position: relative;',
                p: 'margin: 12px 0; text-align: justify; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                strong: 'color: #5a78ea; font-weight: bold; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                em: 'color: #ff6b35; font-style: italic; letter-spacing: 1.5px; line-height: 1.75; display: inline;',
                blockquote: 'margin: 15px 0; padding: 15px 20px; background: #fff7ed; border-left: 4px solid #ff6b35; border-radius: 0 8px 8px 0; color: #555; font-size: 15px; line-height: 1.5; letter-spacing: 0.5px;',
                code: 'background: #fef3c7; color: #ff6b35; padding: 2px 6px; border-radius: 4px; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; font-size: 15px; letter-spacing: 0.5px;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: \'Monaco\', \'Menlo\', \'Ubuntu Mono\', monospace; line-height: 1.5; position: relative;',
                a: 'color: #ff6b35; text-decoration: none; border-bottom: 1px solid #ff6b35; font-size: 15px; letter-spacing: 0.5px; transition: all 0.3s ease;',
                ul: 'margin: 12px 0; padding-left: 25px; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                ol: 'margin: 12px 0; padding-left: 25px; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;',
                li: 'margin: 5px 0; font-size: 15px; line-height: 1.75; letter-spacing: 1.5px;'
            },
        };
        return styles[theme] || styles.wechat;
    }

    /**
     * 将HTML内容转换为带内联样式的HTML
     */
    convertToInlineStyles(htmlContent) {
        const currentTheme = this.themeSelect.value;
        
        // 根据主题添加不同的开头内容
        let headerContent = '';
        
        if (currentTheme === 'reading-notes') {
            // 读书笔记主题使用图片开头
            headerContent = '<section style="visibility: visible; text-align: center; margin-bottom: 20px;"><img src="https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506111700614.jpeg" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" /></section>';
        } else {
            // 其他主题使用原来的headerSection
            headerContent = '<section style="visibility: visible;"><br><section style="white-space: normal; max-width: 100%; min-height: 1em; color: rgb(51, 51, 51); text-align: center; visibility: visible;"><span style="max-width: 100%; white-space: pre-wrap; font-size: 14px; color: rgb(255, 41, 65); line-height: 22.4px; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible;">（给</span><span style="max-width: 100%; white-space: pre-wrap; font-size: 14px; line-height: 22.4px; color: rgb(0, 128, 255); box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible;">抠腚男孩👦</span><span style="max-width: 100%; white-space: pre-wrap; font-size: 14px; color: rgb(255, 41, 65); line-height: 22.4px; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible;">加星标，提升</span><span style="max-width: 100%; white-space: pre-wrap; font-size: 14px; line-height: 22.4px; color: rgb(0, 100, 255); box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible;"><strong style="visibility: visible;">🤖AI</strong></span><span style="max-width: 100%; white-space: pre-wrap; color: rgb(255, 41, 65); font-size: 14px; line-height: 22.4px; box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible;">技能）</span></section></section>';
        }
        
        const tempDiv = document.createElement('div');
        // 将开头内容添加到内容开头
        tempDiv.innerHTML = headerContent + htmlContent;
        const styles = this.getInlineStyles();

        // 如果是AI主题，需要添加背景图片
        if (currentTheme === 'ai' || currentTheme == "reading-notes") {
            // 创建背景section元素
            const backgroundSection = document.createElement('section');
            backgroundSection.style.cssText = "background-image: url('https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506101715264.webp'); visibility: visible; margin-bottom: 0px;";
            backgroundSection.setAttribute('data-mpa-powered-by', 'yiban.io');
            backgroundSection.setAttribute('data-lazy-bgimg', 'https://mmbiz.qpic.cn/mmbiz_jpg/GoRPyTxk6kAXABbdl7gBH9c3sdicvLYf89k5Za31LIYaxBcialiaDTnJOibpGaWJ5PuCYQbv5M5FMiaMrzhUxAfuvzw/640?wx_fmt=jpeg');
            backgroundSection.setAttribute('data-fail', '0');
            
            // 将原内容移动到背景section中
            while (tempDiv.firstChild) {
                backgroundSection.appendChild(tempDiv.firstChild);
            }
            
            // 将背景section添加到tempDiv
            tempDiv.appendChild(backgroundSection);
        }

        // 应用基础样式到容器
        tempDiv.style.cssText = styles.base;

        // 为各种元素添加内联样式
        const elements = {
            'h1': styles.h1,
            'h2': styles.h2,
            'h3': styles.h3,
            'p': styles.p,
            'strong': styles.strong,
            'em': styles.em,
            'blockquote': styles.blockquote,
            'code': styles.code,
            'pre': styles.pre,
            'a': styles.a,
            'ul': styles.ul,
            'ol': styles.ol,
            'li': styles.li
        };

        // 特殊处理：将列表项中的strong元素和后续内容合并到同一个section中
        const listItems = tempDiv.querySelectorAll('li');
        listItems.forEach(li => {
            const strongElement = li.querySelector('strong');
            if (strongElement) {
                // 创建一个新的section来包装所有内容
                const wrapperSection = document.createElement('section');
                
                // 将li的所有子节点移动到新的section中
                while (li.firstChild) {
                    wrapperSection.appendChild(li.firstChild);
                }
                
                // 将新的section添加回li中
                li.appendChild(wrapperSection);
            }
        });

        Object.keys(elements).forEach(tag => {
            const tagElements = tempDiv.querySelectorAll(tag);
            tagElements.forEach(element => {
                if (elements[tag]) {
                    element.style.cssText = elements[tag];
                }
                // 特殊处理strong元素：在前后添加空格
                if (tag === 'strong') {
                    // 检查前面是否已经有空格或者是段落开头
                    const prevSibling = element.previousSibling;
                    if (prevSibling && prevSibling.nodeType === Node.TEXT_NODE) {
                        const prevText = prevSibling.textContent;
                        if (prevText && !prevText.endsWith(' ') && !prevText.endsWith('\n')) {
                            prevSibling.textContent = prevText + ' ';
                        }
                    } else if (prevSibling && prevSibling.nodeType === Node.ELEMENT_NODE) {
                        // 如果前面是元素节点，在strong前插入空格文本节点
                        const spaceNode = document.createTextNode(' ');
                        element.parentNode.insertBefore(spaceNode, element);
                    }
                    
                    // 检查后面是否已经有空格或者是段落结尾
                    const nextSibling = element.nextSibling;
                    if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
                        const nextText = nextSibling.textContent;
                        if (nextText && !nextText.startsWith(' ') && !nextText.startsWith('\n')) {
                            nextSibling.textContent = ' ' + nextText;
                        }
                    } else if (nextSibling && nextSibling.nodeType === Node.ELEMENT_NODE) {
                        // 如果后面是元素节点，在strong后插入空格文本节点
                        const spaceNode = document.createTextNode(' ');
                        element.parentNode.insertBefore(spaceNode, nextSibling);
                    } else if (!nextSibling) {
                        // 如果是段落末尾，也添加空格
                        const spaceNode = document.createTextNode(' ');
                        element.parentNode.appendChild(spaceNode);
                    }
                }
                // 特殊处理strong和em元素内部的所有子元素，确保它们都是内联显示
                if (tag === 'strong' || tag === 'em') {
                    const allChildren = element.querySelectorAll('*');
                    allChildren.forEach(child => {
                        const currentStyle = child.style.cssText;
                        child.style.cssText = currentStyle + '; display: inline !important;';
                    });
                }
                // 特殊处理pre中的code
                if (tag === 'pre') {
                    const codeInPre = element.querySelector('code');
                    if (codeInPre) {
                        codeInPre.style.cssText = 'background: transparent; color: inherit; padding: 0; border-radius: 0;';
                    }
                    
                    // 微信主题和MAC风格主题特殊处理：使用SVG绘制红黄绿圆点（微信兼容版本）
                    if (this.themeSelect.value === 'wechat' || this.themeSelect.value === 'ai' || this.themeSelect.value === 'reading-notes') {
                        // 重新构建整个pre结构，使用用户提供的样式
                        const codeContent = element.querySelector('code');
                        const codeText = codeContent ? codeContent.textContent : element.textContent;
                        
                        // 获取代码语言类型
                        let language = 'html';
                        if (codeContent && codeContent.className) {
                            const langMatch = codeContent.className.match(/language-([\w-]+)/);
                            if (langMatch) {
                                language = langMatch[1];
                            }
                        }
                        
                        // 创建新的结构 - 修复代码渲染样式
                        const newStructure = `
                            <section style="box-sizing: border-box; border-width: 0px; border-style: solid; border-color: rgb(229, 229, 229); color: rgb(10, 10, 10); font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-indent: 0px; text-transform: none; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; white-space: normal; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial; text-align: left; line-height: 1.75; font-family: -apple-system-font, BlinkMacSystemFont, &quot;Helvetica Neue&quot;, &quot;PingFang SC&quot;, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, Arial, sans-serif; font-size: 16px;">
                                <pre class="hljs code__pre" style="box-sizing: border-box; border-width: 0px; border-style: solid; border-color: rgb(229, 229, 229); font-family: -apple-system-font, BlinkMacSystemFont, &quot;Helvetica Neue&quot;, &quot;PingFang SC&quot;, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, Arial, sans-serif; font-feature-settings: normal; font-variation-settings: normal; font-size: 14.4px; margin: 0px 8px 10px; color: rgb(173, 186, 199); background: rgb(34, 39, 46); text-align: left; line-height: 1.5; overflow-x: auto; border-radius: 8px; padding: 0px !important;">
                                    <span class="mac-sign" style="box-sizing: border-box; border-width: 0px; border-style: solid; border-color: rgb(229, 229, 229); display: flex; padding: 10px 14px 0px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" x="0px" y="0px" width="45px" height="13px" viewBox="0 0 450 130">
                                            <ellipse cx="50" cy="65" rx="50" ry="52" stroke="rgb(220,60,54)" stroke-width="2" fill="rgb(237,108,96)"></ellipse>
                                            <ellipse cx="225" cy="65" rx="50" ry="52" stroke="rgb(218,151,33)" stroke-width="2" fill="rgb(247,193,81)"></ellipse>
                                            <ellipse cx="400" cy="65" rx="50" ry="52" stroke="rgb(27,161,37)" stroke-width="2" fill="rgb(100,200,86)"></ellipse>
                                        </svg>
                                    </span>
                                    <code class="language-${language || 'html'}" style="box-sizing: border-box; border-width: 0px; border-style: solid; border-color: rgb(229, 229, 229); font-family: Menlo, &quot;Operator Mono&quot;, Consolas, Monaco, monospace; font-feature-settings: normal; font-variation-settings: normal; font-size: 12.96px; display: -webkit-box; padding: 0.5em 1em 1em; overflow-x: auto; text-indent: 0px; text-align: left; line-height: 1.75; margin: 0px; white-space: nowrap;">${codeText}</code>
                                </pre>
                            </section>
                        `;
                        
                        // 替换原有的pre元素
                        element.outerHTML = newStructure;
                    }
                }
                
                // 特殊处理AI主题的h2和h3元素，添加伪元素
                if (this.themeSelect.value === 'ai') {
                    // 处理h2元素，添加图标
                    if (tag === 'h2') {
                        // 创建图标元素
                        const iconImg = document.createElement('img');
                        iconImg.src = 'https://raw.githubusercontent.com/coder-pig/vault_pic/master/202506101514132.png';
                        iconImg.style.cssText = 'display: inline-block; vertical-align: middle; width: 29px; height: 29px; margin-right: 5px;';
                        
                        // 将图标插入到h2元素的最前面
                        element.insertBefore(iconImg, element.firstChild);
                    }
                    
                    // 处理h3元素，添加前后的双斜杠
                    if (tag === 'h3') {
                        // 在文本前后添加双斜杠
                        element.innerHTML = '// ' + element.innerHTML + ' //';
                    }
                }
                
                // 特殊处理读书笔记主题的h2和h3元素，添加emoji
                if (this.themeSelect.value === 'reading-notes') {
                    // 处理h2元素，添加书本emoji
                    if (tag === 'h2') {
                        // 在文本前添加书本emoji
                        element.innerHTML = '📖 ' + element.innerHTML;
                    }
                    
                    // 处理h3元素，添加前后的笔记emoji
                    if (tag === 'h3') {
                        // 在文本前后添加笔记emoji
                        element.innerHTML = '📝 ' + element.innerHTML + ' 📝';
                    }
                }
            });
        });

        // 在生成样式代码的最后添加EOF标记
        const eofSection = '<p style="white-space: normal;font-variant-ligatures: normal;orphans: 2;widows: 2;text-align: center;"><span style="font-size: 15px;color: rgb(136, 136, 136);">- EOF -</span></p>';
        
        return tempDiv.outerHTML + eofSection;
    }

    /**
     * 格式化HTML代码，添加适当的缩进和换行
     */
    formatHtml(html) {
        // 移除多余的空白字符
        html = html.replace(/\s+/g, ' ').trim();
        
        let formatted = '';
        let indent = 0;
        const indentSize = 2; // 使用2个空格作为缩进
        
        // 自闭合标签列表
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        
        // 内联元素列表（不需要换行的元素）
        const inlineTags = ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'code', 'small', 'sub', 'sup'];
        
        // 分割HTML为标签和文本
        const tokens = html.match(/<\/?[^>]+>|[^<]+/g) || [];
        
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i].trim();
            if (!token) continue;
            
            if (token.startsWith('<')) {
                // 处理标签
                const isClosingTag = token.startsWith('</');
                const isOpeningTag = !isClosingTag && !token.endsWith('/>');
                const tagName = token.match(/<\/?([a-zA-Z0-9]+)/)?.[1]?.toLowerCase();
                const isSelfClosing = selfClosingTags.includes(tagName) || token.endsWith('/>');
                const isInline = inlineTags.includes(tagName);
                
                if (isClosingTag) {
                    indent--;
                    if (!isInline) {
                        formatted += '\n' + ' '.repeat(indent * indentSize);
                    }
                    formatted += token;
                } else {
                    if (!isInline && formatted && !formatted.endsWith('\n')) {
                        formatted += '\n' + ' '.repeat(indent * indentSize);
                    } else if (!isInline && formatted) {
                        formatted += ' '.repeat(indent * indentSize);
                    }
                    formatted += token;
                    
                    if (isOpeningTag && !isSelfClosing) {
                        indent++;
                    }
                }
            } else {
                // 处理文本内容
                const trimmedText = token.trim();
                if (trimmedText) {
                    formatted += trimmedText;
                }
            }
        }
        
        return formatted;
    }

    /**
     * 复制内容到剪贴板（支持三种格式）
     */
    async copyToClipboard() {
        try {
            const previewElement = this.preview;
            const copyFormat = this.currentCopyFormat;
            
            if (!previewElement.innerHTML.trim() && copyFormat !== 'markdown') {
                this.showToast('⚠️ 没有内容可复制');
                return;
            }

            let contentToCopy = '';
            let successMessage = '';
            
            switch (copyFormat) {
                case 'wechat':
                    // 公众号格式：富文本，直接复制渲染后的HTML内容
                    await this.copyWechatFormat();
                    return;
                    
                case 'html':
                    // HTML格式：带内联样式的HTML代码
                    const htmlWithInlineStyles = this.convertToInlineStyles(previewElement.innerHTML);
                    contentToCopy = this.formatHtml(htmlWithInlineStyles);
                    successMessage = '📋 HTML代码已复制到剪贴板！';
                    break;
                    
                case 'markdown':
                    // MD格式：原始Markdown文本
                    contentToCopy = this.markdownInput.value;
                    successMessage = '📋 Markdown文本已复制到剪贴板！';
                    break;
                    
                default:
                    this.showToast('❌ 未知的复制格式');
                    return;
            }
            
            // 使用现代 Clipboard API 复制文本
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(contentToCopy);
                this.showToast(successMessage);
            } else {
                // 降级方案：使用传统方法
                const textArea = document.createElement('textarea');
                textArea.value = contentToCopy;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                textArea.setSelectionRange(0, 99999);
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (success) {
                    this.showToast(successMessage);
                } else {
                    this.showToast('❌ 复制失败，请手动选择内容复制');
                }
            }
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('❌ 复制失败，请手动选择内容复制');
        }
    }

    /**
     * 复制公众号格式（富文本）
     */
    async copyWechatFormat() {
        try {
            const previewElement = this.preview;
            
            if (!previewElement.innerHTML.trim()) {
                this.showToast('⚠️ 没有内容可复制');
                return;
            }

            // 创建一个临时容器来处理富文本复制
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = this.convertToInlineStyles(previewElement.innerHTML);
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.opacity = '0';
            document.body.appendChild(tempContainer);
            
            // 选择内容
            const range = document.createRange();
            range.selectNodeContents(tempContainer);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 尝试使用现代 Clipboard API 复制富文本
            if (navigator.clipboard && navigator.clipboard.write) {
                try {
                    const htmlBlob = new Blob([tempContainer.innerHTML], { type: 'text/html' });
                    const textBlob = new Blob([tempContainer.textContent], { type: 'text/plain' });
                    
                    const clipboardItem = new ClipboardItem({
                        'text/html': htmlBlob,
                        'text/plain': textBlob
                    });
                    
                    await navigator.clipboard.write([clipboardItem]);
                    this.showToast('📋 富文本内容已复制！可以直接粘贴到微信公众号编辑器');
                } catch (clipboardError) {
                    // 如果现代API失败，使用传统方法
                    const success = document.execCommand('copy');
                    if (success) {
                        this.showToast('📋 富文本内容已复制！可以直接粘贴到微信公众号编辑器');
                    } else {
                        this.showToast('❌ 复制失败，请手动选择内容复制');
                    }
                }
            } else {
                // 使用传统的 execCommand 方法
                const success = document.execCommand('copy');
                if (success) {
                    this.showToast('📋 富文本内容已复制！可以直接粘贴到微信公众号编辑器');
                } else {
                    this.showToast('❌ 复制失败，请手动选择内容复制');
                }
            }
            
            // 清理
            selection.removeAllRanges();
            document.body.removeChild(tempContainer);
            
        } catch (error) {
            console.error('富文本复制失败:', error);
            this.showToast('❌ 富文本复制失败，请手动选择内容复制');
        }
    }

    /**
     * 切换下拉菜单显示/隐藏
     */
    toggleDropdownMenu() {
        const isVisible = this.copyDropdownMenu.classList.contains('show');
        if (isVisible) {
            this.hideDropdownMenu();
        } else {
            this.showDropdownMenu();
        }
    }

    /**
     * 显示下拉菜单
     */
    showDropdownMenu() {
        // 获取复制按钮组位置
        const buttonGroupRect = this.copyBtn.parentElement.getBoundingClientRect();
        const dropdownMenu = this.copyDropdownMenu;
        
        // 设置下拉菜单位置（相对于视口）
        // 将菜单放在复制按钮组的下方中央
        dropdownMenu.style.top = `${buttonGroupRect.bottom + 4}px`;
        dropdownMenu.style.left = `${buttonGroupRect.left + (buttonGroupRect.width/2) - (dropdownMenu.offsetWidth/2 || 75)}px`;
        
        // 显示下拉菜单
        dropdownMenu.classList.add('show');
        console.log('下拉菜单已显示'); // 调试信息
    }

    /**
     * 隐藏下拉菜单
     */
    hideDropdownMenu() {
        this.copyDropdownMenu.classList.remove('show');
        console.log('下拉菜单已隐藏'); // 调试信息
    }

    /**
     * 选择复制格式
     */
    selectCopyFormat(format) {
        console.log('选择复制格式:', format); // 调试信息
        this.currentCopyFormat = format;
        this.saveToStorage();
        
        // 更新按钮文本
        const formatNames = {
            'wechat': '📱 公众号格式',
            'html': '🌐 HTML格式',
            'markdown': '📝 MD格式'
        };
        
        this.copyBtn.innerHTML = `📋 复制 (${formatNames[format].replace(/^[📱🌐📝] /, '')})`;
        console.log('按钮文本已更新:', this.copyBtn.innerHTML); // 调试信息
        
        // 更新下拉菜单中的选中状态
        this.copyOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-format') === format) {
                option.classList.add('active');
                console.log('设置选中状态:', option.textContent); // 调试信息
            }
        });
    }

    /**
     * 清空所有内容
     */
    clearContent() {
        if (this.markdownInput.value.trim() && !confirm('🗑️ 确定要清空所有内容吗？')) {
            return;
        }
        
        this.markdownInput.value = '';
        this.preview.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px; font-size: 16px; line-height: 1.6;">✨ 在左侧输入Markdown内容，这里会实时显示预览效果</p>';
        
        // 同时清空全屏预览内容
        this.fullscreenPreview.innerHTML = this.preview.innerHTML;
        
        this.updateWordCount();
        this.saveToStorage();
        this.markdownInput.focus();
        
        // 显示清空成功提示
        this.showToast('🗑️ 内容已清空');
    }

    /**
     * 插入示例模板
     */
    insertSampleTemplate() {
        const template = `# 🎉 欢迎使用掘掘子Markdown微信公众号排版工具

> 这是一个功能强大的Markdown编辑器，专为微信公众号内容创作而设计。

## ✨ 主要特性

- **实时预览**：左侧编辑，右侧实时显示效果
- **多种主题**：支持微信公众号、掘金、知乎、GitHub等风格
- **一键复制**：生成的HTML可直接粘贴到微信公众号编辑器
- **语法高亮**：支持多种编程语言的代码高亮

## 📝 Markdown语法示例

### 文本样式

这是**粗体文本**，这是*斜体文本*，这是~~删除线文本~~。

### 列表

#### 无序列表
- 第一项
- 第二项
  - 子项目1
  - 子项目2
- 第三项

#### 有序列表
1. 首先
2. 然后
3. 最后

### 代码示例

行内代码：\`console.log('Hello World!')\`

代码块：
\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet('微信公众号'));
\`\`\`

### 引用

> 这是一个引用块。
> 
> 可以用来突出重要信息或引用他人的话。

### 链接和图片

[访问GitHub](https://github.com)

### 表格

| 功能 | 描述 | 状态 |
|------|------|------|
| 实时预览 | 边写边看效果 | ✅ |
| 主题切换 | 多种样式选择 | ✅ |
| 一键复制 | 快速导出HTML | ✅ |

---

💡 **小贴士**：使用快捷键 \`Ctrl+Enter\` 快速复制，\`Ctrl+K\` 清空内容，\`Ctrl+S\` 保存到本地。

开始你的创作之旅吧！🚀`;

        this.markdownInput.value = template;
        this.updatePreview();
        this.updateWordCount();
        this.saveToStorage();
        this.showToast('📄 模板已插入，开始编辑吧！');
    }

    /**
     * 打开全屏预览
     */
    openFullscreen() {
        this.fullscreenPreview.innerHTML = this.preview.innerHTML;
        this.fullscreenPreview.className = this.preview.className.replace('preview-content', 'fullscreen-preview');
        this.fullscreenModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    /**
     * 处理图片加载错误
     */
    handleImageError(img) {
        const originalSrc = img.getAttribute('data-original') || img.src;
        const currentSrc = img.src;
        
        // 如果已经尝试过所有代理服务，显示错误提示
        if (img.dataset.retryCount >= 3) {
            img.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                padding: 20px;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                margin: 10px 0;
                text-align: center;
                color: #856404;
                font-size: 14px;
            `;
            errorDiv.innerHTML = `
                📷 图片加载失败<br>
                <small style="color: #6c757d;">原链接：${originalSrc}</small><br>
                <button onclick="window.open('${originalSrc}', '_blank')" style="
                    margin-top: 8px;
                    padding: 4px 12px;
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">在新窗口打开</button>
            `;
            img.parentNode.insertBefore(errorDiv, img);
            return;
        }
        
        // 增加重试计数
        img.dataset.retryCount = (parseInt(img.dataset.retryCount) || 0) + 1;
        
        // 尝试不同的代理服务
        const proxyServices = [
            'https://images.weserv.nl/?url=',
            'https://pic1.xuehuaimg.com/proxy/',
            'https://cors-anywhere.azm.workers.dev/',
            'https://api.allorigins.win/raw?url='
        ];
        
        const retryIndex = parseInt(img.dataset.retryCount) - 1;
        if (retryIndex < proxyServices.length) {
            const newProxy = proxyServices[retryIndex];
            img.src = newProxy + encodeURIComponent(originalSrc);
        } else {
            // 最后尝试直接使用原链接（去掉协议）
            img.src = originalSrc.replace(/^https?:\/\//, '//');
        }
    }

    /**
     * 关闭全屏预览
     */
    closeFullscreen() {
        this.fullscreenModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * 更新字数统计
     */
    updateWordCount() {
        const text = this.markdownInput.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        
        this.wordCount.textContent = `字数: ${words}`;
        this.charCount.textContent = `字符: ${chars}`;
    }

    /**
     * 显示提示消息
     */
    showToast(message) {
        this.copyToast.textContent = message;
        this.copyToast.classList.add('show');
        
        setTimeout(() => {
            this.copyToast.classList.remove('show');
        }, 3000);
    }

    /**
     * 保存到本地存储
     */
    saveToStorage() {
        try {
            const data = {
                content: this.markdownInput.value,
                theme: this.themeSelect.value,
                copyFormat: this.currentCopyFormat,
                timestamp: Date.now()
            };
            localStorage.setItem('markdown-converter-data', JSON.stringify(data));
        } catch (error) {
            console.error('保存到本地存储失败:', error);
        }
    }

    /**
     * 从本地存储加载
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('markdown-converter-data');
            if (saved) {
                const data = JSON.parse(saved);
                this.markdownInput.value = data.content || '';
                this.themeSelect.value = data.theme || 'wechat';
                this.selectCopyFormat(data.copyFormat || 'wechat');
                this.changeTheme();
                this.updateWordCount();
            } else {
                // 如果没有保存的数据，设置默认格式
                this.selectCopyFormat('wechat');
            }
            
            // 如果没有内容，显示默认提示
            if (!this.markdownInput.value.trim()) {
                this.preview.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px; font-size: 16px; line-height: 1.6;">✨ 在左侧输入Markdown内容，这里会实时显示预览效果</p>';
            }
        } catch (error) {
            console.error('从本地存储加载失败:', error);
            // 如果加载失败，设置默认格式
            this.selectCopyFormat('wechat');
            this.preview.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px; font-size: 16px; line-height: 1.6;">✨ 在左侧输入Markdown内容，这里会实时显示预览效果</p>';
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownConverter();
    
    // 添加加载动画
    const container = document.querySelector('.container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        container.style.transition = 'all 0.5s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 100);
    
    console.log('🎉 Markdown转微信公众号工具已加载完成！');
});