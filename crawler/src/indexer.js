export async function indexPosts(db, posts) {
  console.log(`Indexing ${posts.length} posts/comments...`);
  try {
    //delete all posts from the database
    // const deleteStmt = db.prepare('DELETE FROM posts');
    // deleteStmt.run();

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, 
                           authorAddress, authorDisplayName, upvoteCount, downvoteCount, 
                           replyCount, parentCid, postCid, depth)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          
          const deleteStmt = db.prepare('DELETE FROM posts where id = ?');
          deleteStmt.run(post.cid);
          // console.log("deleted post", post.cid);
          
          insertStmt.run(
            post.cid,
            post.timestamp,
            post.title || null, // Title may be null for comments
            post.content,
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
      
      console.log(`Indexing complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);
    });
    
    // Transaktion ausführen
    transaction();
    
    return true;
  } catch (error) {
    console.error("Transaction failed:", error);
    return false;
  }
}
