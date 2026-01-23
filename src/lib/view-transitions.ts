/**
 * View Transition API utilities for MPA (Multi-Page App) transitions
 * 
 * Handles custom view transition animations using the pageswap and pagereveal events.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using#basic_mpa_view_transition
 */

/**
 * Check if view transitions are supported
 */
export function supportsViewTransitions(): boolean {
    return 'startViewTransition' in document && CSS.supports('view-transition-name', 'none');
}

/**
 * Get Navigation API activation if available
 */
function getNavigationActivation(): { from: { url: string }; entry: { url: string } } | null {
    const nav = (window as any).navigation;
    if (!nav || !nav.activation || !nav.activation.from) return null;
    return nav.activation;
}

/**
 * Set view transition name on an element
 */
export function setViewTransitionName(element: Element | null, name: string): void {
    if (!element || !supportsViewTransitions()) return;
    (element as HTMLElement).style.viewTransitionName = name;
}

/**
 * Clear view transition name from an element
 */
export function clearViewTransitionName(element: Element | null): void {
    if (!element || !supportsViewTransitions()) return;
    (element as HTMLElement).style.viewTransitionName = 'none';
}

/**
 * Initialize view transition handlers for MPA navigation
 * 
 * This sets up pageswap and pagereveal event listeners to handle
 * custom view transition animations between pages.
 */
export function initViewTransitions(): void {
    if (!supportsViewTransitions()) return;

    // Handle page swap (leaving current page)
    window.addEventListener('pageswap', async (e) => {
        if (!e.viewTransition) return;

        // Check if Navigation API is available
        const activation = getNavigationActivation();
        if (!activation) return;

        const currentUrl = new URL(activation.from.url);
        const targetUrl = new URL(activation.entry.url);

        // You can add custom logic here to set view-transition-name
        // on specific elements based on the navigation path

        // Example: If navigating from product list to product detail,
        // you might want to animate the clicked product card

        // Clean up view-transition-names after snapshots are taken
        await e.viewTransition.finished;

        // Clear any dynamically set view-transition-names to prevent
        // conflicts when navigating back (BFCache)
        const elementsWithVTNames = document.querySelectorAll('[style*="view-transition-name"]');
        elementsWithVTNames.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.viewTransitionName && htmlEl.style.viewTransitionName !== 'none') {
                htmlEl.style.viewTransitionName = 'none';
            }
        });
    });

    // Handle page reveal (entering new page)
    window.addEventListener('pagereveal', async (e) => {
        if (!e.viewTransition) return;

        // Check if Navigation API is available
        const activation = getNavigationActivation();
        if (!activation) return;

        const fromUrl = new URL(activation.from.url);
        const currentUrl = new URL(activation.entry.url);

        // You can add custom logic here to set view-transition-name
        // on elements of the new page based on where you came from

        // Example: If coming from product list, animate the product detail
        // to match the clicked product card

        // Clean up view-transition-names after snapshots are taken
        await e.viewTransition.ready;

        // Clear any dynamically set view-transition-names
        const elementsWithVTNames = document.querySelectorAll('[style*="view-transition-name"]');
        elementsWithVTNames.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.viewTransitionName && htmlEl.style.viewTransitionName !== 'none') {
                htmlEl.style.viewTransitionName = 'none';
            }
        });
    });
}
