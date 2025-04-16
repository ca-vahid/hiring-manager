import { NextRequest, NextResponse } from "next/server";
import { debug } from "@/app/lib/debug";

export async function GET(request: NextRequest) {
  // Get the URL parameter
  const url = request.nextUrl.searchParams.get("url");
  
  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }
  
  try {
    debug.info(`Proxy fetching: ${url}`);
    
    // Make the request from the server side (no CORS issues)
    const response = await fetch(url, {
      headers: {
        // Include minimal headers to avoid preflight issues
        "Accept": "*/*"
      }
    });
    
    if (!response.ok) {
      debug.error(`Proxy fetch failed: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    
    // Handle different response types
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // For text or binary content, return it as is
      const content = await response.text();
      return new NextResponse(content, {
        headers: {
          "content-type": contentType
        }
      });
    }
  } catch (error: any) {
    debug.error("Proxy error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch content" },
      { status: 500 }
    );
  }
} 