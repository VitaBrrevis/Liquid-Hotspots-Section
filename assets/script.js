class SwiperConfigurator {
    constructor(sliderElement) {
        this.element = sliderElement;
        this.options = this.parseConfig();
        this.setupEventListeners();

        if (this.options.observer) {
            this.initIntersectionObserver();
        } else {
            this.initializeSwiper();
        }
    }

    parseConfig() {
        const { dataset: { config, mobile, observer } } = this.element;

        try {
            return {
                config: JSON.parse(config),
                mobile: mobile === "true",
                observer: observer === "true"
            };
        } catch (error) {
            console.error("Error parsing slider configuration:", error);
            return { config: {}, mobile: false, observer: false };
        }
    }

    initializeSwiper() {
        if (this.shouldDisableSwiper()) {
            return;
        }

        if (!Swiper || !this.element || this.element.swiper) {
            return;
        }

        new Swiper(this.element, this.options.config);
    }

    shouldDisableSwiper() {
        return this.options.mobile && window.innerWidth > 768;
    }

    setupEventListeners() {
        window.addEventListener("resize", this.handleResize.bind(this));
    }

    handleResize() {
        if (this.shouldDisableSwiper()) {
            this.destroySwiper();
        } else {
            this.initializeSwiper();
        }
    }

    destroySwiper() {
        if (this.element && this.element.swiper) {
            this.element.swiper.destroy(true, true);
        }
    }

    initIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log('Element is in view, initializing swiper');
                    this.observer.disconnect();
                    this.initializeSwiper();
                }
            });
        }, { threshold: 0.1 });

        this.observer.observe(this.element);
    }

    static appendTagToBody(tagType, filePath) {
        return new Promise((resolve, reject) => {
            const tag = document.createElement(tagType === 'script' ? 'script' : 'link');

            if (tagType === 'script') {
                tag.src = filePath;
                tag.type = 'text/javascript';
            } else if (tagType === 'style') {
                tag.href = filePath;
                tag.rel = 'stylesheet';
            } else {
                return reject(new Error('Unsupported tag type. Please use "script" or "style".'));
            }

            tag.onload = resolve;
            tag.onerror = () => reject(new Error(`Failed to load ${tagType} file: ${filePath}`));

            document.body.appendChild(tag);
        });
    }

    static appendSwiperFiles() {
        const { css, js } = window.swiperFile;
        const files = [
            { type: 'style', path: css },
            { type: 'script', path: js }
        ].filter(file => file.path);

        if (files.length === 0) {
            return Promise.resolve();
        }

        const loadFilePromises = files.map(file => SwiperConfigurator.appendTagToBody(file.type, file.path));
        return Promise.all(loadFilePromises);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const sliderElements = document.querySelectorAll("[data-slider-selector]");

    if (sliderElements.length > 0) {
        SwiperConfigurator.appendSwiperFiles()
            .then(() => {
                sliderElements.forEach(slider => new SwiperConfigurator(slider));
            }).catch((error) => {
            console.error('Failed to load Swiper files:', error);
        });
    }
});