/**
 * Shopping Cart Custom Element
 * Manages cart state, persistence, and Fourthwall checkout integration
 */

interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  attributes?: {
    size?: string;
    color?: string;
    [key: string]: any;
  };
}

interface Cart {
  items: CartItem[];
  total: number;
  currency: string;
}

export class ShoppingCart extends HTMLElement {
  private cart: Cart = {
    items: [],
    total: 0,
    currency: 'USD',
  };
  
  private storageKey = 'wallbreaker_cart';
  
  connectedCallback() {
    this.loadCart();
    this.render();
    this.attachEventListeners();
    
    // Listen for cart update events from other components
    window.addEventListener('cart:add', this.handleAddToCart.bind(this));
    window.addEventListener('cart:remove', this.handleRemoveFromCart.bind(this));
    window.addEventListener('cart:clear', this.handleClearCart.bind(this));
  }
  
  disconnectedCallback() {
    window.removeEventListener('cart:add', this.handleAddToCart.bind(this));
    window.removeEventListener('cart:remove', this.handleRemoveFromCart.bind(this));
    window.removeEventListener('cart:clear', this.handleClearCart.bind(this));
  }
  
  /**
   * Load cart from localStorage
   */
  private loadCart() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.cart = JSON.parse(stored);
        this.calculateTotal();
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }
  
  /**
   * Save cart to localStorage
   */
  private saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { cart: this.cart },
      }));
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }
  
  /**
   * Calculate cart total
   */
  private calculateTotal() {
    this.cart.total = this.cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }
  
  /**
   * Add item to cart
   */
  private handleAddToCart(event: Event) {
    const customEvent = event as CustomEvent<CartItem>;
    const newItem = customEvent.detail;
    
    // Check if item already exists
    const existingIndex = this.cart.items.findIndex(
      item => item.variantId === newItem.variantId
    );
    
    if (existingIndex >= 0) {
      // Increase quantity
      this.cart.items[existingIndex].quantity += newItem.quantity;
    } else {
      // Add new item
      this.cart.items.push(newItem);
    }
    
    this.calculateTotal();
    this.saveCart();
    this.render();
    
    // Show success notification
    this.showNotification('Item added to cart');
  }
  
  /**
   * Remove item from cart
   */
  private handleRemoveFromCart(event: Event) {
    const customEvent = event as CustomEvent<{ variantId: string }>;
    const { variantId } = customEvent.detail;
    
    this.cart.items = this.cart.items.filter(
      item => item.variantId !== variantId
    );
    
    this.calculateTotal();
    this.saveCart();
    this.render();
    
    this.showNotification('Item removed from cart');
  }
  
  /**
   * Clear entire cart
   */
  private handleClearCart() {
    this.cart.items = [];
    this.cart.total = 0;
    this.saveCart();
    this.render();
  }
  
  /**
   * Update item quantity
   */
  private updateQuantity(variantId: string, quantity: number) {
    const item = this.cart.items.find(i => i.variantId === variantId);
    if (item) {
      if (quantity <= 0) {
        this.handleRemoveFromCart(new CustomEvent('cart:remove', {
          detail: { variantId },
        }));
      } else {
        item.quantity = quantity;
        this.calculateTotal();
        this.saveCart();
        this.render();
      }
    }
  }
  
  /**
   * Proceed to Fourthwall checkout
   */
  private async proceedToCheckout() {
    if (this.cart.items.length === 0) {
      this.showNotification('Your cart is empty', 'error');
      return;
    }
    
    try {
      // Build Fourthwall checkout URL with cart items
      const checkoutUrl = this.buildFourthwallCheckoutUrl();
      
      // Track checkout event
      this.trackCheckoutEvent();
      
      // Redirect to Fourthwall checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      this.showNotification('Failed to proceed to checkout', 'error');
    }
  }
  
  /**
   * Build Fourthwall checkout URL
   * Format: https://shop.fourthwall.com/checkout?cart[0][sku]=SKU&cart[0][quantity]=1
   */
  private buildFourthwallCheckoutUrl(): string {
    const shopDomain = this.getAttribute('shop-domain') || 'shop.fourthwall.com';
    const params = new URLSearchParams();
    
    this.cart.items.forEach((item, index) => {
      params.append(`cart[${index}][sku]`, item.sku);
      params.append(`cart[${index}][quantity]`, item.quantity.toString());
    });
    
    return `https://${shopDomain}/checkout?${params.toString()}`;
  }
  
  /**
   * Track checkout event for analytics
   */
  private async trackCheckoutEvent() {
    try {
      await fetch('/api/ecommerce/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'begin_checkout',
          currency: this.cart.currency,
          value: this.cart.total,
          items: this.cart.items.map((item, index) => ({
            item_id: item.sku,
            item_name: item.name,
            price: item.price,
            quantity: item.quantity,
            index,
          })),
        }),
      });
    } catch (error) {
      console.error('Failed to track checkout event:', error);
    }
  }
  
  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.textContent = message;
    this.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  /**
   * Attach event listeners
   */
  private attachEventListeners() {
    this.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Quantity buttons
      if (target.classList.contains('quantity-decrease')) {
        const variantId = target.dataset.variantId;
        const item = this.cart.items.find(i => i.variantId === variantId);
        if (item) {
          this.updateQuantity(variantId!, item.quantity - 1);
        }
      } else if (target.classList.contains('quantity-increase')) {
        const variantId = target.dataset.variantId;
        const item = this.cart.items.find(i => i.variantId === variantId);
        if (item) {
          this.updateQuantity(variantId!, item.quantity + 1);
        }
      }
      
      // Remove button
      else if (target.classList.contains('remove-item')) {
        const variantId = target.dataset.variantId;
        this.handleRemoveFromCart(new CustomEvent('cart:remove', {
          detail: { variantId },
        }));
      }
      
      // Checkout button
      else if (target.classList.contains('checkout-button')) {
        this.proceedToCheckout();
      }
    });
  }
  
  /**
   * Render cart UI
   */
  private render() {
    const itemCount = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    this.innerHTML = `
      <div class="shopping-cart">
        <div class="cart-header">
          <h2>Shopping Cart</h2>
          <span class="item-count">${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
        </div>
        
        ${this.cart.items.length === 0 ? `
          <div class="cart-empty">
            <p>Your cart is empty</p>
            <a href="/" class="continue-shopping">Continue Shopping</a>
          </div>
        ` : `
          <div class="cart-items">
            ${this.cart.items.map(item => `
              <article class="cart-item" data-variant-id="${item.variantId}">
                ${item.image ? `
                  <img src="${item.image}" alt="${item.name}" class="item-image" />
                ` : ''}
                
                <div class="item-details">
                  <h3>${item.name}</h3>
                  ${item.attributes ? `
                    <p class="item-attributes">
                      ${Object.entries(item.attributes)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ')}
                    </p>
                  ` : ''}
                  <p class="item-sku">SKU: ${item.sku}</p>
                </div>
                
                <div class="item-quantity">
                  <button 
                    class="quantity-decrease" 
                    data-variant-id="${item.variantId}"
                    aria-label="Decrease quantity"
                  >-</button>
                  <span class="quantity">${item.quantity}</span>
                  <button 
                    class="quantity-increase" 
                    data-variant-id="${item.variantId}"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
                
                <div class="item-price">
                  <p class="price">$${(item.price * item.quantity).toFixed(2)}</p>
                  <button 
                    class="remove-item" 
                    data-variant-id="${item.variantId}"
                    aria-label="Remove item"
                  >Remove</button>
                </div>
              </article>
            `).join('')}
          </div>
          
          <div class="cart-summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span class="subtotal">$${this.cart.total.toFixed(2)}</span>
            </div>
            <p class="summary-note">Shipping and taxes calculated at checkout</p>
            
            <button class="checkout-button">
              Proceed to Checkout
            </button>
            
            <a href="/" class="continue-shopping">Continue Shopping</a>
          </div>
        `}
      </div>
    `;
  }
}

// Register the custom element
customElements.define('shopping-cart', ShoppingCart);
