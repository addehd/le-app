import { Resend } from 'resend';
import { supabase } from '../../../lib/api/supabaseClient';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPropertiesRequest {
  recipientEmail: string;
  userId: string;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body: SendPropertiesRequest = await request.json();
    const { recipientEmail, userId } = body;

    // Validate inputs
    if (!recipientEmail || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: recipientEmail and userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidEmail(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stub implementation: log inputs and return success
    console.log('📧 Email send request:', { recipientEmail, userId });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email functionality will be implemented in Task 2'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-properties API:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
