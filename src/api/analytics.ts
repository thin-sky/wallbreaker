import { Hono } from 'hono';
import type { Env } from '../types';
import {
  insertPageview,
  insertAnalyticsEvent,
  getPageviewCount,
  getTopPages,
  getEventCount,
  getTopEvents,
} from '@/lib/db/analytics';
import { InsertAnalyticsPageviewSchema, InsertAnalyticsEventSchema } from '@/schemas/database';

const app = new Hono<{ Bindings: Env }>();

/**
 * Track a page view
 * POST /api/analytics/pageviews
 */
app.post('/analytics/pageviews', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = InsertAnalyticsPageviewSchema.safeParse(body);
    if (!validated.success) {
      return c.json({
        error: 'Invalid request body',
        details: validated.error.issues,
      }, 400);
    }
    
    // Extract additional data from request
    const country = c.req.header('cf-ipcountry') || null;
    const userAgent = c.req.header('user-agent') || null;
    
    // Insert page view
    const id = await insertPageview(c.env.DB, {
      ...validated.data,
      country,
      user_agent: userAgent,
    });
    
    return c.json({
      success: true,
      id,
    }, 201);
  } catch (error) {
    console.error('Error tracking pageview:', error);
    return c.json({
      error: 'Failed to track pageview',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Track a custom event
 * POST /api/analytics/events
 */
app.post('/analytics/events', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = InsertAnalyticsEventSchema.safeParse(body);
    if (!validated.success) {
      return c.json({
        error: 'Invalid request body',
        details: validated.error.issues,
      }, 400);
    }
    
    // Insert analytics event
    const id = await insertAnalyticsEvent(c.env.DB, validated.data);
    
    return c.json({
      success: true,
      id,
    }, 201);
  } catch (error) {
    console.error('Error tracking event:', error);
    return c.json({
      error: 'Failed to track event',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Get analytics stats
 * GET /api/analytics/stats
 */
app.get('/analytics/stats', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7', 10);
    
    // Get top pages and events
    const [topPages, topEvents] = await Promise.all([
      getTopPages(c.env.DB, 10, days),
      getTopEvents(c.env.DB, 10, days),
    ]);
    
    return c.json({
      period_days: days,
      top_pages: topPages,
      top_events: topEvents,
    });
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    return c.json({
      error: 'Failed to fetch stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Get page view count
 * GET /api/analytics/pageviews/:path
 */
app.get('/analytics/pageviews/:path', async (c) => {
  try {
    const path = c.req.param('path');
    const days = parseInt(c.req.query('days') || '7', 10);
    
    const count = await getPageviewCount(c.env.DB, `/${path}`, days);
    
    return c.json({
      path: `/${path}`,
      views: count,
      period_days: days,
    });
  } catch (error) {
    console.error('Error fetching pageview count:', error);
    return c.json({
      error: 'Failed to fetch pageview count',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Get event count
 * GET /api/analytics/events/:name
 */
app.get('/analytics/events/:name', async (c) => {
  try {
    const eventName = c.req.param('name');
    const days = parseInt(c.req.query('days') || '7', 10);
    
    const count = await getEventCount(c.env.DB, eventName, days);
    
    return c.json({
      event_name: eventName,
      count,
      period_days: days,
    });
  } catch (error) {
    console.error('Error fetching event count:', error);
    return c.json({
      error: 'Failed to fetch event count',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default app;
