import { NextRequest, NextResponse } from 'next/server'

// In-memory store for progress updates (in production, use Redis or similar)
const progressStore = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const { queryId, stage, status, data, error } = await request.json()
    
    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }
    
    // Store progress update
    progressStore.set(queryId, {
      stage,
      status,
      data,
      error,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Progress] Error updating progress:', error)
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const queryId = searchParams.get('queryId')
  
  if (!queryId) {
    return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
  }
  
  // Set up Server-Sent Events
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const event = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(event))
      }
      
      // Send initial connection message
      sendEvent({ type: 'connected', queryId })
      
      // Check for existing progress
      const existingProgress = progressStore.get(queryId)
      if (existingProgress) {
        sendEvent({ type: 'progress', ...existingProgress })
      }
      
      // Set up polling for updates (every 500ms)
      const interval = setInterval(() => {
        const progress = progressStore.get(queryId)
        if (progress) {
          sendEvent({ type: 'progress', ...progress })
        }
      }, 500)
      
      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
} 