import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    // We format the date so the HTML input can read it correctly
    const [rows] = await pool.query(`
        SELECT id, name, category, DATE_FORMAT(purchaseDate, '%Y-%m-%d') as purchaseDate, 
        purchaseValue, currentValue, conditionStatus as \`condition\`, location, description, quantity 
        FROM assets ORDER BY id DESC
    `);
    return NextResponse.json(rows);
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Destructure all fields
    const { 
      id, 
      name, 
      category, 
      purchaseDate, 
      purchaseValue, 
      currentValue, 
      condition, 
      location, 
      description, 
      quantity 
    } = body;

    // SANITIZE NUMBERS: If it's blank or undefined, set to a valid number/null
    // purchaseValue || 0 ensures it's never undefined
    const cleanPurchaseValue = parseFloat(purchaseValue) || 0;
    
    // If currentValue is empty, use the purchaseValue as the default
    const cleanCurrentValue = (currentValue === undefined || currentValue === null || isNaN(parseFloat(currentValue))) 
      ? cleanPurchaseValue 
      : parseFloat(currentValue);

    const cleanQuantity = parseInt(quantity) || 1;
    const cleanDescription = description || null;

    if (id) {
      // UPDATE EXISTING
      await pool.execute(
        'UPDATE assets SET name=?, category=?, purchaseDate=?, purchaseValue=?, currentValue=?, conditionStatus=?, location=?, description=?, quantity=? WHERE id=?',
        [name, category, purchaseDate, cleanPurchaseValue, cleanCurrentValue, condition, location, cleanDescription, cleanQuantity, id]
      );
      return NextResponse.json({ success: true });
    } else {
      // CREATE NEW
      const [result]: any = await pool.execute(
        'INSERT INTO assets (name, category, purchaseDate, purchaseValue, currentValue, conditionStatus, location, description, quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          name, 
          category, 
          purchaseDate, 
          cleanPurchaseValue, 
          cleanCurrentValue, 
          condition, 
          location, 
          cleanDescription, 
          cleanQuantity
        ]
      );
      return NextResponse.json({ id: result.insertId });
    }
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM assets WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
  }
}

