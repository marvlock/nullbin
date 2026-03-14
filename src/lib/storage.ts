import { getPastesCollection, initializeDatabase } from './mongodb'
import { generateId } from './utils'

export interface Paste {
  _id?: string // MongoDB ObjectId
  id: string
  title?: string
  content: string // encrypted content
  language: string
  createdAt: number
  expiresAt: Date | null // Changed to Date for MongoDB TTL
  iv: string // initialization vector for decryption
  salt?: string // salt for password-derived keys
  passwordProtected: boolean
  viewCount: number
}

export interface CreatePasteRequest {
  title?: string
  content: string // encrypted content
  language: string
  expiry: string
  password?: string
  iv: string
  salt?: string
}

export interface CreatePasteResponse {
  id: string
  url: string
}

export interface GetPasteResult {
  paste: Paste | null
  expired: boolean
  expiredAt?: Date
}

// Dev/runtime fallback when MongoDB is unavailable.
// This keeps the app functional locally but data is process-local and ephemeral.
const inMemoryPastes = new Map<string, Paste>()

async function getCollectionSafe() {
  try {
    return await getPastesCollection()
  } catch (error) {
    console.warn('MongoDB unavailable, using in-memory fallback storage:', error)
    return null
  }
}

// Initialize database on module load
initializeDatabase().catch(console.error)

