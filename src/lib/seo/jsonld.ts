/**
 * JSON-LD Schema Generation for SEO
 * Based on Schema.org and Fourthwall data models
 * 
 * Reference: https://schema.org/
 * Product: https://schema.org/Product
 * Organization: https://schema.org/Organization
 * BreadcrumbList: https://schema.org/BreadcrumbList
 */

import type { ProductCreatedPayload, OrderPlacedPayload } from '@/schemas/webhooks';

// ============================================================================
// Organization Schema
// ============================================================================

export interface OrganizationSchema {
    '@context': 'https://schema.org';
    '@type': 'Organization';
    name: string;
    url: string;
    logo?: string;
    sameAs?: string[];
    contactPoint?: {
        '@type': 'ContactPoint';
        contactType: string;
        email?: string;
    };
}

export function generateOrganizationSchema(data: {
    name: string;
    url: string;
    logo?: string;
    socialLinks?: string[];
    email?: string;
}): OrganizationSchema {
    const schema: OrganizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: data.name,
        url: data.url,
    };

    if (data.logo) {
        schema.logo = data.logo;
    }

    if (data.socialLinks && data.socialLinks.length > 0) {
        schema.sameAs = data.socialLinks;
    }

    if (data.email) {
        schema.contactPoint = {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: data.email,
        };
    }

    return schema;
}

// ============================================================================
// Product Schema (from Fourthwall)
// ============================================================================

export interface ProductSchema {
    '@context': 'https://schema.org';
    '@type': 'Product';
    name: string;
    description?: string;
    image?: string[];
    sku?: string;
    offers: {
        '@type': 'Offer';
        price: number;
        priceCurrency: string;
        availability: string;
        url: string;
    };
    brand?: {
        '@type': 'Brand';
        name: string;
    };
}

export function generateProductSchema(product: {
    id: string;
    name: string;
    description?: string;
    images?: Array<{ url: string }>;
    variants: Array<{
        sku: string;
        unitPrice: { value: number; currency: string };
        stock: { type: string; inStock?: number };
    }>;
    url: string;
    brandName?: string;
}): ProductSchema {
    const firstVariant = product.variants[0];

    // Map stock type to Schema.org availability
    const availability =
        firstVariant.stock.type === 'UNLIMITED' ? 'https://schema.org/InStock' :
            firstVariant.stock.type === 'OUT_OF_STOCK' ? 'https://schema.org/OutOfStock' :
                (firstVariant.stock.inStock && firstVariant.stock.inStock > 0) ? 'https://schema.org/InStock' :
                    'https://schema.org/OutOfStock';

    const schema: ProductSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        offers: {
            '@type': 'Offer',
            price: firstVariant.unitPrice.value,
            priceCurrency: firstVariant.unitPrice.currency,
            availability,
            url: product.url,
        },
    };

    if (product.description) {
        schema.description = product.description;
    }

    if (product.images && product.images.length > 0) {
        schema.image = product.images.map(img => img.url);
    }

    if (firstVariant.sku) {
        schema.sku = firstVariant.sku;
    }

    if (product.brandName) {
        schema.brand = {
            '@type': 'Brand',
            name: product.brandName,
        };
    }

    return schema;
}

/**
 * Generate Product schema from Fourthwall PRODUCT_CREATED webhook
 */
export function generateProductSchemaFromWebhook(
    payload: ProductCreatedPayload,
    baseUrl: string
): ProductSchema {
    return generateProductSchema({
        id: payload.id,
        name: payload.name,
        description: payload.description,
        images: payload.images,
        variants: payload.variants,
        url: `${baseUrl}/products/${payload.slug}`,
        brandName: 'Store', // Can be customized
    });
}

// ============================================================================
// Collection/ItemList Schema
// ============================================================================

export interface CollectionSchema {
    '@context': 'https://schema.org';
    '@type': 'ItemList';
    name: string;
    description?: string;
    numberOfItems: number;
    itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        item: {
            '@type': 'Product';
            name: string;
            url: string;
            image?: string;
        };
    }>;
}

