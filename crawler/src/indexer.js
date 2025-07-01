import { isAuthorBlacklisted, isSubplebbitBlacklisted } from './db.js';

export async function indexPosts(db, posts) {
  console.log(`Indexing ${posts.length} posts/comments...`);
  try {
    let finalInsertedCount = 0;
    let finalSkippedCount = 0;

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO posts (id, timestamp, title, content, raw, subplebbitAddress, 
                           authorAddress, authorDisplayName, upvoteCount, downvoteCount, 
                           replyCount, parentCid, postCid, depth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let insertedCount = 0;
      let skippedCount = 0;
      
      for (const post of posts) {
        try {
          // Validate required fields
          if (!post.cid) {
            console.error('Skipping post: Missing required field cid');
            skippedCount++;
            continue;
          }
          
          // Validate all required fields before insertion
          const requiredFields = {
            timestamp: post.timestamp,
            // Title is only required for top-level posts (not for comments)
            title: post.parentCid ? undefined : post.title,
            subplebbitAddress: post.subplebbitAddress,
          };
          
          // Check if any required field is missing
          const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => value === undefined && key !== 'title')
            .map(([key]) => key);
          
          if (missingFields.length > 0) {
            console.error(`Skipping post ${post.cid}: Missing required fields: ${missingFields.join(', ')}`);
            skippedCount++;
            continue;
          }
          
          // Check if post is deindexed (we still want to index pending/ignored reports)
          const stmt = db.prepare(`
            SELECT COUNT(*) as count FROM flagged_posts 
            WHERE id = ? AND moderation_action IN ('deindex_comment', 'deindex_author', 'deindex_subplebbit')
          `);
          const isDeindexed = stmt.get(post.cid).count > 0;
          
          if (isDeindexed) {
            console.log(`Skipping deindexed post: ${post.cid}`);
            skippedCount++;
            continue;
          }

          // Check if author is blacklisted
          if (post.author?.address && isAuthorBlacklisted(db, post.author.address)) {
            console.log(`Skipping post from blacklisted author: ${post.author.address}`);
            skippedCount++;
            continue;
          }

          // Check if subplebbit is blacklisted
          if (isSubplebbitBlacklisted(db, post.subplebbitAddress)) {
            console.log(`Skipping post from blacklisted subplebbit: ${post.subplebbitAddress}`);
            skippedCount++;
            continue;
          }
          
          const deleteStmt = db.prepare('DELETE FROM posts where id = ?');
          deleteStmt.run(post.cid);
          
          insertStmt.run(
            post.cid,
            post.timestamp,
            post.title || null, // Title may be null for comments
            post.content,
            JSON.stringify(post.raw), // Use post.raw if it exists, otherwise fallback to JSON.stringify
            post.subplebbitAddress,
            post.author?.address,
            post.author?.displayName,
            post.upvoteCount ?? 0,
            post.downvoteCount ?? 0,
            post.replyCount ?? 0,
            post.parentCid, 
            post.postCid,  
            post.depth         // Depth (0 for posts, >0 for comments)
          );
          
          insertedCount++;
          
          if (insertedCount % 100 === 0 || insertedCount === 1) {
            console.log(`Indexed ${insertedCount} posts/comments so far...`);
          }
        } catch (error) {
          console.error(`Error processing post ${post?.cid || 'unknown'}:`, error);
          skippedCount++;
          // Continue with the next post instead of breaking the entire indexing process
        }
      }
      
      // Store the final counts
      finalInsertedCount = insertedCount;
      finalSkippedCount = skippedCount;
      
      console.log(`Indexing complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);
    });
    
    // Execute transaction
    transaction();
    
    // Now we can safely use the final counts
    console.log(`[DB] Starting to index ${posts.length} posts...`);
    console.log(`[DB] Successfully inserted ${finalInsertedCount} posts`);
    console.log(`[DB] Skipped ${finalSkippedCount} posts`);
    
    return true;
  } catch (error) {
    console.error("Transaction failed:", error);
    return false;
  }
}
