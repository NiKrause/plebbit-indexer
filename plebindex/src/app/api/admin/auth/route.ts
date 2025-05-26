import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { authKey } = await request.json();
    
    // Validate against environment variable
    if (authKey !== process.env.PLEBBIT_AUTH_KEY) {
      return NextResponse.json(
        { error: 'Invalid authentication key' },
        { status: 401 }
      );
    }

    // Set cookie with auth token
    const cookieStore = cookies();
    cookieStore.set('plebbit_admin_auth', authKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 