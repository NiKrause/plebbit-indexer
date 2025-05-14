export async function indexPosts(db, posts) {
  console.log(`Indexing ${posts.length} posts...`);
  
  try {
    const transaction = db.transaction(() => {
      //const deleteStmt = db.prepare('DELETE FROM posts');
      const insertStmt = db.prepare(`
        INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, authorAddress, authorDisplayName)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const getPostStmt = db.prepare('SELECT * FROM posts WHERE id = ?');
      
      // deleteStmt.run();
      // console.log("Deleted all existing posts");
      
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
          
          insertStmt.run(
            post.cid,
            post.timestamp ?? 0,
            post.title ?? '',
            post.content ?? '',
            post.subplebbitAddress ?? '',
            post.author?.address ?? '',
            post.author?.displayName ?? ''
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
