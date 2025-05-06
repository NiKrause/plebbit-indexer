export async function indexPosts(db, posts) {
  for (const post of posts) {
    const existing = await db.get('SELECT 1 FROM posts WHERE id = ?', post.cid);
    if (!existing) {
      console.log("indexing " + post.cid);
      await db.run(
        `INSERT INTO posts (id, title, content, subplebbitAddress, authorAddress, authorDisplayName)
         VALUES (?, ?, ?, ?, ?, ?)`,
        post.cid,
        post.title,
        post.content,
        post.subplebbitAddress,
        post.author?.address || null,
        post.author?.displayName || null
      );
    } else {
        console.log("skipping " + post.cid);
    }
  }
}
