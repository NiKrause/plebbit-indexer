export function indexPosts(db, posts, callback) {
  let processed = 0;
  
  function processNextPost() {
    if (processed >= posts.length) {
      callback(null);
      return;
    }

    const post = posts[processed];
    processed++;

    db.get('SELECT 1 FROM posts WHERE id = ?', [post.cid], (err, existing) => {
      if (err) {
        console.error(`Error checking post ${post?.cid || 'unknown'}:`, err);
        processNextPost();
        return;
      }

      if (!existing) {
        console.log("indexing " + post.cid);
        db.run(
          `INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, authorAddress, authorDisplayName)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            post.cid,
            post.timestamp,
            post.title,
            post.content,
            post.subplebbitAddress,
            post.author?.address || null,
            post.author?.displayName || null
          ],
          (err) => {
            if (err) {
              console.error(`Error processing post ${post?.cid || 'unknown'}:`, err);
            }
            processNextPost();
          }
        );
      } else {
        console.log("skipping " + post.cid);
        processNextPost();
      }
    });
  }

  processNextPost();
}
