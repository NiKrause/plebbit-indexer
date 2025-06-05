import { getDb } from './db.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

let openai;
if (process.env.OPENROUTER_API_KEY) {
openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://plebscan.com',
      'X-Title': process.env.SITE_NAME || 'PlebScan.com',
    },
  });
}

// Prompt for detecting problematic content
const MODERATION_PROMPT = `
You are a content moderation assistant tasked with analyzing text for the following categories of problematic content:

1. Hate Speech: Content that attacks, threatens, or demeans individuals or groups based on attributes such as race, ethnicity, nationality, religion, gender, sexual orientation, disability, or other identity characteristics.

2. Violence: Content that calls for violence, glorifies violence, contains detailed depictions of violence, or is created with the intent to cause harm.

3. Copyright Violations: Content that reproduces copyrighted material without permission, such as full articles, books, films, music, or other creative works.

Analyze the following text and categorize it into one of these categories:
- SAFE: The content does not violate any of the above categories
- HATE_SPEECH: The content contains hate speech
- VIOLENCE: The content contains depictions of violence or calls to violence
- COPYRIGHT: The content likely violates copyright
- MULTIPLE: The content violates multiple categories above

Qualify the harm of the content in a scale of 1 to 10, 1 being the least harmful and 10 being the most harmful.
Return a JSON object with the following format:
{
  "category": "SAFE",
  "reason": "The content does not violate any of the above categories"
  "harm": 1
}
Text to analyze:
`;

/**
 * Analyzes a post's content for problematic material
 * @param {string} content - The content of the post
 * @returns {Promise<string>} - The category of the problematic content or "SAFE"
 */
