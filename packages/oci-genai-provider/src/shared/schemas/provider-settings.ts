/**
 * Zod schemas for OCI GenAI Provider settings validation
 *
 * Following Zod best practices:
 * - schema-use-enums: Using z.enum for fixed string values
 * - type-use-z-infer: Using z.infer for type derivation
 * - error-custom-messages: Providing custom error messages
 * - parse-use-safeparse: Exposing safeParse for user input
 *
 * OCI OCID Format Reference:
 * - Format: ocid1.<resource-type>.<realm>.[region.]<unique-id>
 * - Example: ocid1.compartment.oc1..aaaaaaaxxxxxxx
 */
import { z } from 'zod';

/**
 * OCI resource identifier pattern (OCID)
 * Format: ocid1.<resource-type>.<realm>.[region.]<unique-id>
 */
const ocidPattern = /^ocid1\.[a-z0-9]+\.[a-z0-9]+\.[a-z0-9-]*\.[a-z0-9]+$/i;

/**
 * OCI region identifier pattern
 * Format: <geo>-<city>-<number> (e.g., us-chicago-1, eu-frankfurt-1)
 * See: https://docs.oracle.com/en-us/iaas/Content/General/Concepts/regions.htm
 */
const regionPattern = /^[a-z]{2,3}-[a-z]+-\d+$/;

/**
 * Schema for OCI compartment ID
 */
export const CompartmentIdSchema = z
  .string()
  .regex(ocidPattern, {
    message: 'Invalid compartment ID format. Expected OCID format: ocid1.compartment.oc1..xxxxx',
  })
  .describe('The compartment OCID for OCI GenAI requests');

/**
 * Schema for OCI region identifier
 */
export const RegionSchema = z
  .string()
  .regex(regionPattern, {
    message: 'Invalid region format. Expected format: <geo>-<city>-<number> (e.g., us-chicago-1)',
  })
  .describe('The OCI region identifier');

/**
 * Schema for OCI config profile name
 */
export const ConfigProfileSchema = z
  .string()
  .min(1, { message: 'Config profile cannot be empty' })
  .default('DEFAULT')
  .describe('The OCI config profile name from ~/.oci/config');

/**
 * Schema for serving mode
 * OCI GenAI supports on-demand (shared) and dedicated AI clusters
 */
export const ServingModeSchema = z
  .enum(['on-demand', 'dedicated'], {
    errorMap: () => ({ message: "Serving mode must be either 'on-demand' or 'dedicated'" }),
  })
  .default('on-demand')
  .describe('The serving mode for model inference');

/**
 * Schema for endpoint ID (used with dedicated serving mode)
 */
export const EndpointIdSchema = z
  .string()
  .regex(ocidPattern, {
    message:
      'Invalid endpoint ID format. Expected OCID format: ocid1.generativeaiendpoint.oc1..xxxxx',
  })
  .describe('The endpoint OCID for dedicated serving mode');

/**
 * Schema for OCI GenAI provider settings
 */
export const OCIProviderSettingsSchema = z
  .object({
    compartmentId: CompartmentIdSchema.optional(),
    region: RegionSchema.optional(),
    configProfile: ConfigProfileSchema.optional(),
    servingMode: ServingModeSchema.optional(),
    endpointId: EndpointIdSchema.optional(),
  })
  .refine(
    (data) => {
      // If servingMode is 'dedicated', endpointId should be provided
      if (data.servingMode === 'dedicated' && !data.endpointId) {
        return false;
      }
      return true;
    },
    {
      message: "endpointId is required when servingMode is 'dedicated'",
      path: ['endpointId'],
    }
  )
  .describe('Configuration settings for the OCI GenAI provider');

/**
 * Type inferred from the schema (input - before transforms)
 */
export type OCIProviderSettingsInput = z.input<typeof OCIProviderSettingsSchema>;

/**
 * Type inferred from the schema (output - after transforms/defaults)
 */
export type OCIProviderSettingsValidated = z.output<typeof OCIProviderSettingsSchema>;

/**
 * Validate provider settings with safeParse (returns success/error, doesn't throw)
 */
export function validateProviderSettings(settings: unknown) {
  return OCIProviderSettingsSchema.safeParse(settings);
}

/**
 * Parse provider settings (throws on validation failure)
 */
export function parseProviderSettings(settings: unknown): OCIProviderSettingsValidated {
  return OCIProviderSettingsSchema.parse(settings);
}

/**
 * Schema for model ID validation
 * Supports both on-demand model IDs and dedicated endpoint OCIDs
 */
export const ModelIdSchema = z
  .string()
  .min(1, { message: 'Model ID cannot be empty' })
  .describe('The model ID or endpoint OCID');

/**
 * Schema for chat model options
 */
export const OCIChatModelIdSchema = z.object({
  modelId: ModelIdSchema,
  isDedicatedEndpoint: z.boolean().optional().default(false),
});

export type OCIChatModelId = z.infer<typeof OCIChatModelIdSchema>;
