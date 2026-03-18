import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Ensure this points to your database connection file
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// 1. GET: Fetch all members
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM members ORDER BY firstName ASC');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// 2. POST: Add a new member
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, middleName, lastName, phone, firstFruitNumber } = body;

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO members (firstName, middleName, lastName, phone, firstFruitNumber) VALUES (?, ?, ?, ?, ?)',
      [firstName, middleName || '', lastName, phone, firstFruitNumber || '']
    );

    return NextResponse.json({ id: result.insertId, ...body });
  } catch (error) {
    return NextResponse.json({ error: 'Error adding member' }, { status: 500 });
  }
}

// 3. PUT: Update an existing member (The logic you asked for)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, firstName, middleName, lastName, phone, firstFruitNumber } = body;

    // Validation: ID is required to know who to update
    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    // Execute the Update
    await pool.execute(
      `UPDATE members 
       SET firstName = ?, middleName = ?, lastName = ?, phone = ?, firstFruitNumber = ? 
       WHERE id = ?`,
      [firstName, middleName || '', lastName, phone, firstFruitNumber || '', id]
    );

    return NextResponse.json({ success: true, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update Error:', error);
    return NextResponse.json({ error: 'Error updating member' }, { status: 500 });
  }
}

// 4. DELETE: Remove a member
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM members WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting member' }, { status: 500 });
  }
}