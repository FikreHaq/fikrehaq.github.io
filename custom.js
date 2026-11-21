// ===== 1. DOM CONTENT LOADED (UI Logic) =====
document.addEventListener('DOMContentLoaded', function () {

    // --- A. SMOOTH REVEAL ON SCROLL ---
    const cards = document.querySelectorAll('.cat-card, .scholar-card, .bayan-item, .stat-box');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '50px' });

        cards.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            observer.observe(el);
        });
    } else {
        cards.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });
    }

    // --- B. MOBILE SIDEBAR LOGIC (Zero-Lag Fix) ---
    const mobileMenuBtn  = document.getElementById('mobileMenuBtn');
    const closeSidebar   = document.getElementById('closeSidebar');
    const mobileSidebar  = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const mobileLinks    = document.querySelectorAll('.mobile-nav-links a, .mobile-link');

    function openSidebar(e) {
        if (e) e.preventDefault();
        if (mobileSidebar)  mobileSidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebarFunc(e) {
        if (e) e.preventDefault();
        if (mobileSidebar)  mobileSidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileMenuBtn)  mobileMenuBtn.addEventListener('click', openSidebar, { passive: false });
    if (closeSidebar)   closeSidebar.addEventListener('click', closeSidebarFunc, { passive: false });
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarFunc, { passive: false });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeSidebarFunc();
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href') || '';
            closeSidebarFunc();

            if (href === '#' || href === '') {
                e.preventDefault();
                return;
            }

            if (href.charAt(0) === '#') {
                const target = document.getElementById(href.slice(1)) || document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    setTimeout(() => {
                        const nav = document.querySelector('.navbar');
                        const offset = (nav ? nav.offsetHeight : 0) + 15;
                        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                        window.scrollTo({ top: top, behavior: 'smooth' });
                        if (history.replaceState) history.replaceState(null, '', href);
                    }, 150);
                }
            }
        });
    });

    // --- C. SMART AUTO-HIDE & BIDIRECTIONAL SCROLL BUTTON ---
    let scrollBtn = document.getElementById('scrollToTopBtn');
    if (!scrollBtn) {
        scrollBtn = document.createElement('button');
        scrollBtn.id = 'scrollToTopBtn';
        scrollBtn.type = 'button';
        scrollBtn.setAttribute('aria-label', 'سکرول کریں');
        scrollBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>';
        document.body.appendChild(scrollBtn);
    }

    let lastScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    let scrollDirection = 'down';
    let scrollTimer = null;

    function setButtonDirection(dir) {
        scrollDirection = dir;
        if (dir === 'down') {
            scrollBtn.classList.add('scroll-down');
            scrollBtn.setAttribute('title', 'نیچے جائیں');
            scrollBtn.setAttribute('aria-label', 'نیچے جائیں');
        } else {
            scrollBtn.classList.remove('scroll-down');
            scrollBtn.setAttribute('title', 'اوپر جائیں');
            scrollBtn.setAttribute('aria-label', 'اوپر جائیں');
        }
    }

    function handleScrollBehavior() {
        const currentScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const fullHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );

        if (fullHeight <= windowHeight + 100) {
            scrollBtn.classList.remove('show');
            return;
        }

        if (currentScrollY <= 15) {
            setButtonDirection('down');
        } else if (currentScrollY + windowHeight >= fullHeight - 15) {
            setButtonDirection('up');
        } else if (currentScrollY > lastScrollY + 4) {
            setButtonDirection('down');
        } else if (currentScrollY < lastScrollY - 4) {
            setButtonDirection('up');
        }

        lastScrollY = currentScrollY;
        scrollBtn.classList.add('show');

        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
            scrollBtn.classList.remove('show');
        }, 3000);
    }

    window.addEventListener('scroll', handleScrollBehavior, { passive: true });

    scrollBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const fullHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight
        );

        if (scrollDirection === 'down') {
            window.scrollTo({ top: fullHeight, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

});
