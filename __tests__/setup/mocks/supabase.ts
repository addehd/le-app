import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

export const handlers = [
  // Mock Supabase REST API - property_links table
  http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
    return HttpResponse.json([
      {
        id: 'test-id-1',
        url: 'https://example.com/property-1',
        title: 'Test Property 1',
        sharedBy: 'user-123',
        sharedAt: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/property_links`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: crypto.randomUUID(),
      ...body,
      sharedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${SUPABASE_URL}/rest/v1/property_links`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  http.patch(`${SUPABASE_URL}/rest/v1/property_links`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body);
  }),

  // Mock Supabase Auth endpoints
  http.post(`${SUPABASE_URL}/auth/v1/token`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'mock-user-id',
        email: (body as any)?.email || 'test@example.com',
      },
    });
  }),

  http.get(`${SUPABASE_URL}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
    });
  }),
];

export const server = setupServer(...handlers);
