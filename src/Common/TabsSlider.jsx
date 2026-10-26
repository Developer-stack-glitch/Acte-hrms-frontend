import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * TabsSlider
 * Provides sleek, smooth horizontal scrolling with neatly styled left and right
 * slider buttons and gradient fade masks for tab navigation bars.
 */
export default function TabsSlider({
    children,
    activeKey,
    className = '',
    containerClassName = '',
}) {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const hasOverflow = el.scrollWidth > el.clientWidth + 2;
        setCanScrollLeft(hasOverflow && el.scrollLeft > 6);
        setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        checkScroll();

        const onScroll = () => checkScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', checkScroll);

        const resizeObserver = new ResizeObserver(() => {
            checkScroll();
        });
        resizeObserver.observe(el);
        Array.from(el.children).forEach((child) => resizeObserver.observe(child));

        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', checkScroll);
            resizeObserver.disconnect();
        };
    }, [checkScroll]);

    // Automatically scroll active tab into view if activeKey or children change
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const timer = setTimeout(() => {
            let activeEl = null;
            if (activeKey) {
                activeEl = el.querySelector(`[data-tab-id="${activeKey}"]`);
            }
            if (!activeEl) {
                activeEl = el.querySelector('[data-active="true"]') || el.querySelector('.border-primary');
            }

            if (activeEl) {
                const elRect = el.getBoundingClientRect();
                const activeRect = activeEl.getBoundingClientRect();

                // If active element is partially cut off or out of view, scroll smoothly
                if (activeRect.left < elRect.left + 40 || activeRect.right > elRect.right - 40) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
            checkScroll();
        }, 60);

        return () => clearTimeout(timer);
    }, [activeKey, children, checkScroll]);

    const handleScroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = Math.max(el.clientWidth * 0.65, 220);
        el.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
        setTimeout(checkScroll, 350);
    };

    // Allow horizontal scrolling with mouse wheel over tab bar
    const handleWheel = (e) => {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
            checkScroll();
        }
    };

    return (
        <div className={`relative group/slider w-full ${containerClassName}`}>
            {/* Left Slider Button with Gradient Fade */}
            <div
                className={`absolute left-0 top-0 bottom-[1px] z-30 flex items-center pr-8 pl-1 bg-gradient-to-r from-white via-white/95 to-transparent transition-opacity duration-200 ${
                    canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    type="button"
                    onClick={() => handleScroll('left')}
                    aria-label="Scroll left"
                    title="Previous tabs"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white shadow-md border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary/40 hover:bg-blue-50/50 active:scale-90 transition-all duration-150 focus:outline-none"
                >
                    <ChevronLeft size={16} className="text-gray-700" />
                </button>
            </div>

            {/* Scrollable Tabs Track */}
            <div
                ref={scrollRef}
                onWheel={handleWheel}
                className={`overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1 ${className}`}
            >
                {children}
            </div>

            {/* Right Slider Button with Gradient Fade */}
            <div
                className={`absolute right-0 top-0 bottom-[1px] z-30 flex items-center pl-8 pr-1 bg-gradient-to-l from-white via-white/95 to-transparent transition-opacity duration-200 ${
                    canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <button
                    type="button"
                    onClick={() => handleScroll('right')}
                    aria-label="Scroll right"
                    title="Next tabs"
                    className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-white shadow-md border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-primary hover:border-primary/40 hover:bg-blue-50/50 active:scale-90 transition-all duration-150 focus:outline-none"
                >
                    <ChevronRight size={16} className="text-gray-700" />
                </button>
            </div>
        </div>
    );
}
