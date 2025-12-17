
import { supabase } from './supabase';

export interface UploadResult {
    path: string;
    fullPath: string;
    id: string; // Attachment ID in the database
    publicUrl: string;
    fileName: string;
}

/**
 * Uploads a file to Supabase Storage and records it in the database.
 * @param file The file object to upload
 * @param userId The ID of the authenticated user
 * @param requestId Optional request ID if known (can be null)
 */
export async function uploadAttachment(
    file: File,
    userId: string,
    requestId: string | null = null
): Promise<UploadResult> {

    // 1. Sanitize filename
    const fileExt = file.name.split('.').pop();
    const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // 2. Upload to Storage Bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('request_attachments')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (uploadError) {
        throw new Error(`Storage error: ${uploadError.message}`);
    }

    // 3. Insert metadata into request_attachments table
    const { data: dbData, error: dbError } = await supabase
        .from('request_attachments')
        .insert({
            user_id: userId,
            request_id: requestId, // Can be null
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
        })
        .select()
        .single();

    if (dbError) {
        // Optional: Attempt to clean up the uploaded file if DB insert fails
        console.error('DB Insert error, orphaned file:', filePath);
        throw new Error(`Database error: ${dbError.message}`);
    }

    // 4. Get Public URL (Signed URL if private, but let's assume valid scope)
    // For admin display, we'll use signed URLs later. For now, we return the path.
    // NOTE: request_attachments is private, so getPublicUrl might return a URL 
    // but it won't be accessible without a token. We'll return the path mostly.

    const { data: { publicUrl } } = supabase.storage
        .from('request_attachments')
        .getPublicUrl(filePath);

    return {
        path: filePath,
        fullPath: uploadData.path,
        id: dbData.id,
        publicUrl,
        fileName: file.name
    };
}
