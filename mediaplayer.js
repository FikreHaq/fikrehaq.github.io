(function() {
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes fh-pulse-animation {
            0% { box-shadow: 0 0 4px var(--shadow-pink); }
            100% { box-shadow: 0 0 12px var(--shadow-brown); }
        }
        @keyframes fh-bar-breathe {
            0%, 100% { transform: scaleY(1); opacity: 0.45; }
            50% { transform: scaleY(1.4); opacity: 0.9; }
        }
        @keyframes fh-bar-dance {
            0% { transform: scaleY(0.45); }
            100% { transform: scaleY(1.25); }
        }
        @keyframes fh-bar-loading {
            0% { transform: translateY(-3px); background-color: var(--brown-1); }
            100% { transform: translateY(3px); background-color: var(--brown-3); }
        }
        @keyframes fh-capsule-pulse {
            0% { box-shadow: 0 0 2px var(--shadow-pink); }
            100% { box-shadow: 0 0 9px var(--shadow-pink); }
        }
    `;
    document.head.appendChild(animationStyle);

    window.currentActivePlayer = null;

    function extractGoogleDriveId(url) {
        if (!url) return null;
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9_-]{15,})/i,
            /\/d\/([a-zA-Z0-9_-]{15,})/i,
            /[?&]id=([a-zA-Z0-9_-]{15,})/i,
            /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{15,})/i
        ];
        for (let i = 0; i < patterns.length; i++) {
            const match = url.match(patterns[i]);
            if (match && match[1]) return match[1];
        }
        return null;
    }

    function triggerDirectDownload(url, fileName) {
        const tempLink = document.createElement('a');
        tempLink.href = url;
        if (fileName) {
            tempLink.setAttribute('download', fileName);
        } else {
            tempLink.setAttribute('download', '');
        }
        tempLink.setAttribute('target', '_blank');
        tempLink.setAttribute('rel', 'noopener noreferrer');
        tempLink.style.display = 'none';
        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
    }

    function closePlayerSmoothly(wrapper) {
        if (!wrapper) return;
        wrapper.classList.remove('fh-open');

        const subBoxes = wrapper.querySelectorAll('.fh-dynamic-iframe-box');
        subBoxes.forEach((box) => box.classList.remove('fh-sub-open'));

        const readBtn = wrapper.querySelector('.fh-btn-read');
        if (readBtn && readBtn.dataset.defaultHtml) {
            readBtn.innerHTML = readBtn.dataset.defaultHtml;
            readBtn.classList.remove('is-active');
        }

        const mediaElements = wrapper.querySelectorAll('audio, video, iframe');
        for (let i = 0; i < mediaElements.length; i++) {
            if (mediaElements[i].pause) mediaElements[i].pause();
            if (mediaElements[i].tagName.toLowerCase() === 'iframe') {
                mediaElements[i].src = '';
            }
        }

        setTimeout(() => {
            if (!wrapper.classList.contains('fh-open')) {
                wrapper.remove();
                if (window.currentActivePlayer === wrapper) {
                    window.currentActivePlayer = null;
                }
            }
        }, 380);
    }

    document.addEventListener('click', function(event) {
        const targetLink = event.target.closest('.link-segment-container a');
        if (!targetLink) return;

        const originalHref = targetLink.href;
        if (!originalHref) return;

        const href = originalHref.toLowerCase();
        const isArchiveDomain = href.includes('archive.org/download/') || href.includes('archive.org/compress/');
        const isGoogleDrive = href.includes('drive.google.com') || href.includes('docs.google.com');
        const ytVideoMatch = originalHref.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        const isFacebookVideo = (href.includes('facebook.com') && (href.includes('/videos/') || href.includes('video.php'))) || href.includes('fb.watch');
        const googleId = extractGoogleDriveId(originalHref);

        const linkText = (targetLink.textContent || targetLink.innerText || '').trim().toLowerCase();
        const isAudioFile = /\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i.test(href) || (googleId && /\b(mp3|m4a|aac|wav|ogg|آڈیو|audio)\b/i.test(linkText));
        const isVideoFile = /\.(mp4|3gp|webm|mkv|avi|ogv)(\?.*)?$/i.test(href) || (googleId && /\b(mp4|3gp|webm|mkv|avi|ogv|ویڈیو|video)\b/i.test(linkText));
        const isPdfFile = /\.(pdf)(\?.*)?$/i.test(href) || (googleId && /\b(pdf|پی ڈی ایف|کتاب)\b/i.test(linkText));
        const isImageFile = /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(href) || (googleId && /\b(jpg|jpeg|png|gif|webp|تصویر|image)\b/i.test(linkText));
        const isMedia = (isAudioFile || isVideoFile || ytVideoMatch || isFacebookVideo);

        if (isMedia || (isArchiveDomain && (isImageFile || isPdfFile)) || googleId || isGoogleDrive) {
            event.preventDefault();

            const targetCard = targetLink.closest('.link-segment-container');
            if (!targetCard) return;

            const existingPlayer = targetCard.querySelector('.fh-card-player-dropdown');
            if (existingPlayer) {
                closePlayerSmoothly(existingPlayer);
                return;
            }

            if (window.currentActivePlayer) {
                closePlayerSmoothly(window.currentActivePlayer);
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'fh-card-player-dropdown';

            const innerContent = document.createElement('div');
            innerContent.className = 'fh-dropdown-inner';

            if (googleId || isGoogleDrive) {
                const viewUrl = googleId ? `https://drive.google.com/file/d/${googleId}/preview` : originalHref;
                const downUrl = googleId ? `https://drive.google.com/uc?export=download&id=${googleId}` : originalHref;

                let btnHtml = `<i class="fa-solid fa-book-open"></i><span>مطالعہ</span>`;
                const openHtml = `<i class="fa-solid fa-xmark"></i><span>بند کریں</span>`;
                const loadingHtml = `<i class="fa-solid fa-spinner fa-spin"></i><span>لوڈ ہو رہا ہے</span>`;
                let mediaClass = 'fh-type-document';

                if (isAudioFile) {
                    btnHtml = `<i class="fa-solid fa-play"></i><span>چلائیں</span>`;
                    mediaClass = 'fh-type-audio';
                } else if (isVideoFile) {
                    btnHtml = `<i class="fa-solid fa-play"></i><span>چلائیں</span>`;
                    mediaClass = 'fh-type-video';
                } else if (isImageFile) {
                    btnHtml = `<i class="fa-solid fa-eye"></i><span>دیکھیں</span>`;
                    mediaClass = 'fh-type-image';
                } else if (isPdfFile) {
                    mediaClass = 'fh-type-pdf';
                }

                innerContent.innerHTML = `
                    <div class="fh-media-wrapper">
                        <div class="fh-doc-actions">
                            <button type="button" class="fh-action-btn fh-btn-read">${btnHtml}</button>
                            <a href="${downUrl}" download class="fh-action-btn fh-btn-download" target="_blank" rel="noopener noreferrer">
                                <i class="fa-solid fa-download"></i><span>ڈاؤن لوڈ</span>
                            </a>
                        </div>
                        <div class="fh-dynamic-iframe-box">
                            <div class="fh-iframe-inner ${mediaClass}"></div>
                        </div>
                    </div>`;

                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);

                requestAnimationFrame(() => {
                    wrapper.classList.add('fh-open');
                });
                window.currentActivePlayer = wrapper;

                const readBtn = innerContent.querySelector('.fh-btn-read');
                const downBtn = innerContent.querySelector('.fh-btn-download');
                const iframeBox = innerContent.querySelector('.fh-dynamic-iframe-box');
                const iframeInner = innerContent.querySelector('.fh-iframe-inner');

                if (readBtn) {
                    readBtn.dataset.defaultHtml = btnHtml;
                }

                if (downBtn) {
                    downBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerDirectDownload(downUrl, googleId ? `drive-file-${googleId}` : '');
                    });
                }

                if (readBtn && iframeBox && iframeInner) {
                    readBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const isSubOpen = iframeBox.classList.contains('fh-sub-open');
                        if (isSubOpen) {
                            iframeBox.classList.remove('fh-sub-open');
                            this.classList.remove('is-active');
                            this.innerHTML = btnHtml;
                            setTimeout(() => {
                                if (!iframeBox.classList.contains('fh-sub-open')) {
                                    iframeInner.innerHTML = '';
                                }
                            }, 380);
                            return;
                        }

                        this.innerHTML = loadingHtml;
                        this.classList.add('is-active');

                        if (isImageFile && googleId) {
                            iframeInner.innerHTML = `<img src="https://drive.google.com/uc?export=view&id=${googleId}" class="image-preview" alt="Preview">`;
                        } else {
                            iframeInner.innerHTML = `<iframe src="${viewUrl}" allow="autoplay" allowfullscreen></iframe>`;
                        }

                        requestAnimationFrame(() => {
                            iframeBox.classList.add('fh-sub-open');
                        });
                        this.innerHTML = openHtml;
                    });
                }
            }
            else if (isMedia) {
                let mediaElement = '';
                if (isAudioFile) {
                    mediaElement = `
                        <audio class="fh-inline-audio" controls preload="metadata" src="${originalHref}"></audio>
                        <div class="fh-controls">
                            <button type="button" class="fh-skip-btn fh-skip-backward" aria-label="10 سیکنڈ پیچھے">
                                <i class="fa-solid fa-rotate-left"></i><span>10s</span>
                            </button>
                            <div class="fh-center-download-group">
                                <div class="fh-capsule-loader fh-loading" title="آڈیو اسٹیٹس">
                                    <span class="fh-bar"></span><span class="fh-bar"></span><span class="fh-bar"></span>
                                </div>
                                <a href="${originalHref}" download class="fh-audio-download-icon-btn" aria-label="ڈاؤن لوڈ کریں" title="ڈاؤن لوڈ کریں" target="_blank" rel="noopener noreferrer">
                                    <i class="fa-solid fa-download"></i>
                                </a>
                            </div>
                            <button type="button" class="fh-skip-btn fh-skip-forward" aria-label="10 سیکنڈ آگے">
                                <span>10s</span><i class="fa-solid fa-rotate-right"></i>
                            </button>
                        </div>`;
                } else if (isVideoFile) {
                    mediaElement = `<video controls preload="metadata" playsinline style="width:100%; border-radius:12px;"><source src="${originalHref}"></video>`;
                } else if (ytVideoMatch) {
                    mediaElement = `<div class="fh-iframe-container-video"><iframe src="https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=0" style="width:100%; height:100%; border:none;" allowfullscreen></iframe></div>`;
                } else if (isFacebookVideo) {
                    const fbUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(originalHref)}&show_text=false&width=auto&autoplay=false`;
                    mediaElement = `<div class="fh-iframe-container-video"><iframe src="${fbUrl}" style="width:100%; height:100%; border:none;" allowfullscreen="true"></iframe></div>`;
                }

                innerContent.innerHTML = `<div class="fh-media-wrapper">${mediaElement}</div>`;
                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);
                requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                window.currentActivePlayer = wrapper;

                if (isAudioFile) {
                    const audioEl = wrapper.querySelector('.fh-inline-audio');
                    const skipBack = wrapper.querySelector('.fh-skip-backward');
                    const skipForward = wrapper.querySelector('.fh-skip-forward');
                    const loader = wrapper.querySelector('.fh-capsule-loader');
                    const downloadBtn = wrapper.querySelector('.fh-audio-download-icon-btn');

                    if (downloadBtn) {
                        downloadBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            triggerDirectDownload(originalHref);
                        });
                    }

                    if (audioEl && loader) {
                        audioEl.addEventListener('loadstart', () => {
                            loader.className = 'fh-capsule-loader fh-loading';
                        });
                        audioEl.addEventListener('canplay', () => {
                            if (audioEl.paused) loader.className = 'fh-capsule-loader';
                        });
                        audioEl.addEventListener('playing', () => {
                            loader.className = 'fh-capsule-loader fh-playing';
                        });
                        audioEl.addEventListener('pause', () => {
                            loader.className = 'fh-capsule-loader';
                        });
                        audioEl.addEventListener('ended', () => {
                            loader.className = 'fh-capsule-loader';
                        });
                    }

                    function setupSkip(button, isForward) {
                        if (!button || !audioEl) return;
                        let holdTimer = null;
                        let skipInterval = null;
                        let isLongPress = false;
                        let suppressNextClick = false;
                        const step = isForward ? 10 : -10;

                        const clearTimers = () => {
                            clearTimeout(holdTimer);
                            clearInterval(skipInterval);
                            holdTimer = null;
                            skipInterval = null;
                        };

                        const start = (e) => {
                            e.stopPropagation();
                            if (e.type === 'touchstart') e.preventDefault();
                            isLongPress = false;
                            clearTimers();

                            holdTimer = setTimeout(() => {
                                isLongPress = true;
                                suppressNextClick = true;
                                button.classList.add('long-press-active');
                                audioEl.pause();
                                skipInterval = setInterval(() => {
                                    if (!isNaN(audioEl.duration)) {
                                        audioEl.currentTime = Math.min(
                                            audioEl.duration,
                                            Math.max(0, audioEl.currentTime + step)
                                        );
                                    } else {
                                        audioEl.currentTime = Math.max(0, audioEl.currentTime + step);
                                    }
                                }, 120);
                            }, 400);
                        };

                        const end = (e) => {
                            e.stopPropagation();
                            if (e.type === 'touchend' || e.type === 'touchcancel') e.preventDefault();
                            const wasLongPress = isLongPress;
                            clearTimers();
                            button.classList.remove('long-press-active');

                            if (!wasLongPress) {
                                if (!isNaN(audioEl.duration)) {
                                    audioEl.currentTime = Math.min(
                                        audioEl.duration,
                                        Math.max(0, audioEl.currentTime + step)
                                    );
                                } else {
                                    audioEl.currentTime = Math.max(0, audioEl.currentTime + step);
                                }
                            } else {
                                audioEl.play().catch(() => {});
                            }
                            isLongPress = false;
                        };

                        button.addEventListener('mousedown', start);
                        button.addEventListener('mouseup', end);
                        button.addEventListener('mouseleave', () => {
                            clearTimers();
                            button.classList.remove('long-press-active');
                        });
                        button.addEventListener('touchstart', start, { passive: false });
                        button.addEventListener('touchend', end, { passive: false });
                        button.addEventListener('touchcancel', () => {
                            clearTimers();
                            button.classList.remove('long-press-active');
                        }, { passive: false });
                        button.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (suppressNextClick) {
                                suppressNextClick = false;
                                e.preventDefault();
                            }
                        });
                    }

                    setupSkip(skipBack, false);
                    setupSkip(skipForward, true);
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
                const viewUrl = `https://docs.google.com/gview?url=${encodeURIComponent(originalHref)}&embedded=true`;
                const readHtml = `<i class="fa-solid fa-book-open"></i><span>مطالعہ</span>`;
                const closeHtml = `<i class="fa-solid fa-xmark"></i><span>بند کریں</span>`;
                const loadHtml = `<i class="fa-solid fa-spinner fa-spin"></i><span>لوڈ ہو رہا ہے</span>`;

                innerContent.innerHTML = `
                    <div class="fh-media-wrapper">
                        <div class="fh-doc-actions">
                            <button type="button" class="fh-action-btn fh-btn-read">${readHtml}</button>
                            <a href="${originalHref}" download class="fh-action-btn fh-btn-download" target="_blank" rel="noopener noreferrer">
                                <i class="fa-solid fa-download"></i><span>ڈاؤن لوڈ لنک</span>
                            </a>
                        </div>
                        <div class="fh-dynamic-iframe-box">
                            <div class="fh-iframe-inner fh-type-pdf"></div>
                        </div>
                    </div>`;

                wrapper.appendChild(innerContent);
                targetCard.appendChild(wrapper);
                requestAnimationFrame(() => wrapper.classList.add('fh-open'));
                window.currentActivePlayer = wrapper;

                const readBtn = innerContent.querySelector('.fh-btn-read');
                const downBtn = innerContent.querySelector('.fh-btn-download');
                const iframeBox = innerContent.querySelector('.fh-dynamic-iframe-box');
                const iframeInner = innerContent.querySelector('.fh-iframe-inner');

                if (readBtn) {
                    readBtn.dataset.defaultHtml = readHtml;
                }

                if (downBtn) {
                    downBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerDirectDownload(originalHref);
                    });
                }

                if (readBtn && iframeBox && iframeInner) {
                    readBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        const isSubOpen = iframeBox.classList.contains('fh-sub-open');
                        if (isSubOpen) {
                            iframeBox.classList.remove('fh-sub-open');
                            this.classList.remove('is-active');
                            this.innerHTML = readHtml;
                            setTimeout(() => {
                                if (!iframeBox.classList.contains('fh-sub-open')) {
                                    iframeInner.innerHTML = '';
                                }
                            }, 380);
                            return;
                        }

                        this.innerHTML = loadHtml;
                        this.classList.add('is-active');
                        iframeInner.innerHTML = `<iframe src="${viewUrl}" allowfullscreen></iframe>`;

                        requestAnimationFrame(() => {
                            iframeBox.classList.add('fh-sub-open');
                        });
                        this.innerHTML = closeHtml;
                    });
                }
            }
        }
    });
})();
