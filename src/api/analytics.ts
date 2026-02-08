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
import { errorResponse, ErrorCode, validationError, serverError } from '@/lib/errors';

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
      return validationError(c, validated.error.issues);
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
      data: { id },
    }, 201);
  } catch (error) {
    return serverError(c, error);
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
      return validationError(c, validated.error.issues);
    }
    
    // Insert analytics event
    const id = await insertAnalyticsEvent(c.env.DB, validated.data);
    
    return c.json({
      data: { id },
    }, 201);
  } catch (error) {
    return serverError(c, error);
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
      data: {
        period_days: days,
        top_pages: topPages,
        top_events: topEvents,
      },
    });
  } catch (error) {
    return serverError(c, error);
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
      data: {
        path: `/${path}`,
        views: count,
        period_days: days,
      },
    });
  } catch (error) {
    return serverError(c, error);
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
      data: {
        event_name: eventName,
        count,
        period_days: days,
      },
    });
  } catch (error) {
    return serverError(c, error);
  }
});

export default app;