export async function createPaste(data: CreatePasteRequest): Promise<string> {
  try {
    console.log('Starting paste creation process...');

    const collection = await getCollectionSafe()
    if (collection) {
      console.log('MongoDB connection successful, collection accessed')
    }
    const id = generateId()
    const now = Date.now()
    
    let expiresAt: Date | null = null
  switch (data.expiry) {
    case '1m':
      expiresAt = new Date(now + 1 * 60 * 1000)
      break
    case '5m':
      expiresAt = new Date(now + 5 * 60 * 1000)
      break
    case '10m':
      expiresAt = new Date(now + 10 * 60 * 1000)
      break
    case '15m':
      expiresAt = new Date(now + 15 * 60 * 1000)
      break
    case '30m':
      expiresAt = new Date(now + 30 * 60 * 1000)
      break
    case '45m':
      expiresAt = new Date(now + 45 * 60 * 1000)
      break
    case '1h':
      expiresAt = new Date(now + 60 * 60 * 1000)
      break
    case '3h':
      expiresAt = new Date(now + 3 * 60 * 60 * 1000)
      break
    case '6h':
      expiresAt = new Date(now + 6 * 60 * 60 * 1000)
      break
    case '12h':
      expiresAt = new Date(now + 12 * 60 * 60 * 1000)
      break
    case '1d':
      expiresAt = new Date(now + 24 * 60 * 60 * 1000)
      break
    case '3d':
      expiresAt = new Date(now + 3 * 24 * 60 * 60 * 1000)
      break
    case '7d':
      expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000)
      break
    case 'never':
    default:
      expiresAt = null
      break  }
    const paste: Omit<Paste, '_id'> = {
    id,
    title: data.title,
    content: data.content,
    language: data.language,
    createdAt: now,
    expiresAt,
    iv: data.iv,
    salt: data.salt,
    passwordProtected: !!data.password,
    viewCount: 0,
  }
  if (!collection) {
    inMemoryPastes.set(id, paste)
    console.log(`Paste created in fallback storage: ID "${id}"`)
    return id
  }

  try {
    console.log(`Attempting to insert paste with ID "${id}"...`)
    const result = await collection.insertOne(paste as Omit<Paste, '_id'>)

    if (!result.acknowledged) {
      console.error('MongoDB insert not acknowledged')
      throw new Error('Database operation failed: Insert not acknowledged')
    }

    console.log(`Paste created: ID "${id}" successfully created (MongoDB insertedId: ${result.insertedId})`)
    return id
  } catch (error) {
    console.error(`MongoDB insert error:`, error)
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`)
    }
    throw new Error(`Failed to create paste: ${error instanceof Error ? error.message : String(error)}`)
  }
  } catch (error) {
    console.error(`Paste creation error:`, error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, Message: ${error.message}, Stack: ${error.stack}`);
    }
    throw new Error(`Failed to create paste: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function getPaste(id: string): Promise<GetPasteResult> {
  const collection = await getCollectionSafe()

  const paste = collection
    ? await collection.findOne<Paste>({ id })
    : inMemoryPastes.get(id) || null
  if (!paste) {
    console.log(`Paste lookup: ID "${id}" - Not found in database`)
    return { paste: null, expired: false }
  }
  
  // Check if expired (additional check, though MongoDB TTL should handle this)
  if (paste.expiresAt) {
    // Handle both Date objects and timestamps (MongoDB might store as either)
    const expiryDate = paste.expiresAt instanceof Date ? paste.expiresAt : new Date(paste.expiresAt)
    const now = new Date()
    
    if (now > expiryDate) {
      const timeExpired = now.getTime() - expiryDate.getTime()
      const expiredAgo = timeExpired < 60000 ? `${Math.floor(timeExpired / 1000)}s ago` :
                        timeExpired < 3600000 ? `${Math.floor(timeExpired / 60000)}m ago` :
                        timeExpired < 86400000 ? `${Math.floor(timeExpired / 3600000)}h ago` :
                        `${Math.floor(timeExpired / 86400000)}d ago`
      
      console.log(`Paste expired: ID "${id}" - Expired ${expiredAgo} (${expiryDate.toISOString()}). Cleaning up...`)

      // Delete the expired paste
      if (collection) {
        await collection.deleteOne({ id })
      } else {
        inMemoryPastes.delete(id)
      }
      console.log(`Paste cleanup: ID "${id}" - Successfully removed from database`)
      return { paste: null, expired: true, expiredAt: expiryDate }
    }
    
    // Log successful access with expiration info
    const timeToExpiry = expiryDate.getTime() - now.getTime()
    const expiresIn = timeToExpiry < 60000 ? `${Math.floor(timeToExpiry / 1000)}s` :
                      timeToExpiry < 3600000 ? `${Math.floor(timeToExpiry / 60000)}m` :
                      timeToExpiry < 86400000 ? `${Math.floor(timeToExpiry / 3600000)}h` :
                      `${Math.floor(timeToExpiry / 86400000)}d`
    
    console.log(`Paste access: ID "${id}" - Valid, expires in ${expiresIn} (${expiryDate.toISOString()})`)
  } else {
    console.log(`Paste access: ID "${id}" - Valid, never expires`)
  }
  
  // Increment view count
  if (collection) {
    await collection.updateOne(
      { id },
      { $inc: { viewCount: 1 } }
    )
  } else {
    inMemoryPastes.set(id, { ...paste, viewCount: paste.viewCount + 1 })
  }
  
  // Return updated paste with incremented view count
  return { paste: { ...paste, viewCount: paste.viewCount + 1 }, expired: false }
}

export async function deletePaste(id: string): Promise<boolean> {
  const collection = await getCollectionSafe()
  if (!collection) {
    return inMemoryPastes.delete(id)
  }

  const result = await collection.deleteOne({ id })
  return result.deletedCount > 0
}

export async function getPasteCount(): Promise<number> {
  const collection = await getCollectionSafe()
  if (!collection) {
    return inMemoryPastes.size
  }
  return await collection.countDocuments()
}

// Helper function to clean up expired pastes manually (backup to TTL)
export async function cleanupExpiredPastes(): Promise<number> {
  const collection = await getCollectionSafe()

  console.log('Starting manual cleanup of expired pastes...')

  if (!collection) {
    let deleted = 0
    const now = Date.now()
    for (const [id, paste] of inMemoryPastes.entries()) {
      if (paste.expiresAt && now > new Date(paste.expiresAt).getTime()) {
        inMemoryPastes.delete(id)
        deleted += 1
      }
    }
    console.log(`Cleanup completed (fallback): ${deleted} expired pastes removed`)
    return deleted
  }

  // Find expired pastes first to log them
  const expiredPastes = await collection.find({
    expiresAt: { $ne: null, $lt: new Date() }
  }).toArray()

  if (expiredPastes.length > 0) {
    console.log(`Found ${expiredPastes.length} expired pastes to clean up:`)
    expiredPastes.forEach(paste => {
      const expiredAgo = Date.now() - new Date(paste.expiresAt).getTime()
      const timeAgo = expiredAgo < 60000 ? `${Math.floor(expiredAgo / 1000)}s ago` :
                      expiredAgo < 3600000 ? `${Math.floor(expiredAgo / 60000)}m ago` :
                      expiredAgo < 86400000 ? `${Math.floor(expiredAgo / 3600000)}h ago` :
                      `${Math.floor(expiredAgo / 86400000)}d ago`
      console.log(`  - Paste "${paste.id}" (expired ${timeAgo})`)
    })
  }

  const result = await collection.deleteMany({
    expiresAt: { $ne: null, $lt: new Date() }
  })

  console.log(`Cleanup completed: ${result.deletedCount} expired pastes removed`)
  return result.deletedCount
}
