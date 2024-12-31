// 页面切换相关的状态和函数
const pages = {
    intro: document.getElementById('intro-page'),
    keywords: document.getElementById('keywords-page'),
    diary: document.getElementById('diary-page'),
    share: document.getElementById('share-page')
};

function switchPage(fromPage, toPage) {
    fromPage.classList.remove('active');
    fromPage.classList.add('hidden');
    toPage.classList.remove('hidden');
    toPage.classList.add('active');
}

// 关键词选择页面相关功能
class KeywordsSelector {
    constructor() {
        this.selectedKeywords = new Set();
        this.maxKeywords = 5;
        this.minKeywords = 3;
        this.categories = {
            '生活方式': ['健康生活', '自由探索', '慢生活', '数字游民', '极简主义', '环保生活', '城市生活', '乡村生活', '冒险精神'],
            '兴趣爱好': ['阅读', '写作', '摄影', '音乐', '绘画', '运动', '烹饪', '园艺', '手工'],
            '价值观': ['创新', '平衡', '自由', '责任', '成长', '分享', '合作', '独立', '勇敢']
        };
        this.currentCategory = '生活方式';
        this.init();
    }

    init() {
        this.initCategoryButtons();
        this.initTagButtons();
        this.initCustomInput();
        this.updateSelectedCount();
        this.initGenerateButton();
    }

