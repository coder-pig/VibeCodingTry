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
        this.clearBtn = document.getElementById('clearBtn');
        this.insertTemplate = document.getElementById('insertTemplate');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenModal = document.getElementById('fullscreenModal');
        this.fullscreenPreview = document.getElementById('fullscreenPreview');
        this.closeModal = document.getElementById('closeModal');
        this.copyToast = document.getElementById('copyToast');
        this.wordCount = document.getElementById('wordCount');
        this.charCount = document.getElementById('charCount');
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
        renderer.link = function(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : '';
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
            
            return `<img src="${proxiedHref}" data-original="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0;" data-retry-count="0" />`;
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

        // 复制HTML
        this.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
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
     * 更新预览内容
     */
    updatePreview() {
        const markdownText = this.markdownInput.value;
        try {
            const html = marked.parse(markdownText);
            const cleanHtml = DOMPurify.sanitize(html);
            this.preview.innerHTML = cleanHtml;
            
            // 代码高亮
            this.preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        } catch (error) {
            console.error('Markdown解析错误:', error);
            this.preview.innerHTML = '<p style="color: #e74c3c;">⚠️ Markdown解析出错，请检查语法</p>';
        }
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
            'wechat-theme', 'juejin-theme', 'zhihu-theme', 'github-theme',
            'doocs-classic-theme', 'doocs-elegant-theme', 'doocs-simple-theme', 'doocs-modern-theme',
            'mac-style-theme'
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
                strong: 'color: #e74c3c; font-weight: bold;',
                em: 'color: #8e44ad; font-style: italic;',
                blockquote: 'margin: 15px 0; padding: 15px 20px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 0 8px 8px 0; color: #555;',
                code: 'background: #f1f2f6; color: #e74c3c; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 0.9em;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5;',
                a: 'color: #3498db; text-decoration: none; border-bottom: 1px solid #3498db;',
                ul: 'margin: 12px 0; padding-left: 25px;',
                ol: 'margin: 12px 0; padding-left: 25px;',
                li: 'margin: 5px 0;'
            },
            juejin: {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif; line-height: 1.7; color: #2e3135;',
                h1: 'font-size: 28px; font-weight: 700; color: #1e2329; margin: 24px 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #1e80ff;',
                h2: 'font-size: 22px; font-weight: 600; color: #1e2329; margin: 20px 0 12px 0; padding-left: 12px; border-left: 4px solid #1e80ff;',
                strong: 'color: #1e80ff; font-weight: 600;',
                blockquote: 'background: #f7f8fa; border-left: 4px solid #1e80ff; padding: 16px 20px; margin: 16px 0; border-radius: 0 6px 6px 0;',
                code: 'background: #f7f8fa; color: #ff6b6b; padding: 3px 6px; border-radius: 4px; font-size: 0.9em;',
                pre: 'background: #1e1e1e !important; color: #d4d4d4 !important; padding: 20px; border-radius: 6px; margin: 16px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5;'
            },
            zhihu: {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", "Source Han Sans SC", "Noto Sans CJK SC", "WenQuanYi Micro Hei", sans-serif; line-height: 1.6; color: #1a1a1a;',
                h1: 'font-size: 26px; font-weight: 600; color: #1a1a1a; margin: 20px 0 16px 0; padding-bottom: 10px; border-bottom: 2px solid #0084ff;',
                h2: 'font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 18px 0 12px 0; padding-left: 10px; border-left: 4px solid #0084ff;',
                strong: 'color: #0084ff; font-weight: 600;',
                blockquote: 'background: #f6f6f6; border-left: 4px solid #0084ff; padding: 15px 18px; margin: 15px 0; border-radius: 0 4px 4px 0;',
                code: 'background: #f6f6f6; color: #0084ff; padding: 2px 6px; border-radius: 4px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 0.9em;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5;',
                a: 'color: #0084ff; text-decoration: none; border-bottom: 1px solid #0084ff;',
                ul: 'margin: 12px 0; padding-left: 25px;',
                ol: 'margin: 12px 0; padding-left: 25px;',
                li: 'margin: 6px 0;'
            },
            github: {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; color: #24292e;',
                h1: 'font-size: 24px; font-weight: 600; color: #24292e; margin: 20px 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #e1e4e8;',
                h2: 'font-size: 20px; font-weight: 600; color: #24292e; margin: 18px 0 12px 0; padding-bottom: 6px; border-bottom: 1px solid #eaecef;',
                strong: 'color: #d73a49; font-weight: 600;',
                blockquote: 'background: #f6f8fa; border-left: 4px solid #dfe2e5; padding: 15px 20px; margin: 15px 0; color: #6a737d;',
                code: 'background: #f6f8fa; color: #d73a49; padding: 2px 4px; border-radius: 3px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 0.9em;',
                pre: 'background: #f6f8fa !important; color: #24292e !important; padding: 16px; border-radius: 6px; margin: 16px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5;',
                a: 'color: #0366d6; text-decoration: none;',
                ul: 'margin: 12px 0; padding-left: 25px;',
                ol: 'margin: 12px 0; padding-left: 25px;',
                li: 'margin: 6px 0;'
            },
            'doocs-classic': {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; line-height: 1.75; color: #333;',
                h1: 'font-size: 24px; font-weight: bold; color: #2c3e50; margin: 20px 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #3498db; text-align: center;',
                h2: 'font-size: 20px; font-weight: bold; color: white; margin: 18px 0 12px 0; padding: 8px 16px; background: #3498db; border-radius: 6px; text-align: center;',
                h3: 'font-size: 18px; font-weight: bold; color: #3498db; margin: 16px 0 10px 0; padding: 8px 12px; border-left: 4px solid #3498db; background: rgba(52, 152, 219, 0.1); border-radius: 4px;',
                strong: 'color: #3498db; font-weight: bold;',
                em: 'color: #8e44ad; font-style: italic;',
                blockquote: 'margin: 15px 0; padding: 15px 20px 15px 40px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 6px; color: rgba(0,0,0,0.6); font-style: italic;',
                code: 'background: rgba(27,31,35,.05); color: #d14; padding: 3px 5px; border-radius: 4px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 90%;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5; font-size: 14px;',
                a: 'color: #576b95; text-decoration: none;',
                ul: 'margin: 12px 0; padding-left: 24px;',
                ol: 'margin: 12px 0; padding-left: 24px;',
                li: 'margin: 5px 8px; text-indent: -1em; display: block;'
            },
            'doocs-elegant': {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; line-height: 1.8; color: #2c3e50;',
                h1: 'font-size: 26px; font-weight: 600; color: white; margin: 24px auto 16px; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); display: table;',
                h2: 'font-size: 22px; font-weight: 600; color: white; margin: 20px auto 14px; padding: 10px 20px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20px 8px 20px 8px; text-align: center; box-shadow: 0 3px 10px rgba(102, 126, 234, 0.2); display: table;',
                h3: 'font-size: 18px; font-weight: 600; color: #667eea; margin: 18px 0 12px 0; padding: 8px 16px; border-left: 4px solid #667eea; background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), transparent); border-radius: 0 8px 8px 0;',
                strong: 'color: #667eea; font-weight: 600; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); padding: 2px 4px; border-radius: 3px;',
                em: 'color: #764ba2; font-style: italic;',
                blockquote: 'margin: 18px 0; padding: 16px 24px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05)); border-left: 4px solid #667eea; border-radius: 0 12px 12px 0; color: #555; font-style: italic; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);',
                code: 'background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); color: #667eea; padding: 3px 6px; border-radius: 6px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 90%; border: 1px solid rgba(102, 126, 234, 0.2);',
                pre: 'background: linear-gradient(135deg, #2d3748, #4a5568) !important; color: #e2e8f0 !important; padding: 24px; border-radius: 12px; margin: 18px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.6; font-size: 14px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);',
                a: 'color: #667eea; text-decoration: none; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), transparent); padding: 1px 3px; border-radius: 3px;',
                ul: 'margin: 14px 0; padding-left: 28px;',
                ol: 'margin: 14px 0; padding-left: 28px;',
                li: 'margin: 6px 8px; line-height: 1.7;'
            },
            'doocs-simple': {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; line-height: 1.75; color: #333;',
                h1: 'font-size: 24px; font-weight: bold; color: #2c3e50; margin: 20px auto 15px; padding: 8px 16px; border-bottom: 2px solid #3498db; text-align: center; text-shadow: 1px 1px 3px rgba(0,0,0,0.05); display: table;',
                h2: 'font-size: 20px; font-weight: bold; color: white; margin: 32px auto 16px; padding: 6px 20px; background: #3498db; border-radius: 8px 24px 8px 24px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06); display: table;',
                h3: 'font-size: 18px; font-weight: bold; color: #3498db; margin: 16px 0 12px 0; padding: 8px 12px; border-left: 4px solid #3498db; background: rgba(52, 152, 219, 0.08); border-radius: 6px; line-height: 2.4;',
                strong: 'color: #3498db; font-weight: bold;',
                em: 'color: #8e44ad; font-style: italic;',
                blockquote: 'margin: 15px 0; padding: 16px 16px 16px 32px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 6px; color: rgba(0,0,0,0.6); font-style: italic;',
                code: 'background: rgba(27,31,35,.05); color: #d14; padding: 3px 5px; border-radius: 4px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 90%;',
                pre: 'background: #2d3748 !important; color: #e2e8f0 !important; padding: 20px; border-radius: 8px; margin: 15px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.5; font-size: 14px;',
                a: 'color: #576b95; text-decoration: none;',
                ul: 'list-style: none; margin: 12px 0; padding-left: 24px;',
                ol: 'margin: 12px 0; padding-left: 24px;',
                li: 'margin: 5px 8px; text-indent: -1em; display: block;'
            },
            'doocs-modern': {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; line-height: 1.7; color: #1a202c;',
                h1: 'font-size: 28px; font-weight: 700; color: white; margin: 24px 0 18px 0; padding: 16px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; text-align: center; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);',
                h2: 'font-size: 22px; font-weight: 600; color: #2d3748; margin: 20px 0 14px 0; padding: 12px 20px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-left: 4px solid #667eea; border-radius: 0 12px 12px 0;',
                h3: 'font-size: 18px; font-weight: 600; color: #667eea; margin: 18px 0 12px 0; padding: 8px 16px; background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), transparent); border-left: 4px solid #667eea; border-radius: 0 8px 8px 0;',
                strong: 'color: #667eea; font-weight: 600; background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.15)); padding: 2px 6px; border-radius: 4px;',
                em: 'color: #764ba2; font-style: italic;',
                blockquote: 'margin: 18px 0; padding: 18px 24px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05)); border-left: 4px solid #667eea; border-radius: 0 16px 16px 0; color: #4a5568; font-style: italic; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);',
                code: 'background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); color: #667eea; padding: 4px 8px; border-radius: 6px; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; font-size: 90%; border: 1px solid rgba(102, 126, 234, 0.2);',
                pre: 'background: linear-gradient(135deg, #2d3748, #4a5568) !important; color: #e2e8f0 !important; padding: 24px; border-radius: 16px; margin: 20px 0; overflow-x: auto; font-family: Monaco, Menlo, "Ubuntu Mono", monospace; line-height: 1.6; font-size: 14px; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);',
                a: 'color: #667eea; text-decoration: none; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), transparent); padding: 2px 4px; border-radius: 4px;',
                ul: 'margin: 14px 0; padding-left: 28px;',
                ol: 'margin: 14px 0; padding-left: 28px;',
                li: 'margin: 6px 8px; line-height: 1.6;'
            },
            'mac-style': {
                base: 'font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif; line-height: 1.7; color: #4a5568;',
                h1: 'font-size: 2em; font-weight: 600; color: #2d3748; margin: 1.5em 0 0.8em 0; padding-bottom: 0.3em; border-bottom: 2px solid #e2e8f0; line-height: 1.3;',
                h2: 'font-size: 1.6em; font-weight: 600; color: #2d3748; margin: 1.5em 0 0.8em 0; padding-bottom: 0.2em; border-bottom: 1px solid #e2e8f0; line-height: 1.3;',
                h3: 'font-size: 1.3em; font-weight: 600; color: #2d3748; margin: 1.5em 0 0.8em 0; line-height: 1.3;',
                p: 'margin: 1em 0; line-height: 1.7; color: #4a5568;',
                strong: 'color: #2d3748; font-weight: 600;',
                em: 'color: #4a5568; font-style: italic;',
                blockquote: 'border-left: 4px solid #4299e1; background: #f7fafc; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #2d3748; font-style: italic;',
                code: 'background: #edf2f7; color: #e53e3e; padding: 2px 6px; border-radius: 4px; font-family: "SF Mono", Monaco, Menlo, Consolas, monospace; font-size: 0.9em;',
                pre: 'position: relative; background: #2d3748 !important; border: 1px solid #4a5568; border-radius: 8px; margin: 20px 0; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); padding: 45px 20px 20px 20px !important; color: #e2e8f0 !important; font-family: "SF Mono", Monaco, Menlo, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 14px; line-height: 1.6;',
                a: 'color: #4299e1; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.3s ease;',
                ul: 'padding-left: 2em; margin: 1em 0;',
                ol: 'padding-left: 2em; margin: 1em 0;',
                li: 'margin: 0.5em 0; line-height: 1.6; color: #4a5568;'
            }
        };
        return styles[theme] || styles.wechat;
    }

    /**
     * 将HTML内容转换为带内联样式的HTML
     */
    convertToInlineStyles(htmlContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const styles = this.getInlineStyles();

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

        Object.keys(elements).forEach(tag => {
            const tagElements = tempDiv.querySelectorAll(tag);
            tagElements.forEach(element => {
                if (elements[tag]) {
                    element.style.cssText = elements[tag];
                }
                // 特殊处理pre中的code
                if (tag === 'pre') {
                    const codeInPre = element.querySelector('code');
                    if (codeInPre) {
                        codeInPre.style.cssText = 'background: transparent; color: inherit; padding: 0; border-radius: 0;';
                    }
                }
            });
        });

        return tempDiv.outerHTML;
    }

    /**
     * 复制预览区域的HTML代码到剪贴板（适合微信公众号）
     */
    async copyToClipboard() {
        try {
            const previewElement = this.preview;
            
            if (!previewElement.innerHTML.trim()) {
                this.showToast('⚠️ 没有内容可复制');
                return;
            }

            // 获取预览区域的HTML内容并转换为内联样式
            const htmlWithInlineStyles = this.convertToInlineStyles(previewElement.innerHTML);
            
            // 尝试使用现代 Clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(htmlWithInlineStyles);
                this.showToast('📋 带样式的HTML代码已复制！可以粘贴到微信公众号编辑器了');
            } else {
                // 降级方案：使用传统方法
                const textArea = document.createElement('textarea');
                textArea.value = htmlWithInlineStyles;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                textArea.setSelectionRange(0, 99999); // 兼容移动设备
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (success) {
                    this.showToast('📋 带样式的HTML代码已复制！可以粘贴到微信公众号编辑器了');
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
     * 清空所有内容
     */
    clearContent() {
        if (this.markdownInput.value.trim() && !confirm('确定要清空所有内容吗？')) {
            return;
        }
        
        this.markdownInput.value = '';
        this.preview.innerHTML = '<p style="color: #999; text-align: center; margin-top: 50px;">✨ 在左侧输入Markdown内容，这里会实时显示预览效果</p>';
        this.updateWordCount();
        this.saveToStorage();
        this.markdownInput.focus();
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
                this.changeTheme();
                this.updateWordCount();
            }
        } catch (error) {
            console.error('从本地存储加载失败:', error);
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