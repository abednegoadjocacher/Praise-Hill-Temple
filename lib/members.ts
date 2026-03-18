import db from '@/lib/db' // Your connection pool from the previous step
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Member } from '@/interface';
import pool from '@/lib/db';


// 2. FUNCTION TO ADD NEW MEMBER
export async function createMember(member: Omit<Member, 'id'>): Promise<number> {
  const { firstName, middleName, lastName, phone, firstFruitNumber } = member;

  const query = `
    INSERT INTO members 
    (firstName, middleName, lastName, phone, firstFruitNumber) 
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.execute<ResultSetHeader>(query, [
    firstName,
    middleName,
    lastName,
    phone,
    firstFruitNumber || null // Send null if undefined
  ]);

  return result.insertId;
}

// 3. FUNCTION TO UPDATE EXISTING MEMBER
export async function updateMember(member: Member): Promise<boolean> {
  const { id, firstName, middleName, lastName, phone, firstFruitNumber } = member;

  const query = `
    UPDATE members 
    SET firstName = ?, 
        middleName = ?, 
        lastName = ?, 
        phone = ?, 
        firstFruitNumber = ?
    WHERE id = ?
  `;

  const [result] = await db.execute<ResultSetHeader>(query, [
    firstName,
    middleName,
    lastName,
    phone,
    firstFruitNumber || null,
    id
  ]);

  // Returns true if a row was actually found and updated
  return result.affectedRows > 0;
}

export async function getAllMembers(): Promise<Member[]> {
  const query = `
    SELECT 
      id, 
      firstName, 
      middleName, 
      lastName, 
      phone, 
      firstFruitNumber,
      updatedAt
    FROM members
    ORDER BY updatedAt DESC
  `;

  const [rows] = await pool.query<RowDataPacket[]>(query);
  return rows as Member[];
}

// 4. FUNCTION TO DELETE A MEMBER
export async function deleteMember(id: number): Promise<boolean> {
  const query = 'DELETE FROM members WHERE id = ?';
  const [result] = await pool.execute<ResultSetHeader>(query, [id]);
  return result.affectedRows > 0;
}