async function analyzeContent(content) {
  // Combine the prompt with the content
  const prompt = MODERATION_PROMPT + content;
  const validResponses = ['SAFE', 'HATE_SPEECH', 'VIOLENCE', 'COPYRIGHT', 'MULTIPLE', '**SAFE**', '**HATE_SPEECH**', '**VIOLENCE**', '**COPYRIGHT**', '**MULTIPLE**'];
  
  // Helper function to normalize responses (remove asterisks)
  const normalizeResponse = (response) => {
    return response.replace(/\*/g, '');
  };
  
  // Helper function to get response from a model
  const getModelResponse = async (modelName) => {
    try {
      console.log(`Attempting content analysis with model: ${modelName}`);
      
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10,
      });
  
      const response = completion.choices[0].message.content.trim();
      const category = normalizeResponse(response.category);
      if (validResponses.includes(response.category)) {
        console.log(`Valid response from model ${modelName}: ${response}`);
        return { success: true, response: category, harm: response.harm, reason: response.reason, category: response.category};
      } else {
        console.error(`Unexpected response from model ${modelName}: ${response}`);
        return { success: false, error: `Invalid response: ${response}` };
      }
    } catch (error) {
      // Check if it's a rate limit error
      if (error.status === 429 || error.message?.includes('rate limit')) {
        // Extract retry information from headers or error response
        const retryAfter = error.headers?.['retry-after'] || 
                          error.response?.headers?.['retry-after'] || 
                          error.retryAfter;
        
        const retryTimestamp = retryAfter ? 
          (typeof retryAfter === 'string' ? parseInt(retryAfter) : retryAfter) * 1000 + Date.now() : 
          Date.now() + 60000; // Default to 1 minute if no retry info
        
        console.error(`Rate limit exceeded for model ${modelName}. Retry after: ${new Date(retryTimestamp).toISOString()}`);
        
        return { 
          success: false, 
          error: error.message,
          isRateLimit: true,
          retryAfter: retryTimestamp
        };
      }
      
      console.error(`Error with model ${modelName}: ${error.message}`);
      return { success: false, error: error.message };
    }
  };
  
  // Get model names from environment variables with fallbacks
  const modelA = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';
  const modelB = process.env.OPENROUTER_MODEL_B || modelA;
  const modelC = process.env.OPENROUTER_MODEL_C || modelB;
  
  // Step 1: Get response from Model A
  const resultA = await getModelResponse(modelA);
  
  // If Model A failed due to rate limit, wait and retry
  if (!resultA.success && resultA.isRateLimit) {
    const waitTime = resultA.retryAfter - Date.now();
    if (waitTime > 0) {
      console.log(`Waiting ${waitTime}ms before retrying Model A due to rate limit`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return analyzeContent(content); // Retry the entire process
    }
  }
  
  // If Model A failed for other reasons, try Model B
  if (!resultA.success) {
    console.log(`Model A (${modelA}) failed, trying Model B (${modelB})`);
    const resultB = await getModelResponse(modelB);
    
    // If Model B failed due to rate limit, wait and retry
    // if (!resultB.success && resultB.isRateLimit) {
    //   const waitTime = resultB.retryAfter - Date.now();
    //   if (waitTime > 0) {
    //     console.log(`Waiting ${waitTime}ms before retrying Model B due to rate limit`);
    //     await new Promise(resolve => setTimeout(resolve, waitTime));
    //     return analyzeContent(content); // Retry the entire process
    //   }
    // }
    
    // If Model B also failed, try Model C
    if (!resultB.success) {
      console.log(`Model B (${modelB}) also failed, trying Model C (${modelC})`);
      const resultC = await getModelResponse(modelC);
      
      // If Model C failed due to rate limit, wait and retry
      // if (!resultC.success && resultC.isRateLimit) {
      //   const waitTime = resultC.retryAfter - Date.now();
      //   if (waitTime > 0) {
      //     console.log(`Waiting ${waitTime}ms before retrying Model C due to rate limit`);
      //     await new Promise(resolve => setTimeout(resolve, waitTime));
      //     return analyzeContent(content); // Retry the entire process
      //   }
      // }
      
      if (resultC.success) {
        console.log(`Using result from Model C: ${resultC.response}`);
        return resultC.response;
      } else {
        console.error('All models failed to provide a valid response');
        return 'UNKNOWN';
      }
    } else {
      console.log(`Using result from Model B: ${resultB.response}`);
      return resultB.response;
    }
  }
  
  // If Model A succeeded, verify with Model B
  console.log(`Model A (${modelA}) succeeded, verifying with Model B (${modelB})`);
  const resultB = await getModelResponse(modelB);
  
  // If Model B failed, try Model C
  if (!resultB.success) {
    console.log(`Model B (${modelB}) failed, trying Model C (${modelC})`);
    const resultC = await getModelResponse(modelC);
    
    if (resultC.success) {
      console.log(`Using result from Model C: ${resultC.response}`);
      return resultC.response;
    } else {
      // If Model C also failed, use result from Model A
      console.log(`Model C (${modelC}) also failed, using result from Model A: ${resultA.response}`);
      return resultA.response;
    }
  }
  
  // If Models A and B disagree, use Model C as tiebreaker
  console.log(`Models A and B disagree (A: ${resultA.response}, B: ${resultB.response}), using Model C (${modelC}) as tiebreaker`);
  const resultC = await getModelResponse(modelC);
  
  if (resultC.success) {
    console.log(`Using tiebreaker result from Model C: ${resultC.response}`);
    return resultC.response;
  } else {
    // If Model C failed, use majority vote or Model A's result
    if (resultA.response === resultB.response) {
      return resultA.response;
    } else {
      console.log(`Tiebreaker failed, defaulting to Model A's result: ${resultA.response}`);
      return resultA.response;
    }
  }
}

/**
 * Copies a post from posts table to flagged_posts table does not delete the post from posts table yet
 * @param {object} db - Database instance
 * @param {string} postId - The ID of the post to flag
 * @param {string} flagReason - The reason for flagging
 * @returns {boolean} - Whether the operation was successful
 */
