import { query } from '../config/database.js'

export interface FileRecord {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_type?: string
  file_size?: number
  created_at: Date
}

export async function createFileRecord(
  userId: string,
  fileName: string,
  filePath: string,
  fileType?: string,
  fileSize?: number
): Promise<FileRecord> {
  const result = await query(
    `INSERT INTO files (user_id, file_name, file_path, file_type, file_size)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, fileName, filePath, fileType || null, fileSize || null]
  )

  return result.rows[0]
}

export async function getFileById(id: string): Promise<FileRecord | null> {
  const result = await query(
    `SELECT * FROM files WHERE id = $1`,
    [id]
  )
  return result.rows[0] || null
}

export async function deleteFile(id: string): Promise<void> {
  await query(`DELETE FROM files WHERE id = $1`, [id])
}
