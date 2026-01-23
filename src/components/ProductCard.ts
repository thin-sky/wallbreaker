/**
 * Product Card Custom Element
 * Displays product information with image, title, price, and add-to-cart button
 */
export class ProductCard extends HTMLElement {
  static observedAttributes = ['product-id', 'title', 'price', 'image'];

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const productId = this.getAttribute('product-id') || '';
    const title = this.getAttribute('title') || 'Product Name';
    const price = this.getAttribute('price') || '0.00';
    const image = this.getAttribute('image') || this.getPlaceholderImage();

    this.innerHTML = `
      <article class="product-card">
        <div class="product-image">
          <img src="${image}" alt="${title}" loading="lazy" />
        </div>
        <div class="product-info">
          <h3 class="product-title">${title}</h3>
          <p class="product-price">$${price}</p>
          <button 
            class="add-to-cart-button" 
            data-product-id="${productId}"
            aria-label="Add ${title} to cart"
          >
            Add to Cart
          </button>
        </div>
      </article>
    `;
  }

  attachEventListeners() {
    const button = this.querySelector('.add-to-cart-button');
    button?.addEventListener('click', (e) => {
      const productId = (e.target as HTMLElement).dataset.productId;
      this.dispatchEvent(new CustomEvent('add-to-cart', {
        detail: { productId },
        bubbles: true,
        composed: true,
      }));
    });
  }

  getPlaceholderImage(): string {
    // Shopify-style placeholder SVG
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 525.5 525.5'%3E%3Cpath fill='%23e5e7eb' d='M324.5 212.7H203c-1.6 0-2.8 1.3-2.8 2.8V308c0 1.6 1.3 2.8 2.8 2.8h121.6c1.6 0 2.8-1.3 2.8-2.8v-92.5c0-1.6-1.3-2.8-2.9-2.8zm1.1 95.3c0 .6-.5 1.1-1.1 1.1H203c-.6 0-1.1-.5-1.1-1.1v-92.5c0-.6.5-1.1 1.1-1.1h121.6c.6 0 1.1.5 1.1 1.1V308z'/%3E%3Cpath fill='%23e5e7eb' d='M210.4 299.5H240v.1s.1 0 .1-.1h75.2v-76.2h-105v76.2zm1.8-7.2l20-21.3 7.9 8.4 14.7-15.7 27.2 28.6h-69.8zm85.4-1.4l-12.9-13.5 12.9-13.7v27.2zm-1.5-56.5v24.1l-14.3 15.2-7.9-8.4-20.4 21.7-19.9-21.2v-31.4h62.5zm-63.9 0v5.6l-1.4-1.5v-4.1h1.4zm0 67.9v-5.5l1.4 1.5v4h-1.4z'/%3E%3C/svg%3E`;
  }
}

customElements.define('product-card', ProductCard);
