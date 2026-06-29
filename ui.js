(function() {
    'use strict';

    // ========== 嵌入模式检测 ==========
    var isEmbed = (function() {
        // URL 参数检测: ?embed=1
        var params = new URLSearchParams(window.location.search);
        if (params.get('embed') === '1') return true;
        // 检测是否在 iframe 中
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    })();

    if (isEmbed) {
        document.documentElement.classList.add('is-embed');
    }

    // ========== iframe 高度自适应 ==========
    function reportHeight() {
        if (!isEmbed) return;
        var h = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.parent.postMessage({ type: 'gxt-resize', height: h }, '*');
    }

    if (isEmbed) {
        // 监听父页面请求高度
        window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'gxt-get-height') {
                reportHeight();
            }
        });
        // 内容变化时自动上报高度
        var resizeObserver = new ResizeObserver(function() {
            reportHeight();
        });
        resizeObserver.observe(document.body);
        // 初始上报
        window.addEventListener('load', reportHeight);
        // DOM 变化时也上报
        var mutationObserver = new MutationObserver(function() {
            reportHeight();
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
    }

    // ========== 弹窗逻辑 ==========
    var modal = document.getElementById('aboutModal');
    if (modal) {
        var closeBtn = modal.querySelector('.close');
        if (closeBtn) {
            closeBtn.onclick = function() { modal.style.display = 'none'; };
        }
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // ========== 按钮点击动画 ==========
    document.querySelectorAll('.btn').forEach(function(button) {
        button.addEventListener('click', function() {
            button.classList.add('animate__animated', 'animate__pulse');
            setTimeout(function() {
                button.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });
})();
