import { NextResponse } from 'next/server';
import { createTransaction, getAllTransactions } from '@/lib/transactions';

export async function GET() {
  try {
    const data = await getAllTransactions();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = await createTransaction(body);
    return NextResponse.json({ id, message: 'Transaction recorded' }, { status: 201 });
  } catch (error) {
    console.error('Transaction Error:', error);
    return NextResponse.json({ error: 'Failed to save transaction' }, { status: 500 });
  }
}