export function generateCollectionSchema(data: {
    name: string;
    description?: string;
    products: Array<{
        name: string;
        url: string;
        image?: string;
    }>;
}): CollectionSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: data.name,
        description: data.description,
        numberOfItems: data.products.length,
        itemListElement: data.products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
                '@type': 'Product',
                name: product.name,
                url: product.url,
                image: product.image,
            },
        })),
    };
}

// ============================================================================
// Breadcrumb Schema
// ============================================================================

export interface BreadcrumbSchema {
    '@context': 'https://schema.org';
    '@type': 'BreadcrumbList';
    itemListElement: Array<{
        '@type': 'ListItem';
        position: number;
        name: string;
        item?: string;
    }>;
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{
    name: string;
    url?: string;
}>): BreadcrumbSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => {
            const item: {
                '@type': 'ListItem';
                position: number;
                name: string;
                item?: string;
            } = {
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.name,
            };

            // Only include item URL if it's not the last breadcrumb
            if (crumb.url && index < breadcrumbs.length - 1) {
                item.item = crumb.url;
            }

            return item;
        }),
    };
}

// ============================================================================
// Order/Invoice Schema
// ============================================================================

export interface OrderSchema {
    '@context': 'https://schema.org';
    '@type': 'Order';
    orderNumber: string;
    orderDate: string;
    orderStatus: string;
    customer: {
        '@type': 'Person';
        name: string;
        email: string;
    };
    orderedItem: Array<{
        '@type': 'OrderItem';
        orderItemNumber: string;
        orderQuantity: number;
        orderedItem: {
            '@type': 'Product';
            name: string;
            sku: string;
        };
        price: number;
        priceCurrency: string;
    }>;
    priceSpecification: {
        '@type': 'PriceSpecification';
        price: number;
        priceCurrency: string;
    };
}

export function generateOrderSchemaFromWebhook(
    payload: OrderPlacedPayload
): OrderSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'Order',
        orderNumber: payload.friendlyId,
        orderDate: payload.createdAt,
        orderStatus: payload.status === 'CONFIRMED' ?
            'https://schema.org/OrderProcessing' :
            'https://schema.org/OrderProblem',
        customer: {
            '@type': 'Person',
            name: payload.billing.address.name,
            email: payload.email,
        },
        orderedItem: payload.offers.map((offer, index) => ({
            '@type': 'OrderItem',
            orderItemNumber: `${index + 1}`,
            orderQuantity: offer.variant.quantity,
            orderedItem: {
                '@type': 'Product',
                name: offer.name,
                sku: offer.variant.sku,
            },
            price: offer.variant.price.value,
            priceCurrency: offer.variant.price.currency,
        })),
        priceSpecification: {
            '@type': 'PriceSpecification',
            price: payload.amounts.total.value,
            priceCurrency: payload.amounts.total.currency,
        },
    };
}

// ============================================================================
// Blog Article Schema
// ============================================================================

export interface ArticleSchema {
    '@context': 'https://schema.org';
    '@type': 'BlogPosting';
    headline: string;
    description?: string;
    image?: string;
    author: {
        '@type': 'Person';
        name: string;
    };
    datePublished: string;
    dateModified?: string;
}

export function generateArticleSchema(article: {
    title: string;
    description?: string;
    image?: string;
    author: string;
    publishedDate: Date;
    updatedDate?: Date;
}): ArticleSchema {
    const schema: ArticleSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.title,
        author: {
            '@type': 'Person',
            name: article.author,
        },
        datePublished: article.publishedDate.toISOString(),
    };

    if (article.description) {
        schema.description = article.description;
    }

    if (article.image) {
        schema.image = article.image;
    }

    if (article.updatedDate) {
        schema.dateModified = article.updatedDate.toISOString();
    }

    return schema;
}

// ============================================================================
// Utility: Convert schema to JSON-LD script tag
// ============================================================================

export function schemaToJsonLd(schema: any): string {
    return JSON.stringify(schema, null, 2);
}
