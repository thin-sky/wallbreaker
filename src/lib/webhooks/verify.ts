/**
 * Verify Fourthwall webhook signature using HMAC SHA-256
 * Based on Fourthwall webhook documentation
 * 
 * @param payload Raw request body as string
 * @param signature Signature from X-Fourthwall-Signature header
 * @param secret Webhook secret from Fourthwall dashboard
 * @returns True if signature is valid, false otherwise
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Convert secret and payload to Uint8Array
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(payload);
    
    // Import the secret as a CryptoKey for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Generate HMAC signature
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, payloadData);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures (constant-time comparison)
    return timingSafeEqual(expectedSignature, signature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Extract webhook ID from payload
 * @param payload Parsed webhook payload
 * @returns Webhook ID
 */
export function getWebhookId(payload: any): string {
  return payload.id || `${payload.event}-${Date.now()}`;
}

/**
 * Extract event type from payload
 * @param payload Parsed webhook payload
 * @returns Event type (e.g., 'fourthwall.order.created')
 */
export function getEventType(payload: any): string {
  return payload.event || 'unknown';
}
