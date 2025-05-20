export async function indexPosts(db, posts) {
  console.log(`Indexing ${posts.length} posts...`);
  try {
    //delete all posts from the database
    // const deleteStmt = db.prepare('DELETE FROM posts');
    // deleteStmt.run();

    const transaction = db.transaction(() => {
      const insertStmt = db.prepare(`
        INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, authorAddress, authorDisplayName, upvoteCount, downvoteCount, replyCount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      
      let insertedCount = 0;
      let skippedCount = 0;
      
      for (const post of posts) {
        console.log("insertingpost", post);
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
            title: post.title,
            subplebbitAddress: post.subplebbitAddress,
          };
          
          // Check if any required field is missing
          const missingFields = Object.entries(requiredFields)
            .filter(([_, value]) => value === undefined || value === null)
            .map(([key]) => key);
          
          if (missingFields.length > 0) {
            console.error(`Skipping post ${post.cid}: Missing required fields: ${missingFields.join(', ')}`);
            skippedCount++;
            continue;
          }
          
          const deleteStmt = db.prepare('DELETE FROM posts where id = ?');
          deleteStmt.run(post.cid);
          console.log("deleted post", post.cid);
          insertStmt.run(
            post.cid,
            post.timestamp ?? 0,
            post.title ?? '',
            post.content ?? '',
            post.subplebbitAddress ?? '',
            post.author?.address ?? '',
            post.author?.displayName ?? '',
            post.upvoteCount ?? 0,
            post.downvoteCount ?? 0,
            post.replyCount ?? 0
          );
          
          insertedCount++;
          
          if (insertedCount % 100 === 0 || insertedCount === 1) {
            console.log(`Indexed ${insertedCount} posts so far...`);
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
