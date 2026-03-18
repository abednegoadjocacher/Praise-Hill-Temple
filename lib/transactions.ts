import pool from '@/lib/db';
import { Transaction } from '@/interface';
import { ResultSetHeader } from 'mysql2/promise';

export async function createTransaction(t: Omit<Transaction, 'id'>) {
  const [result] = await pool.execute(
    `INSERT INTO transactions 
    (memberId, date, time, member, phone, type, amount, method, status, month, paymentDate) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t.memberId,
      t.date, 
      t.time, 
      t.member,
      t.phone, 
      t.type, 
      t.amount, 
      t.method, 
      t.status, 
      t.month, 
      t.paymentDate
    ]
  );
  return (result as ResultSetHeader).insertId;
}

export async function getAllTransactions() {
  // We explicitly select everything. 
  // ensure your frontend knows to look for 'member_name' or 'member' 
  // depending on how you mapped it in the interface.
  const [rows] = await pool.execute('SELECT * FROM transactions ORDER BY id DESC');
  return rows;
}