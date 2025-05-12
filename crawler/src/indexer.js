export async function indexPosts(db, posts) {
  for (const post of posts) {
    try {
      // console.log("post", post);
      const existing = await db.get('SELECT 1 FROM posts WHERE id = ?', post.cid);
      if (!existing) {
        console.log("indexing " + post.cid);
        await db.run(
          `INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, authorAddress, authorDisplayName)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          post.cid,
          post.timestamp,
          post.title,
          post.content,
          post.subplebbitAddress,
          post.author?.address || null,
          post.author?.displayName || null
        );
      } else {
          console.log("skipping " + post.cid);
      }
    } catch (error) {
      console.error(`Error processing post ${post?.cid || 'unknown'}:`, error);
      // Continue with the next post instead of breaking the entire indexing process
    }
  }
}
