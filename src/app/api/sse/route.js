import { headers } from 'next/headers';

// Global connection storage
const connections = new Map();

// Debug mode
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log(`[SSE ${new Date().toISOString()}]`, ...args);
  }
}

// Counter for generating unique IDs
let connectionCounter = 0;

// Get connection stats
function getConnectionStats() {
  let stats = {};
  let total = 0;
  
  connections.forEach((clients, slug) => {
    stats[slug] = clients.size;
    total += clients.size;
  });
  
  return { bySlug: stats, total };
}

/**
 * Broadcast a message to all clients subscribed to a specific slug
 */
export function broadcastUpdate(message, targetSlug = null) {
  try {
    if (!targetSlug) {
      debugLog(`No target slug provided for broadcast`);
      return { success: false, reason: 'No target slug provided' };
    }
    
    // Get clients for this slug
    const clients = connections.get(targetSlug) || new Map();
    const clientCount = clients.size;
    
    debugLog(`Broadcasting to ${targetSlug} (${clientCount} connections)`);
    
    if (clientCount === 0) {
      debugLog(`No clients connected for ${targetSlug}`);
      return { success: true, sent: 0, total: 0 };
    }
    
    // Format the message for SSE
    const formattedMessage = JSON.stringify({
      ...message,
      _broadcast: {
        timestamp: new Date().toISOString(),
        targetSlug
      }
    });
    
    const sseMessage = `data: ${formattedMessage}\n\n`;
    
    // Track success/failure
    let successCount = 0;
    let errorCount = 0;
    
    // Send to all clients
    clients.forEach((controller, id) => {
      try {
        controller.enqueue(sseMessage);
        successCount++;
        debugLog(`Sent message to client ${id}`);
      } catch (err) {
        errorCount++;
        debugLog(`Failed to send to client ${id}: ${err.message}`);
        clients.delete(id);
      }
    });
    
    // Log results
    debugLog(`Broadcast complete: ${successCount} successful, ${errorCount} failed`);
    
    return {
      success: true,
      sent: successCount,
      failed: errorCount,
      total: clientCount
    };
  } catch (error) {
    debugLog(`Error during broadcast: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * SSE endpoint handler
 */
export async function GET(request) {
  // Get query params
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generate connection ID
  const connId = `conn-${connectionCounter++}`;
  debugLog(`New connection request: ${connId} for ${slug}`);
  
  try {
    // Set up stream
    const stream = new ReadableStream({
      start(controller) {
        // Create slug entry if it doesn't exist
        if (!connections.has(slug)) {
          connections.set(slug, new Map());
        }
        
        // Store the connection
        connections.get(slug).set(connId, controller);
        
        // Log connection
        const stats = getConnectionStats();
        debugLog(`Connection ${connId} established. Active: ${stats.bySlug[slug]} for ${slug}, ${stats.total} total`);
        
        // Send initial connection message
        const initialMessage = JSON.stringify({
          type: 'connection',
          status: 'connected',
          connectionId: connId,
          timestamp: new Date().toISOString(),
          stats: getConnectionStats()
        });
        
        controller.enqueue(`data: ${initialMessage}\n\n`);
        
        // Set up keepalive interval
        const keepaliveInterval = setInterval(() => {
          try {
            controller.enqueue(`:keepalive ${new Date().toISOString()}\n\n`);
          } catch (error) {
            debugLog(`Error sending keepalive to ${connId}: ${error.message}`);
            clearInterval(keepaliveInterval);
            
            // Clean up connection
            if (connections.has(slug)) {
              connections.get(slug).delete(connId);
              if (connections.get(slug).size === 0) {
                connections.delete(slug);
              }
            }
          }
        }, 15000);
        
        // Handle connection close
        request.signal.addEventListener('abort', () => {
          debugLog(`Connection ${connId} closed`);
          clearInterval(keepaliveInterval);
          
          // Clean up connection
          if (connections.has(slug)) {
            connections.get(slug).delete(connId);
            if (connections.get(slug).size === 0) {
              connections.delete(slug);
            }
          }
          
          // Log remaining connections
          const stats = getConnectionStats();
          debugLog(`Connection removed. Remaining: ${stats.bySlug[slug] || 0} for ${slug}, ${stats.total} total`);
        });
      }
    });
    
    // Return with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    debugLog(`Error setting up SSE: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 