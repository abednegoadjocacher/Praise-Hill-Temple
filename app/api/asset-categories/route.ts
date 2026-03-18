import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Ensure your DB connection file exists

export async function GET() {
    const [rows] = await pool.query('SELECT * FROM asset_categories ORDER BY name ASC');
    return NextResponse.json(rows);
}

export async function POST(request: Request) {
    const { name, code } = await request.json();
    const [result]: any = await pool.execute(
        'INSERT INTO asset_categories (name, code) VALUES (?, ?)',
        [name, code]
    );
    return NextResponse.json({ id: result.insertId, name, code });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Safety Check: Make sure an ID actually exists
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Run the deletion
    await pool.execute('DELETE FROM asset_categories WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Database Error:", error);
    // This catches issues like trying to delete a category that is still linked to assets
    return NextResponse.json(
      { error: 'Could not delete category. Check if it is still being used by assets.' }, 
      { status: 500 }
    );
  }
}
