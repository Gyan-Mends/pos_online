// CORS utility for API routes
export const ALLOWED_ORIGINS = [
  'https://e-qf49728fj-gyanmends-projects.vercel.app', // Your frontend domain
  'https://e-com-omega-sage.vercel.app', // Your new frontend domain
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local development
  process.env.FRONTEND_URL, // Environment variable for dynamic domains
].filter(Boolean); // Remove undefined values

export function addCorsHeaders(response: Response, origin?: string): Response {
  const headers = new Headers(response.headers);
  
  // Check if origin is allowed
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') || // Allow all localhost
    origin.includes('127.0.0.1'); // Allow all 127.0.0.1
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function handlePreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || 
    origin.includes('localhost') || 
    origin.includes('127.0.0.1');
  
  const headers = new Headers();
  
  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Max-Age', '86400');
  
  return new Response(null, { status: 200, headers });
}

// Helper function to wrap API responses with CORS
export function corsResponse(data: any, options: ResponseInit = {}, request?: Request): Response {
  const response = new Response(
    typeof data === 'string' ? data : JSON.stringify(data),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }
  );
  
  const origin = request?.headers.get('Origin');
  return addCorsHeaders(response, origin || undefined);
}