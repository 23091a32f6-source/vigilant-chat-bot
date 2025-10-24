import { pipeline, env } from '@huggingface/transformers';

// Configure to use local models (no external API calls needed)
env.allowLocalModels = true;
env.allowRemoteModels = true;

let classifierInstance: any = null;

export const initToxicityDetector = async () => {
  if (!classifierInstance) {
    try {
      console.log('Loading toxicity detection model...');
      classifierInstance = await pipeline(
        'text-classification',
        'Xenova/toxic-bert',
        { device: 'webgpu' }
      );
      console.log('Toxicity detection model loaded successfully');
    } catch (error) {
      console.error('Error loading model:', error);
      // Fallback to CPU if WebGPU fails
      classifierInstance = await pipeline(
        'text-classification',
        'Xenova/toxic-bert'
      );
      console.log('Toxicity detection model loaded on CPU');
    }
  }
  return classifierInstance;
};

export interface ToxicityResult {
  score: number;
  isToxic: boolean;
  severity: 'low' | 'medium' | 'high';
}

export const detectToxicity = async (text: string): Promise<ToxicityResult> => {
  try {
    const classifier = await initToxicityDetector();
    const result = await classifier(text);
    
    // Result is array with labels like "toxic" or "non-toxic" and scores
    const toxicResult = Array.isArray(result) ? result[0] : result;
    const isToxic = toxicResult.label === 'toxic';
    const score = isToxic ? toxicResult.score : 0;
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (score > 0.8) severity = 'high';
    else if (score > 0.5) severity = 'medium';
    
    return {
      score,
      isToxic,
      severity
    };
  } catch (error) {
    console.error('Error detecting toxicity:', error);
    // Return safe defaults on error
    return {
      score: 0,
      isToxic: false,
      severity: 'low'
    };
  }
};