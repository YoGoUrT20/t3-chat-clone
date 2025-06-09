import * as z from 'zod';

export const formSchema = z
  .object({
    images: z.array(z.instanceof(File)).optional(),
    prompt: z.string().optional(),
    condition_mode: z.enum(['concat', 'fuse']).default('concat'),
    quality: z.enum(['high', 'medium', 'low', 'extra-low']).default('medium'),
    geometry_file_format: z.enum(['glb', 'usdz', 'fbx', 'obj', 'stl']).default('glb'),
    use_hyper: z.boolean().default(false),
    tier: z.enum(['Regular', 'Sketch']).default('Regular'),
    TAPose: z.boolean().default(false),
    material: z.enum(['PBR', 'Shaded']).default('PBR'),
  })
  .refine(
    (data) => {
      return (data.images && data.images.length > 0) || (data.prompt && data.prompt.length > 0);
    },
    {
      message: 'You must provide either images or a prompt',
      path: ['prompt'],
    },
  );

/**
 * @typedef {z.infer<typeof formSchema>} FormValues
 */ 