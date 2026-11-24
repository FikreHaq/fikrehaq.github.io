(function() {
    // 1. Inject Animations
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes fh-pulse-animation { 0% { box-shadow: 0 0 4px rgba(184,134,107,0.2); } 100% { box-shadow: 0 0 10px rgba(184,134,107,0.4); } }
        @keyframes fh-bar-breathe { 0%, 100% { transform: scaleY(1); opacity: 0.4; } 50% { transform: scaleY(1.4); opacity: 0.8; } }
        @keyframes fh-bar-dance { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1.2); } }
        @keyframes fh-bar-loading { 0% { transform: translateY(-3px); background-color: rgba(184,134,107,0.2); } 100% { transform: translateY(3px); background-color: rgba(184,134,107,0.5); } }
        @keyframes fh-capsule-pulse { 0% { box-shadow: 0 0 2px rgba(0, 0, 0, 0.02); } 100% { box-shadow: 0 0 8px rgba(0, 0, 0, 0.08); } }
    `;
    document.head.appendChild(animationStyle);

    window.currentActivePlayer = null;

    function closePlayerSmoothly(wrapper) {
        if (!wrapper) return;
        wrapper.classList.remove('fh-open');

        let mediaElements = wrapper.querySelectorAll('audio, video, iframe');
        for (let i = 0; i < mediaElements.length; i++) {
            if (mediaElements[i].pause) mediaElements[i].pause();
            if (mediaElements[i].tagName.toLowerCase() === 'iframe') mediaElements[i].src = '';
        }

        setTimeout(() => {
            wrapper.remove();
            if (window.currentActivePlayer === wrapper) {
                window.currentActivePlayer = null;
            }
        }, 350);
    }

    // ہائی پرفارمنس ڈیلیگیشن (Event Delegation) تاکہ 1500 کارڈز پر بھی لیک نہ ہو
    document.addEventListener('click', function(event) {
        let targetLink = event.target.closest('.link-segment-container a');
        if (!targetLink) return;

        let originalHref = targetLink.href;
        if (!originalHref) return;

        let href = originalHref.toLowerCase();
        let isArchiveDomain = href.includes('archive.org/download/') || href.includes('archive.org/compress/');
        let ytVideoMatch = originalHref.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        let isFacebookVideo = (href.includes('facebook.com') && (href.includes('/videos/') || href.includes('video.php'))) || href.includes('fb.watch');
        let googleIdMatch = originalHref.match(/[\/?&](?:id=|d\/)([a-zA-Z0-9_-]{25,})/);

        let linkText = (targetLink.textContent || targetLink.innerText).trim().toLowerCase();
        let isAudioFile = /\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i.test(href) || (googleIdMatch && /\b(mp3|m4a|aac|wav|ogg)\b/i.test(linkText));
        let isVideoFile = /\.(mp4|3gp|webm|mkv|avi|ogv)(\?.*)?$/i.test(href) || (googleIdMatch && /\b(mp4|3gp|webm|mkv|avi|ogv)\b/i.test(linkText));
        let isPdfFile = /\.(pdf)(\?.*)?$/i.test(href) || (googleIdMatch && /\b(pdf)\b/i.test(linkText));
        let isImageFile = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(href) || (googleIdMatch && /\b(jpg|jpeg|png|gif|webp)\b/i.test(linkText));
        let isMedia = (isAudioFile || isVideoFile || ytVideoMatch || isFacebookVideo);

        if (isMedia || (isArchiveDomain && (isImageFile || isPdfFile)) || googleIdMatch) {
            event.preventDefault();

            let targetCard = targetLink.closest('.link-segment-container');
            let existingPlayer = targetCard.querySelector('.fh-card-player-dropdown');

            if (existingPlayer) {
                closePlayerSmoothly(existingPlayer);
                return;
            }

            if (window.currentActivePlayer) {
                closePlayerSmoothly(window.currentActivePlayer);
            }

            let wrapper = document.createElement('div');
            wrapper.className = 'fh-card-player-dropdown';

            let innerContent = document.createElement('div');
            innerContent.className = 'fh-dropdown-inner';

            if (googleIdMatch) {
                let viewUrl = `https://drive.google.com/file/d/${googleIdMatch[1]}/preview`;
                let downUrl = `https://drive.usercontent.google.com/download?id=${googleIdMatch[1]}&export=download&authuser=0`;
                let btnHtml = `<i class="fa-solid fa-book-open"></i><span>مطالعہ</span>`;
                let openHtml = `<i class="fa-solid fa-xmark"></i><span>بند کریں</span>`;
                let loadingHtml = `<i class="fa-solid fa-spinner fa-spin"></i><span>لوڈ ہو رہا ہے</span>`;
                let mediaClass = "fh-type-document";

                if (isAudioFile) {
                    btnHtml = `<i class="fa-solid fa-play"></i><span>چلائیں</span>`;
                    mediaClass = "fh-type-audio";
                } else if (isVideoFile) {
                    btnHtml = `<i class="fa-solid fa-play"></i><span>چلائیں</span>`;
                    mediaClass = "fh-type-video";
                } else if (isImageFile) {
                    btnHtml = `<i class="fa-solid fa-eye"></i><span>دیکھیں</span>`;
                    mediaClass = "fh-type-image";
                }

                innerContent.innerHTML = `
                    <div class="fh-media-wrapper">
                        <div class="fh-pdf-actions">
                            <button type="button" class="fh-action-btn fh-btn-read">${btnHtml}</button>
                            <a href="${downUrl}" class="fh-action-btn fh-btn-download" target="_blank" rel="noopener noreferrer">
                                <i class="fa-solid fa-download"></i><span>ڈاؤن لوڈ</span>
                            </a>
                        </div>
                        <div class="fh-dynamic-iframe-box">
                            <div class="fh-iframe-inner ${mediaClass}"></div>
                        </div>
                    </div>`;

                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);

                let readBtn = innerContent.querySelector('.fh-btn-read');
                let downBtn = innerContent.querySelector('.fh-btn-download');
                let iframeInner = innerContent.querySelector('.fh-iframe-inner');

                if (downBtn) {
                    downBtn.addEventListener('click', (e) => e.stopPropagation());
                }

                readBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (wrapper.classList.contains('fh-open')) {
                        closePlayerSmoothly(wrapper);
                        this.innerHTML = btnHtml;
                        return;
                    }
                    this.innerHTML = loadingHtml;
                    iframeInner.innerHTML = `<iframe src="${viewUrl}" allowfullscreen></iframe>`;
                    requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                    this.innerHTML = openHtml;
                    window.currentActivePlayer = wrapper;
                });
            }
            else if (isMedia) {
                let mediaElement = '';
                if (isAudioFile) {
                    mediaElement = `
                        <div class="fh-controls">
                            <button type="button" class="fh-skip-btn fh-skip-backward" aria-label="10 سیکنڈ پیچھے">
                                <i class="fa-solid fa-rotate-left"></i><span>10s</span>
                            </button>
                            <div class="fh-capsule-loader fh-loading">
                                <span class="fh-bar"></span><span class="fh-bar"></span><span class="fh-bar"></span>
                            </div>
                            <button type="button" class="fh-skip-btn fh-skip-forward" aria-label="10 سیکنڈ آگے">
                                <span>10s</span><i class="fa-solid fa-rotate-right"></i>
                            </button>
                        </div>
                        <audio class="fh-inline-audio" controls preload="metadata" src="${originalHref}"></audio>
                        <div class="fh-audio-actions">
                            <a href="${originalHref}" class="fh-action-btn fh-btn-download fh-audio-download-btn" target="_blank" rel="noopener noreferrer">
                                <i class="fa-solid fa-download"></i><span>ڈاؤن لوڈ لنک</span>
                            </a>
                        </div>`;
                } else if (isVideoFile) {
                    mediaElement = `<video controls preload="metadata" playsinline style="width:100%; border-radius:12px;"><source src="${originalHref}"></video>`;
                } else if (ytVideoMatch) {
                    mediaElement = `<div class="fh-iframe-container-video"><iframe src="https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=0" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>`;
                } else if (isFacebookVideo) {
                    let fbUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalHref)}&show_text=false&width=auto&autoplay=false`;
                    mediaElement = `<div class="fh-iframe-container-video"><iframe src="${fbUrl}" style="width:100%; height:100%; border:none;" allowfullscreen="true"></iframe></div>`;
                }

                innerContent.innerHTML = `<div class="fh-media-wrapper">${mediaElement}</div>`;
                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);
                requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                window.currentActivePlayer = wrapper;

                if (isAudioFile) {
                    let audioEl = wrapper.querySelector('.fh-inline-audio');
                    let skipBack = wrapper.querySelector('.fh-skip-backward');
                    let skipForward = wrapper.querySelector('.fh-skip-forward');
                    let loader = wrapper.querySelector('.fh-capsule-loader');
                    let downloadBtn = wrapper.querySelector('.fh-audio-download-btn');

                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', (e) => e.stopPropagation());
                    }

                    if (audioEl && loader) {
                        audioEl.addEventListener('loadstart', () => loader.className = 'fh-capsule-loader fh-loading');
                        audioEl.addEventListener('canplay', () => { if (audioEl.paused) loader.className = 'fh-capsule-loader'; });
                        audioEl.addEventListener('playing', () => loader.className = 'fh-capsule-loader fh-playing');
                        audioEl.addEventListener('pause', () => loader.className = 'fh-capsule-loader');
                    }

                    function setupSkip(button, isForward) {
                        let holdTimer, skipInterval;
                        let isLongPress = false;
                        const step = isForward ? 10 : -10;
                        const start = (e) => {
                            e.stopPropagation();
                            if (e.type === 'touchstart') e.preventDefault();
                            isLongPress = false;
                            holdTimer = setTimeout(() => {
                                isLongPress = true;
                                button.classList.add('long-press-active');
                                audioEl.pause();
                                skipInterval = setInterval(() => { audioEl.currentTime += step; }, 100);
                            }, 400);
                        };
                        const end = (e) => {
                            e.stopPropagation();
                            if (e.type === 'touchend' || e.type === 'touchcancel') e.preventDefault();
                            clearTimeout(holdTimer);
                            clearInterval(skipInterval);
                            button.classList.remove('long-press-active');
                            if (!isLongPress) audioEl.currentTime += step;
                            else audioEl.play().catch(() => {});
                        };
                        button.addEventListener('mousedown', start);
                        button.addEventListener('mouseup', end);
                        button.addEventListener('mouseleave', end);
                        button.addEventListener('touchstart', start, { passive: false });
                        button.addEventListener('touchend', end, { passive: false });
                    }
                    if (skipBack) setupSkip(skipBack, false);
                    if (skipForward) setupSkip(skipForward, true);
                }
            }
            else if (isImageFile && isArchiveDomain) {
                innerContent.innerHTML = `<div class="fh-media-wrapper"><img src="${originalHref}" class="image-preview" alt="Preview"></div>`;
                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);
                requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                window.currentActivePlayer = wrapper;
            }
            else if (isArchiveDomain && isPdfFile) {
                let viewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(originalHref)}&embedded=true`;
                let readHtml = `<i class="fa-solid fa-book-open"></i><span>مطالعہ</span>`;
                let closeHtml = `<i class="fa-solid fa-xmark"></i><span>بند کریں</span>`;
                let loadHtml = `<i class="fa-solid fa-spinner fa-spin"></i><span>لوڈ ہو رہا ہے</span>`;

                innerContent.innerHTML = `
                    <div class="fh-media-wrapper">
                        <div class="fh-pdf-actions">
                            <button type="button" class="fh-action-btn fh-btn-read">${readHtml}</button>
                            <a href="${originalHref}" class="fh-action-btn fh-btn-download" target="_blank" rel="noopener noreferrer">
                                <i class="fa-solid fa-download"></i><span>ڈاؤن لوڈ لنک</span>
                            </a>
                        </div>
                        <div class="fh-dynamic-iframe-box">
                            <div class="fh-iframe-inner fh-type-pdf"></div>
                        </div>
                    </div>`;

                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);

                let readBtn = innerContent.querySelector('.fh-btn-read');
                let downBtn = innerContent.querySelector('.fh-btn-download');
                let iframeInner = innerContent.querySelector('.fh-iframe-inner');

                if (downBtn) {
                    downBtn.addEventListener('click', (e) => e.stopPropagation());
                }

                readBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (wrapper.classList.contains('fh-open')) {
                        closePlayerSmoothly(wrapper);
                        this.innerHTML = readHtml;
                        return;
                    }
                    this.innerHTML = loadHtml;
                    iframeInner.innerHTML = `<iframe src="${viewUrl}" allowfullscreen></iframe>`;
                    requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                    this.innerHTML = closeHtml;
                    window.currentActivePlayer = wrapper;
                });
            }
        }
    });
})();
