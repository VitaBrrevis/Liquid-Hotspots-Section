(function () {
    'use strict';

    const inited = new WeakSet();

    function $(root, sel) { return root.querySelector(sel); }
    function $all(root, sel) { return Array.from(root.querySelectorAll(sel)); }

    function activate(root, spot, btn) {
        $all(root, '.hsw__spot').forEach(x => x.classList.remove('is-active'));
        $all(root, '.hsw__tag-btn').forEach(x => x.classList.remove('is-active'));
        if (spot) spot.classList.add('is-active');
        if (btn) btn.classList.add('is-active');
    }

    function buildTags(root) {
        const tagsList = $(root, '.hsw__tags');
        if (!tagsList) return;

        const spots = $all(root, '.hsw__spots .hsw__spot');
        tagsList.innerHTML = '';

        let firstBtn = null, firstSpot = null;

        spots.forEach((spot, idx) => {
            const title = spot.dataset.title || 'Hotspot';

            const li = document.createElement('li');
            li.className = 'hsw__tag';

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'hsw__tag-btn';
            btn.textContent = title;
            btn.dataset.targetSpot = spot.id;

            li.appendChild(btn);
            tagsList.appendChild(li);

            const bind = () => activate(root, spot, btn);
            btn.addEventListener('mouseenter', bind);
            btn.addEventListener('focus', bind);
            btn.addEventListener('click', bind);
            spot.addEventListener('mouseenter', bind);
            spot.addEventListener('focus', bind);
            spot.addEventListener('click', bind);

            if (idx === 0) { firstBtn = btn; firstSpot = spot; }
        });

        if (firstBtn && firstSpot) activate(root, firstSpot, firstBtn);
    }

    function initSlideEl(root) {
        if (!root || inited.has(root)) return;
        inited.add(root);

        buildTags(root);

        const spotsHost = $(root, '.hsw__spots');
        if (spotsHost && 'MutationObserver' in window) {
            new MutationObserver(() => buildTags(root)).observe(spotsHost, { childList: true, subtree: true });
        }

        if (window.Shopify && Shopify.designMode) {
            document.addEventListener('shopify:block:select', e => { if (root.contains(e.target)) buildTags(root); });
            document.addEventListener('shopify:block:deselect', e => { if (root.contains(e.target)) buildTags(root); });
            document.addEventListener('shopify:section:load', e => { if (e.target && e.target.contains(root)) buildTags(root); });
            document.addEventListener('shopify:section:reorder', () => buildTags(root));
        }
    }

    function initById(id) {
        const el = document.getElementById(id);
        if (!el) return;
        // The slide root is the block container itself:
        initSlideEl(el);
    }

    // Public API + queue for early calls
    const prev = window.HSW || {};
    const queued = prev.queue || [];

    window.HSW = {
        register(id) {
            if (document.readyState === 'loading') {
                (this.queue = this.queue || []).push(id);
            } else {
                initById(id);
            }
        },
        initById,
        _initEl: initSlideEl,
        queue: queued
    };

    function drain() {
        (window.HSW.queue || []).forEach(initById);
        window.HSW.queue = [];
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', drain);
    } else {
        drain();
    }
})();