    initCategoryButtons() {
        const categoryContainer = document.querySelector('.flex.justify-around');
        categoryContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                // 移除其他按钮的选中状态
                categoryContainer.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('category-selected');
                });
                // 添加当前按钮的选中状态
                e.target.classList.add('category-selected');
                // 更新当前分类并刷新标签
                this.currentCategory = e.target.textContent;
                this.updateTagButtons();
            }
        });
    }

    initTagButtons() {
        const tagsContainer = document.querySelector('.grid.grid-cols-3');
        tagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-item')) {
                const keyword = e.target.textContent;
                if (e.target.classList.contains('tag-selected')) {
                    this.removeKeyword(keyword);
                    e.target.classList.remove('tag-selected');
                } else if (this.selectedKeywords.size < this.maxKeywords) {
                    this.addKeyword(keyword);
                    e.target.classList.add('tag-selected');
                } else {
                    this.showToast(`最多只能选择${this.maxKeywords}个关键词`);
                }
            }
        });
    }

    initCustomInput() {
        const input = document.querySelector('input[type="text"]');
        const addButton = input.nextElementSibling;

        addButton.addEventListener('click', () => {
            const keyword = input.value.trim();
            if (keyword && this.selectedKeywords.size < this.maxKeywords) {
                this.addKeyword(keyword);
                input.value = '';
            }
        });
    }

    addKeyword(keyword) {
        if (this.selectedKeywords.size >= this.maxKeywords) return;
        
        this.selectedKeywords.add(keyword);
        this.updateSelectedKeywords();
        this.updateSelectedCount();
    }

    removeKeyword(keyword) {
        this.selectedKeywords.delete(keyword);
        this.updateSelectedKeywords();
        this.updateSelectedCount();
    }

    updateSelectedKeywords() {
        const container = document.querySelector('.flex.gap-2.flex-wrap');
        container.innerHTML = '';

        this.selectedKeywords.forEach(keyword => {
            const div = document.createElement('div');
            div.className = 'inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm';
            div.innerHTML = `
                ${keyword}
                <button class="hover:opacity-80">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;

            div.querySelector('button').addEventListener('click', () => {
                this.removeKeyword(keyword);
                // 同时更新对应的标签按钮状态
                const tagButton = document.querySelector(`.tag-item:not(.tag-selected)`);
                if (tagButton && tagButton.textContent === keyword) {
                    tagButton.classList.remove('tag-selected');
                }
            });

            container.appendChild(div);
        });
    }

    updateSelectedCount() {
        const countElement = document.querySelector('.text-sm.text-gray-500.mb-3');
        countElement.textContent = `已选择 ${this.selectedKeywords.size}（${this.minKeywords}-${this.maxKeywords}）`;
    }

    updateTagButtons() {
        const tagsContainer = document.querySelector('.grid.grid-cols-3');
        tagsContainer.innerHTML = '';
        
        this.categories[this.currentCategory].forEach(tag => {
            const button = document.createElement('button');
            button.className = `tag-item border rounded-lg py-3 px-2 text-sm text-gray-600 ${
                this.selectedKeywords.has(tag) ? 'tag-selected' : ''
            }`;
            button.textContent = tag;
            tagsContainer.appendChild(button);
        });
    }

    initGenerateButton() {
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.addEventListener('click', () => {
            if (this.selectedKeywords.size >= this.minKeywords) {
                switchPage(pages.keywords, pages.diary);
                // 初始化日记生成器
                new DiaryGenerator(Array.from(this.selectedKeywords));
            } else {
                this.showToast(`请至少选择${this.minKeywords}个关键词`);
            }
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 text-white px-6 py-3 rounded-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
}

class DiaryGenerator {
    constructor(keywords) {
        this.keywords = keywords;
        this.diaryContent = {
            youth: '',
            middle: '',
            elder: '',
            summary: ''
        };
        this.MOONSHOT_API_KEY = 'sk-ucCQj3tNcTbVPGyhMLtFhIdI0jNuOOs7J1udqhA1dHSo9fR5';
        this.API_BASE_URL = 'https://api.moonshot.cn/v1';
        this.init();
    }

    init() {
        // 初始化时隐藏页脚
        const footer = document.querySelector('footer');
        footer.style.opacity = '0';
        footer.style.visibility = 'hidden';
        
        // 添加必要的CSS
        this.addStyles();
        
        // 先生成AI内容，再显示
        this.generateAIContent().then(() => {
            this.generateDiaryContent();
            this.initMusicButton();
            this.initFooterButtons();
        });
    }

    async generateAIContent() {
        try {
            this.showLoading();
            
            // 准备提示词
            const prompt = this.generatePrompt();
            
            // 调用 Kimi API
            const response = await this.callKimiAPI(prompt);
            
            // 解析响应
            const content = this.parseResponse(response);
            
            // 更新日记内容
            const sections = document.querySelectorAll('.diary-content p[data-content]');
            sections.forEach((section, index) => {
                if (index < 3) {
                    section.dataset.content = content[Object.keys(this.diaryContent)[index]];
                }
            });

            // 更新总结文字
            const summaryText = document.querySelector('.summary-text');
            if (summaryText && content.summary) {
                summaryText.textContent = `"${content.summary}"`;
            }

            this.hideLoading();
        } catch (error) {
            console.error('生成日记失败:', error);
            this.showToast('生成失败，请重试');
        }
    }

    generatePrompt() {
        return `请根据以下关键词：${this.keywords.join('、')}，如果一直按照喜欢的关键词的生活态度进行，生成青年时期，中年时期，老年时期三篇未来日记，以及未来生活总结。
请严格按照以下格式生成内容：

青年时期：
描述20-35岁的生活状态，要生动形象，富有画面感。

中年时期：
描述36-55岁的生活状态，要生动形象，富有画面感。

老年时期：
描述56岁以后的生活状态，要生动形象，富有画面感。

总结：
[一句话简练地总结你未来的生活]`;
    }

    async callKimiAPI(prompt) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.MOONSHOT_API_KEY}`
                },
                body: JSON.stringify({
                    model: "moonshot-v1-32k",
                    messages: [
                        {
                            role: "system",
                            content: "你是一个专业的未来日记生成助手，善于根据关键词描绘人生不同阶段的生活场景。"
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error('API 请求失败');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('API 调用失败:', error);
            throw error;
        }
    }

    parseResponse(response) {
        try {
            // 使用正则表达式匹配各个部分
            const youthMatch = response.match(/青年时期[：:]\s*([\s\S]*?)(?=\n\n中年时期|$)/);
            const middleMatch = response.match(/中年时期[：:]\s*([\s\S]*?)(?=\n\n老年时期|$)/);
            const elderMatch = response.match(/老年时期[：:]\s*([\s\S]*?)(?=\n\n总结|$)/);
            const summaryMatch = response.match(/总结[：:]\s*([\s\S]*?)$/);

            return {
                youth: youthMatch ? youthMatch[1].trim() : '',
                middle: middleMatch ? middleMatch[1].trim() : '',
                elder: elderMatch ? elderMatch[1].trim() : '',
                summary: summaryMatch ? summaryMatch[1].trim() : ''
            };
        } catch (error) {
            console.error('解析响应失败:', error);
            throw error;
        }
    }

    showLoading() {
        const loading = document.createElement('div');
        loading.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        loading.innerHTML = `
            <div class="bg-white rounded-lg p-6 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p class="text-gray-600">正在生成你的未来日记...</p>
            </div>
        `;
        loading.id = 'loading-screen';
        document.body.appendChild(loading);
    }

    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.remove();
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            footer {
                transition: opacity 0.8s ease-in;
            }
        `;
        document.head.appendChild(style);
    }

    generateDiaryContent() {
        const sections = document.querySelectorAll('.diary-content section');
        const footer = document.querySelector('footer');
        const summaryText = document.querySelector('.summary-text');
        
        // 先隐藏所有内容
        sections.forEach(section => {
            section.style.opacity = '0';
            const paragraph = section.querySelector('p[data-content]');
            if (paragraph) {
                paragraph.textContent = '';
            }
        });

        if (summaryText) {
            summaryText.style.opacity = '0';
            summaryText.style.display = 'none';
        }

        // 按顺序显示每个section
        let currentSectionIndex = 0;

        const showNextSection = () => {
            if (currentSectionIndex >= 3) { // 只处理三个主要部分
                // 所有主要部分显示完毕后，显示总结文字
                if (summaryText && summaryText.textContent) { // 确保有内容才显示
                    setTimeout(() => {
                        summaryText.style.display = 'inline-block';
                        summaryText.style.opacity = '0';
                        requestAnimationFrame(() => {
                            summaryText.style.transition = 'opacity 1.0s ease-in';
                            summaryText.style.opacity = '1';
                            
                            // 在总结文字显示完成后显示页脚
                            setTimeout(() => {
                                footer.style.visibility = 'visible';
                                footer.style.opacity = '0';
                                footer.style.animation = 'fadeIn 0.8s ease-in forwards';
                            }, 1000);
                        });
                    }, 1000);
                } else {
                    // 如果没有总结文字，直接显示页脚
                    footer.style.visibility = 'visible';
                    footer.style.opacity = '0';
                    footer.style.animation = 'fadeIn 0.8s ease-in forwards';
                }
                return;
            }

            const section = sections[currentSectionIndex];
            section.style.opacity = '1';
            section.style.animation = 'fadeIn 0.8s ease-in forwards';

            const sectionParagraph = section.querySelector('p[data-content]');
            if (sectionParagraph) {
                const content = sectionParagraph.dataset.content;
                this.typeWriter(sectionParagraph, content, 0, 30, () => {
                    // 当前段落打字完成后，延迟1秒开始下一部分
                    setTimeout(() => {
                        currentSectionIndex++;
                        showNextSection();
                    }, 1000);
                });
            }
        };

        // 开始显示第一个section
        showNextSection();
    }

    // 修改打字机效果方法，添加回调函数
    typeWriter(element, text, index, speed, callback) {
        if (index < text.length) {
            if (index === 0) {
                element.style.opacity = '1';
            }
            element.textContent += text.charAt(index);
            setTimeout(() => {
                this.typeWriter(element, text, index + 1, speed, callback);
            }, speed);
        } else if (callback) {
            // 文本完全显示后执行回调
            callback();
        }
    }

    initMusicButton() {
        const musicBtn = document.querySelector('header button');
        let isPlaying = false;
        
        musicBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            musicBtn.querySelector('i').style.color = isPlaying ? '#FF6A39' : '#666';
            // 这里可以添加音乐播放/暂停逻辑
        });
    }

    initFooterButtons() {
        const editBtn = document.querySelector('footer button:nth-child(1)');
        const saveBtn = document.querySelector('footer button:nth-child(2)');
        const shareBtn = document.querySelector('footer button:nth-child(3)');

        editBtn.addEventListener('click', () => {
            // 返回关键词输入页面
            switchPage(pages.diary, pages.keywords);
        });

        saveBtn.addEventListener('click', () => {
            this.saveDiaryAsImage();
        });

        shareBtn.addEventListener('click', () => {
            this.showSharePage();
        });
    }

    async saveDiaryAsImage() {
        try {
            // 创建一个临时容器来复制日记内容
            const container = document.createElement('div');
            container.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background: linear-gradient(135deg, #FFF9F4 0%, #FAF5F0 100%);
                padding: 20px;
                z-index: -1;
            `;
            
            // 复制日记内容
            const diaryContent = document.querySelector('.diary-content').cloneNode(true);
            const header = document.querySelector('header').cloneNode(true);
            
            // 移除音乐按钮
            header.querySelector('button')?.remove();
            
            container.appendChild(header);
            container.appendChild(diaryContent);
            document.body.appendChild(container);

            // 使用 html2canvas 截图
            const canvas = await html2canvas(container, {
                backgroundColor: null,
                scale: 2, // 提高图片质量
                logging: false,
                useCORS: true
            });

            // 移除临时容器
            document.body.removeChild(container);

            // 转换为图片并下载
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = '未来日记.png';
            link.href = image;
            link.click();

            this.showToast('日记已保存为图片');
        } catch (error) {
            console.error('保存图片失败:', error);
            this.showToast('保存失败，请重试');
        }
    }

    showSharePage() {
        // 直接切换到分享页面，不再生成图片
        switchPage(pages.diary, pages.share);
        this.initSharePage();
    }

    initSharePage() {
        const sharePage = document.getElementById('share-page');
        const shareBtn = sharePage.querySelector('.share-btn');
        const closeBtn = sharePage.querySelector('.close-share-btn');
        const editTextBtn = sharePage.querySelector('.edit-share-text-btn');
        const sharePlatforms = sharePage.querySelectorAll('.share-platform');
        
        // 关闭按钮
        closeBtn.addEventListener('click', () => {
            switchPage(pages.share, pages.diary);
        });

        // 编辑文案按钮
        editTextBtn.addEventListener('click', () => {
            this.editShareText();
        });

        // 分享平台点击
        sharePlatforms.forEach(platform => {
            platform.addEventListener('click', () => {
                const platformName = platform.dataset.platform;
                this.shareToPlateform(platformName);
            });
        });

        // 底部分享按钮
        shareBtn.addEventListener('click', () => {
            this.showToast('请选择要分享到的平台');
        });
    }

    editShareText() {
        const shareText = document.querySelector('.share-text');
        const currentText = shareText.textContent;
        
        // 创建编辑对话框
        const dialog = document.createElement('div');
        dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
        dialog.innerHTML = `
            <div class="bg-white w-full max-w-md rounded-lg p-4">
                <h3 class="text-lg font-medium mb-4">编辑分享文案</h3>
                <textarea class="w-full h-32 p-3 border rounded-lg mb-4 text-sm">${currentText}</textarea>
                <div class="flex justify-end gap-3">
                    <button class="px-4 py-2 text-gray-600 cancel-btn">取消</button>
                    <button class="px-4 py-2 bg-primary text-white rounded-lg confirm-btn">确定</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 绑定按钮事件
        dialog.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(dialog);
        });

        dialog.querySelector('.confirm-btn').addEventListener('click', () => {
            const newText = dialog.querySelector('textarea').value;
            shareText.textContent = newText;
            document.body.removeChild(dialog);
        });
    }

    shareToPlateform(platform) {
        // 生成分享链接
        const shareUrl = this.generateShareUrl();
        const shareText = document.querySelector('.share-text').textContent;
        
        // 根据不同平台实现分享逻辑
        switch(platform) {
            case 'wechat':
                // 微信分享
                this.shareToWechat(shareUrl, shareText);
                break;
            case 'moments':
                // 朋友圈分享
                this.shareToMoments(shareUrl, shareText);
                break;
            case 'weibo':
                // 微博分享
                this.shareToWeibo(shareUrl, shareText);
                break;
            case 'xiaohongshu':
                // 小红书分享
                this.shareToXiaohongshu(shareUrl, shareText);
                break;
        }
    }

    generateShareUrl() {
        // 生成分享链接，包含必要的参数
        const baseUrl = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({
            keywords: this.keywords.join(','),
            timestamp: Date.now()
        });
        return `${baseUrl}?${params.toString()}`;
    }

    shareToWechat(url, text) {
        if (typeof WeixinJSBridge !== 'undefined') {
            // 在微信环境内
            WeixinJSBridge.invoke('shareAppMessage', {
                title: '遇见未来的你',
                desc: text,
                link: url,
                imgUrl: 'path/to/share/image.jpg' // 分享图片的URL
            }, (res) => {
                if (res.err_msg === 'share_app_message:ok') {
                    this.onShareSuccess();
                }
            });
        } else {
            // 不在微信环境内
            this.showToast('请在微信内打开分享');
        }
    }

    shareToMoments(url, text) {
        if (typeof WeixinJSBridge !== 'undefined') {
            WeixinJSBridge.invoke('shareTimeline', {
                title: text,
                link: url,
                imgUrl: 'path/to/share/image.jpg'
            }, (res) => {
                if (res.err_msg === 'share_timeline:ok') {
                    this.onShareSuccess();
                }
            });
        } else {
            this.showToast('请在微信内打开分享');
        }
    }

    shareToWeibo(url, text) {
        const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        window.open(weiboUrl, '_blank');
        this.onShareSuccess();
    }

    shareToXiaohongshu(url, text) {
        // 小红书目前没有开放的网页分享接口
        // 这里可以根据实际情况实现
        this.showToast('请打开小红书 App 进行分享');
    }

    onShareSuccess() {
        this.showToast('分享成功');
        // 增加分享次数奖励
        this.addShareReward();
        
        // 2秒后返回日记页面
        setTimeout(() => {
            switchPage(pages.share, pages.diary);
        }, 2000);
    }

    addShareReward() {
        // 这里可以实现增加用户分享奖励的逻辑
        // 比如通过 API 请求后端增加用户的生成次数
        console.log('增加分享奖励');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/75 text-white px-6 py-3 rounded-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 绑定开始探索按钮
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
        switchPage(pages.intro, pages.keywords);
    });

    // 初始化关键词选择器
    const keywordsSelector = new KeywordsSelector();

    // 添加 html2canvas 脚本
    const script = document.createElement('script');
    script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
    document.head.appendChild(script);
}); 