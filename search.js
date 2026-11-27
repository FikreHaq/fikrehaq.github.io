document.addEventListener("DOMContentLoaded", function() {
    const ROOT_CONTAINER_SELECTOR = 'body'; 

    const fileIcons = {
        PDF: `<i class="fa fa-file-pdf" aria-hidden="true"></i>`,
        AUDIO: `<i class="fa fa-file-audio" aria-hidden="true"></i>`,
        VIDEO: `<i class="fa fa-file-video" aria-hidden="true"></i>`,
        IMAGE: `<i class="fa fa-file-image" aria-hidden="true"></i>`,
        GIF: `<i class="fa fa-file-image" aria-hidden="true"></i>`,
        ZIP: `<i class="fa fa-file-zipper" aria-hidden="true"></i>`,
        DOCS: `<i class="fa fa-file-lines" aria-hidden="true"></i>`,
        GOOGLE: `<i class="fab fa-google" aria-hidden="true"></i>`,
        GENERAL: `<i class="fa fa-file" aria-hidden="true"></i>`
    };

    let activeCategoryTab = "ALL"; 
    let dominantCategoryGlobal = ""; 
    let cachedContainers = []; 
    let middleGapElements = []; // ایک ہی بار کیش کیا جائے گا تاکہ سرچ میں صفر وقت لگے
    const rootContainer = document.querySelector(ROOT_CONTAINER_SELECTOR) || document.body;

    // ایک ہی IntersectionObserver تمام 1200+ کارڈز کے لیے
    const cardObserver = ('IntersectionObserver' in window) 
        ? new IntersectionObserver((entries, observer) => {
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].isIntersecting) {
                    entries[i].target.classList.add('card-visible');
                    observer.unobserve(entries[i].target);
                }
            }
        }, { rootMargin: '100px 0px 100px 0px', threshold: 0.05 })
        : null;

    function wrapLinksCustomSite() {
        const targetsSet = new Set();
        const anchors = rootContainer.querySelectorAll('a');
        
        for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i];
            if (a.closest('header, footer, nav, .search-wrapper-main, #helpModal, .no-card, .tabs-container')) continue;

            const href = (a.href || "").toLowerCase();
            if (href.includes("archive.org/download") || href.includes("archive.org/compress") || href.includes("docs.google.com") || href.includes("drive.google.com") || href.includes("google.com/file/")) {
                if (a.parentNode) targetsSet.add(a.parentNode);
            }
        }

        let counters = { PDF: 1, AUDIO: 1, VIDEO: 1, IMAGE: 1, GIF: 1, ZIP: 1, DOCS: 1, GOOGLE: 1, OTHER: 1 };
        let dominantTracker = { PDF: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0, GIF: 0, ZIP: 0, DOCS: 0, GOOGLE: 0, OTHER: 0 };
        const allCreatedCards = [];

        // DocumentFragment استعمال کر کے DOM Reflow کو 1200 سے کم کر کے صرف 1 کر دیا گیا ہے
        targetsSet.forEach(targetParent => {
            const childNodes = Array.from(targetParent.childNodes);
            const fragment = document.createDocumentFragment();
            let accumulatedNodes = [];

            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') {
                    const hrefStr = node.href || "";
                    const hrefLower = hrefStr.toLowerCase();

                    const isDownloadLink = hrefLower.includes("archive.org/download");
                    const isCompressLink = hrefLower.includes("archive.org/compress");
                    const isGoogleLink = hrefLower.includes("docs.google.com") || hrefLower.includes("drive.google.com") || hrefLower.includes("google.com/file/");

                    if (isDownloadLink || isCompressLink || isGoogleLink) {
                        let metaHtml = "";
                        if (accumulatedNodes.length > 0) {
                            const tempDiv = document.createElement('div');
                            for (let j = 0; j < accumulatedNodes.length; j++) {
                                tempDiv.appendChild(accumulatedNodes[j]);
                            }
                            metaHtml = tempDiv.innerHTML
                                .replace(/\s*\|\s*/g, ' | ')
                                .replace(/^(?:\s*<br\s*\/?>\s*)+|(?:\s*<br\s*\/?>\s*)+$/gi, '')
                                .trim();
                        }

                        const container = document.createElement('div');
                        container.className = 'link-segment-container';
                        
                        let fileExt = "LINK"; 
                        const linkText = (node.textContent || node.innerText).trim();
                        const textExtMatch = linkText.match(/\.([a-zA-Z0-9]+)$/);
                        
                        if (isGoogleLink && textExtMatch) {
                            fileExt = textExtMatch[1].toUpperCase();
                        } else {
                            const extMatch = hrefStr.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
                            if (extMatch && !isGoogleLink) { fileExt = extMatch[1].toUpperCase(); }
                        }
                        
                        let categoryType = "other";
                        let iconHtml = fileIcons.GENERAL;
                        let matchedCategory = false;

                        if (isCompressLink || ["ZIP", "RAR", "7Z", "TAR", "GZ", "ISO"].includes(fileExt)) {
                            categoryType = "zip"; iconHtml = fileIcons.ZIP; matchedCategory = true;
                            if (isCompressLink && fileExt === "LINK") fileExt = "ZIP";
                        } else if (["MP3", "WAV", "M4A", "WMA", "AMR", "OGG"].includes(fileExt)) {
                            categoryType = "audio"; iconHtml = fileIcons.AUDIO; matchedCategory = true;
                        } else if (["MP4", "MKV", "AVI", "MOV", "WMV", "FLV"].includes(fileExt)) {
                            categoryType = "video"; iconHtml = fileIcons.VIDEO; matchedCategory = true;
                        } else if (fileExt === "PDF") {
                            categoryType = "pdf"; iconHtml = fileIcons.PDF; matchedCategory = true;
                        } else if (["JPG", "JPEG", "PNG", "SVG", "WEBP"].includes(fileExt)) {
                            categoryType = "image"; iconHtml = fileIcons.IMAGE; matchedCategory = true;
                        } else if (fileExt === "GIF") { 
                            categoryType = "gif"; iconHtml = fileIcons.GIF; matchedCategory = true;
                        } else if (["DOCX", "DOC", "TXT", "EPUB", "PPTX"].includes(fileExt)) { 
                            categoryType = "docs"; iconHtml = fileIcons.DOCS; matchedCategory = true;
                        }

                        if (isGoogleLink && !matchedCategory) {
                            categoryType = "google"; 
                            iconHtml = fileIcons.GOOGLE;
                            if (hrefLower.includes("/document/")) fileExt = "DOCS";
                            else if (hrefLower.includes("/spreadsheets/")) fileExt = "SHEET";
                            else fileExt = "DRIVE"; 
                        }

                        const upperType = categoryType.toUpperCase();
                        dominantTracker[upperType]++;
                        const badgeNumber = counters[upperType]++;
                        
                        container.classList.add(`type-${categoryType}`);
                        container.setAttribute('data-filetype', upperType);

                        const metaBlock = metaHtml !== "" ? `<div class="card-meta-info">${metaHtml}</div>` : "";
                        
                        // ایک ہی innerHTML اسائنمنٹ کے ذریعے تیزی سے کارڈ بنانا
                        container.innerHTML = `
                            <div class="archive-badge">${badgeNumber}</div>
                            <div class="ext-badge">${iconHtml}<span>${fileExt}</span></div>
                            <a href="${node.href}" target="_blank" rel="noopener noreferrer">
                                ${metaBlock}
                                <span class="link-title-text">${escapeHtml(linkText)}</span>
                            </a>
                        `;

                        fragment.appendChild(container);
                        allCreatedCards.push({
                            element: container,
                            type: upperType,
                            number: badgeNumber,
                            text: superNormalize((metaHtml ? container.textContent : linkText))
                        });

                        accumulatedNodes = [];
                        continue; 
                    }
                }
                accumulatedNodes.push(node);
            }

            // بچے ہوئے غیر لنک نوڈز واپس شامل کریں
            for (let j = 0; j < accumulatedNodes.length; j++) {
                fragment.appendChild(accumulatedNodes[j]);
            }

            targetParent.innerHTML = '';
            targetParent.appendChild(fragment);
        });

        let maxCount = 0;
        dominantCategoryGlobal = ""; 
        for (let type in dominantTracker) {
            if (dominantTracker[type] > maxCount) {
                maxCount = dominantTracker[type];
                dominantCategoryGlobal = type;
            }
        }

        // ڈومیننٹ کلاس پہلے سے ہی سیٹ کر دیں
        for (let i = 0; i < allCreatedCards.length; i++) {
            const cardObj = allCreatedCards[i];
            if (cardObj.type === dominantCategoryGlobal) {
                cardObj.element.classList.add('theme-dominated');
            }
            if (cardObserver) {
                cardObserver.observe(cardObj.element);
            } else {
                cardObj.element.classList.add('card-visible');
            }
        }

        cachedContainers = allCreatedCards;
        generateDynamicTabs();
        cacheMiddleGaps();
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
        });
    }

    // درمیان کے فالتو ایلیمنٹس کو صرف ایک بار شروع میں ڈھونڈ کر کیش کرنا
    function cacheMiddleGaps() {
        middleGapElements = [];
        if (cachedContainers.length < 2) return;

        const firstCard = cachedContainers[0].element;
        const lastCard = cachedContainers[cachedContainers.length - 1].element;
        if (!firstCard || !lastCard) return;

        const allElements = rootContainer.querySelectorAll('*');
        for (let i = 0; i < allElements.length; i++) {
            const el = allElements[i];
            if (['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE', 'NOSCRIPT', 'HEADER', 'FOOTER', 'NAV'].includes(el.tagName)) continue;
            if (el.closest('header, footer, nav, .search-wrapper-main, #helpModal, .tabs-container')) continue;
            if (el.classList.contains('link-segment-container') || el.closest('.link-segment-container')) continue;
            if (el.querySelector('.link-segment-container')) continue;

            try {
                const posFirst = firstCard.compareDocumentPosition(el);
                const posLast = lastCard.compareDocumentPosition(el);
                if ((posFirst & Node.DOCUMENT_POSITION_FOLLOWING) && (posLast & Node.DOCUMENT_POSITION_PRECEDING)) {
                    middleGapElements.push(el);
                }
            } catch (e) {}
        }
    }

    function generateDynamicTabs() {
        const tabsContainer = document.getElementById('tabsContainer');
        if (!tabsContainer) return;

        let counts = { PDF: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0, GIF: 0, ZIP: 0, DOCS: 0, GOOGLE: 0, OTHER: 0 };
        let uniqueTypes = new Set();

        for (let i = 0; i < cachedContainers.length; i++) {
            let type = cachedContainers[i].type;
            if (type in counts) { counts[type]++; uniqueTypes.add(type); }
        }

        if (uniqueTypes.size <= 1) { tabsContainer.style.display = 'none'; return; }

        const typeNamesUR = { PDF: "کتب", AUDIO: "آڈیو", VIDEO: "ویڈیو", IMAGE: "تصاویر", GIF: "جیف", ZIP: "زپ", DOCS: "دستاویزات", GOOGLE: "گوگل", OTHER: "دیگر" };

        tabsContainer.innerHTML = '';
        tabsContainer.style.display = 'flex';

        const allTab = document.createElement('button');
        allTab.type = "button";
        allTab.className = 'filter-tab tab-active';
        allTab.innerHTML = `تمام`;
        allTab.setAttribute('data-target', 'ALL');
        tabsContainer.appendChild(allTab);

        const scrollArea = document.createElement('div');
        scrollArea.className = 'tabs-scroll-area';

        uniqueTypes.forEach(type => {
            const tab = document.createElement('button');
            tab.type = "button";
            tab.className = 'filter-tab';
            const iconHtml = fileIcons[type] || fileIcons.GENERAL;
            tab.innerHTML = `${iconHtml} ${typeNamesUR[type]} <span class="tab-count">${counts[type]}</span>`;
            tab.setAttribute('data-target', type);
            scrollArea.appendChild(tab);
        });

        tabsContainer.appendChild(scrollArea);

        tabsContainer.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                tabsContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('tab-active'));
                this.classList.add('tab-active');
                activeCategoryTab = this.getAttribute('data-target');
                performSearch(); 
            });
        });
    }

    function superNormalize(text) {
        if (!text) return "";
        return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
            .replace(/[\u064B-\u065F\u0670\u0610-\u061A\u064C]/g, '').replace(/[ھهۃةۂہ]/g, 'ه') 
            .replace(/[نں]/g, 'ن').replace(/[آأإاٰ]/g, 'ا').replace(/[يیے]/g, 'ی') 
            .replace(/[كک]/g, 'ک').replace(/[ؤ]/g, 'و').replace(/\u0640/g, '') 
            .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    }

    function normalizeNumbers(str) {
        if(!str) return "";
        const persian = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
        const arabic = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
        for(let i = 0; i < 10; i++) {
            str = str.replace(persian[i], i).replace(arabic[i], i);
        }
        return str;
    }

    const inputField = document.getElementById('smartSearch');
    const infoBtn = document.getElementById('infoBtn');
    const clearBtn = document.getElementById('clearSearch');
    const modal = document.getElementById("helpModal");
    const closeModalBtn = document.getElementById("closeModal");
    const okModalBtn = document.getElementById("okBtn");

    // پاپ اپ کو براہِ راست body میں منتقل کریں تاکہ کسی والد عنصر کے transform/overflow سے متاثر نہ ہو
    if (modal && modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    function openHelpModal(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!modal) return;
        modal.style.setProperty("display", "flex", "important");
        requestAnimationFrame(() => {
            modal.classList.add("modal-active");
        });
        document.documentElement.style.overflow = "hidden";
    }

    function closeHelpModal(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!modal) return;
        modal.classList.remove("modal-active");
        document.documentElement.style.overflow = "";
        setTimeout(() => {
            if (!modal.classList.contains("modal-active")) {
                modal.style.removeProperty("display");
            }
        }, 240);
    }

    if (infoBtn && modal) {
        infoBtn.addEventListener("click", openHelpModal);
    }
    if (closeModalBtn && modal) {
        closeModalBtn.addEventListener("click", closeHelpModal);
    }
    if (okModalBtn && modal) {
        okModalBtn.addEventListener("click", closeHelpModal);
    }
    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === modal) {
                closeHelpModal(e);
            }
        });
    }
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal && modal.classList.contains("modal-active")) {
            closeHelpModal(e);
        }
    });
        
    let currentSearchState = false; 
    
    function manageMiddleGaps(isSearching) {
        if (isSearching === currentSearchState) return; 
        currentSearchState = isSearching;

        for (let i = 0; i < middleGapElements.length; i++) {
            const el = middleGapElements[i];
            if (isSearching) {
                el.style.setProperty('display', 'none', 'important');
            } else {
                el.style.display = '';
            }
        }
    }

    if (inputField) {
        inputField.addEventListener('focus', () => {
            if (inputField.value.trim() !== "") manageMiddleGaps(true);
        });
        inputField.addEventListener('blur', () => {
            if (inputField.value.trim() === "") manageMiddleGaps(false);
        });
    }

    let lastTabState = "ALL";

    function performSearch() {
        let rawQuery = inputField ? inputField.value.trim() : "";
        let query = normalizeNumbers(rawQuery);
        let visibleCount = 0;

        if(infoBtn) infoBtn.style.display = rawQuery.length > 0 ? 'none' : 'flex';
        if(clearBtn) clearBtn.style.display = (rawQuery.length > 0 || activeCategoryTab !== "ALL") ? 'flex' : 'none';

        const isSearchingActive = (rawQuery.length > 0 || (inputField && document.activeElement === inputField));
        manageMiddleGaps(isSearchingActive);

        let conditions = [];
        if (query) {
            const groups = query.split(/[,،٫]+/).map(g => g.trim()).filter(g => g.length > 0);
            conditions = groups.map(group => {
                const rangeMatch = group.match(/^(\d+)\s*-\s*(\d+)$/);
                if (rangeMatch) {
                    let s = parseInt(rangeMatch[1], 10), e = parseInt(rangeMatch[2], 10);
                    return { type: 'range', min: Math.min(s, e), max: Math.max(s, e) };
                } else if (/^\d+$/.test(group)) {
                    return { type: 'exact', value: parseInt(group, 10), stringVal: group };
                } else {
                    return { type: 'text', words: group.split(/\s+/).filter(w => w.length > 0).map(w => superNormalize(w)) };
                }
            });
        }

        const tabChanged = (lastTabState !== activeCategoryTab);
        lastTabState = activeCategoryTab;

        // requestAnimationFrame کے ذریعے براؤزر کے اگلے فریم میں سموتھ اپ ڈیٹ
        requestAnimationFrame(() => {
            for (let i = 0, len = cachedContainers.length; i < len; i++) {
                const item = cachedContainers[i];
                const el = item.element;

                if (tabChanged) {
                    if (activeCategoryTab === "ALL" && item.type === dominantCategoryGlobal) {
                        el.classList.add('theme-dominated');
                    } else {
                        el.classList.remove('theme-dominated');
                    }
                }

                let categoryMatches = (activeCategoryTab === "ALL" || item.type === activeCategoryTab);
                let textMatches = (conditions.length === 0);

                if (categoryMatches && conditions.length > 0) {
                    for (let c = 0; c < conditions.length; c++) {
                        let cond = conditions[c];
                        if (cond.type === 'range') {
                            if (item.number >= cond.min && item.number <= cond.max) { textMatches = true; break; }
                        } else if (cond.type === 'exact') {
                            if (item.number === cond.value || item.text.includes(cond.stringVal)) { textMatches = true; break; }
                        } else if (cond.type === 'text') {
                            let allWordsMatch = true;
                            for (let w = 0; w < cond.words.length; w++) {
                                if (!item.text.includes(cond.words[w])) { allWordsMatch = false; break; }
                            }
                            if (allWordsMatch && cond.words.length > 0) { textMatches = true; break; }
                        }
                    }
                }

                if (categoryMatches && textMatches) {
                    if (el.classList.contains('card-hidden')) {
                        el.classList.remove('card-hidden');
                        el.classList.add('card-visible');
                    }
                    visibleCount++;
                } else {
                    if (!el.classList.contains('card-hidden')) {
                        el.classList.add('card-hidden');
                    }
                }
            }

            const searchCounter = document.getElementById('searchCounter');
            if(searchCounter) {
                searchCounter.innerText = `${visibleCount} / ${cachedContainers.length} نتائج`;
                const isFilterOrSearchActive = (rawQuery.length > 0 || activeCategoryTab !== "ALL" || (inputField && document.activeElement === inputField));
                searchCounter.style.display = isFilterOrSearchActive ? 'inline-block' : 'none';
            }
        });
    }

    wrapLinksCustomSite();
    
    let searchTimeout;
    if(inputField) {
        inputField.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 120); // 120ms ڈیباؤنس تاکہ تیز ٹائپنگ پر بھی اٹکے نہیں
        });
    }
    
    if(clearBtn) {
        clearBtn.addEventListener('click', () => { 
            if (inputField) inputField.value = ''; 
            const tabsContainer = document.getElementById('tabsContainer');
            if(tabsContainer && tabsContainer.querySelector('.filter-tab')) {
                tabsContainer.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('tab-active'));
                const defaultTab = tabsContainer.querySelector('[data-target="ALL"]');
                if(defaultTab) defaultTab.classList.add('tab-active');
            }
            activeCategoryTab = "ALL";
            performSearch(); 
            manageMiddleGaps(false); 
        });
    }
});
