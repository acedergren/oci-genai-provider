import { ObjectStorageClient } from 'oci-objectstorage';
import { Region } from 'oci-common';
import type { OCIConfig } from '../../types';
import { createAuthProvider, getRegion } from '../../auth';

/**
 * Upload audio data to OCI Object Storage for transcription processing.
 * OCI Speech service requires audio files to be in Object Storage.
 *
 * @param config - OCI configuration with auth details
 * @param bucketName - Target bucket name
 * @param objectName - Object name/path in the bucket
 * @param audioData - Audio bytes to upload
 * @returns Object Storage URI for the uploaded file
 */
export async function uploadAudioToObjectStorage(
  config: OCIConfig,
  bucketName: string,
  objectName: string,
  audioData: Uint8Array
): Promise<{ namespaceName: string; bucketName: string; objectName: string }> {
  const authProvider = await createAuthProvider(config);
  const region = getRegion(config);

  const client = new ObjectStorageClient({
    authenticationDetailsProvider: authProvider,
  });
  client.region = Region.fromRegionId(region);

  // Get namespace for the tenancy
  const namespaceResponse = await client.getNamespace({});
  const namespaceName = namespaceResponse.value;

  // Upload the audio file
  await client.putObject({
    namespaceName,
    bucketName,
    objectName,
    putObjectBody: audioData,
    contentLength: audioData.byteLength,
    contentType: 'audio/wav',
  });

  return { namespaceName, bucketName, objectName };
}

/**
 * Delete an object from OCI Object Storage.
 * Used for cleanup after transcription completes.
 *
 * @param config - OCI configuration with auth details
 * @param namespaceName - Object Storage namespace
 * @param bucketName - Bucket name
 * @param objectName - Object name to delete
 */
export async function deleteFromObjectStorage(
  config: OCIConfig,
  namespaceName: string,
  bucketName: string,
  objectName: string
): Promise<void> {
  const authProvider = await createAuthProvider(config);
  const region = getRegion(config);

  const client = new ObjectStorageClient({
    authenticationDetailsProvider: authProvider,
  });
  client.region = Region.fromRegionId(region);

  await client.deleteObject({
    namespaceName,
    bucketName,
    objectName,
  });
}

/**
 * Generate a unique object name for audio uploads.
 * Format: audio-{timestamp}-{random}.wav
 */
export function generateAudioObjectName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `audio-${timestamp}-${random}.wav`;
}