export async function flagPost(db, postId, flagReason) {
  try {
    const transaction = db.transaction(() => {
      // Get the post data
      const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
      
      if (!post) {
        console.error(`Post with ID ${postId} not found`);
        return false;
      }
      
      // Insert into flagged_posts
      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO flagged_posts (
          id, timestamp, title, content, subplebbitAddress, 
          authorAddress, authorDisplayName, upvoteCount, downvoteCount, 
          replyCount, parentCid, postCid, depth, harm, reason, category, flagged_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run(
        post.id,
        post.timestamp,
        post.title,
        post.content,
        post.subplebbitAddress,
        post.authorAddress,
        post.authorDisplayName,
        post.upvoteCount,
        post.downvoteCount,
        post.replyCount,
        post.parentCid,
        post.postCid,
        post.depth,
        null, // harm - will be filled by AI analysis
        flagReason,
        null, // category - will be filled by AI analysis
        Date.now(),
        'pending'
      );
      
      // Delete from posts
      // const deleteStmt = db.prepare('DELETE FROM posts WHERE id = ?');
      // deleteStmt.run(postId);
    });
    
    transaction();
    console.log(`Post ${postId} flagged as ${flagReason} and moved to flagged_posts table`);
    return true;
  } catch (error) {
    console.error(`Error flagging post ${postId}:`, error);
    return false;
  }
}

/**
 * Processes posts for content moderation
 * @param {number} batchSize - Number of posts to process in one batch
 * @returns {Promise<{processed: number, flagged: number}>} - Statistics about the operation
 */
export async function moderatePosts(batchSize = 100) {
  const db = getDb();
  const stats = { processed: 0, flagged: 0 };
  
  try {
    // Get posts to analyze - only fetch unmoderated posts
    const posts = db.prepare(`
      SELECT id, content, title FROM posts 
      WHERE moderated_at IS NULL
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(batchSize);
    
    console.log(`Moderating ${posts.length} posts...`);
    
    for (const post of posts) {
      stats.processed++;
      
      // Skip posts with no content
      if (!post.content && !post.title) {
        // Mark empty posts as moderated to avoid rechecking them
        db.prepare('UPDATE posts SET moderated_at = ? WHERE id = ?').run(Date.now(), post.id);
        continue;
      }
      
      // Analyze the content (combine title and content if both exist)
      const contentToAnalyze = post.title 
        ? `${post.title}\n\n${post.content || ''}`
        : post.content;
      
      const result = await analyzeContent(contentToAnalyze);
      console.log(`Post ${post.id} analyzed: ${result}`);
    
      // Flag posts with problematic content
      if (result !== 'SAFE' && result!=='**SAFE**' && result !== 'ERROR' && result !== 'UNKNOWN') {
        await flagPost(db, post.id, result);
        stats.flagged++;
      }
      
      // Mark the post as moderated
      db.prepare('UPDATE posts SET moderated_at = ? WHERE id = ?').run(Date.now(), post.id);
      
      // Log progress
      if (stats.processed % 10 === 0) {
        console.log(`Processed ${stats.processed}/${posts.length} posts, flagged ${stats.flagged}`);
      }
    }
    
    console.log(`Content moderation complete. Processed: ${stats.processed}, Flagged: ${stats.flagged}`);
    return stats;
  } catch (error) {
    console.error('Error in content moderation process:', error);
    return stats;
  }
}

/**
 * Starts a scheduled content moderation process
 * @param {number} intervalMinutes - Interval in minutes between moderation runs
 */
export function startContentModerationScheduler(intervalMinutes = 30) {
  // Run immediately on startup
  moderatePosts(50).catch(err => console.error('Error in initial moderation run:', err));
  
  // Schedule regular runs
  const intervalMs = intervalMinutes * 60 * 1000;
  setInterval(() => {
    moderatePosts(50).catch(err => console.error('Error in scheduled moderation run:', err));
  }, intervalMs);
  
  console.log(`Content moderation scheduler started, running every ${intervalMinutes} minutes`);
}