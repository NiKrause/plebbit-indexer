import { getDb } from '../src/db.js';
import { analyzeContent, moderatePosts, initializeFlaggedPostsTable } from '../src/contentModeration.js';
import dotenv from 'dotenv';

dotenv.config();

// This is a manual test script that can be run to test the content moderation system
// Run with: node test/content-moderation.test.js

async function testContentModeration() {
  console.log('Testing content moderation system...');
  
  // Test cases with different types of content
  const testCases = [
    {
      name: 'Safe content',
      content: 'This is a normal post about technology and science. Nothing problematic here.'
    },
    {
      name: 'Hate speech',
      content: 'All people from that country are terrible and should be banned. They are ruining everything.'
    },
    {
      name: 'Violence',
      content: 'I will find you and hurt you. You deserve to suffer for what you did.'
    },
    {
      name: 'Copyright',
      content: `Full transcript of the latest movie:
      
      SCENE 1: INT. LIVING ROOM - DAY
      
      JOHN: I can't believe you've done this.
      
      MARY: It was the only way to save our family.
      
      [Continues for 30 more pages with the entire script]`
    }
  ];
  
  // Initialize database
  const db = getDb();
  
  // Test direct content analysis
  console.log('\n--- Testing direct content analysis ---');
  for (const testCase of testCases) {
    console.log(`\nAnalyzing: ${testCase.name}`);
    try {
      const result = await analyzeContent(testCase.content);
      console.log(`Result: ${result}`);
    } catch (error) {
      console.error(`Error analyzing ${testCase.name}:`, error);
    }
  }
  
  // Insert test posts into the database for moderation testing
  console.log('\n--- Inserting test posts into database ---');
  const transaction = db.transaction(() => {
    // Clear existing test posts
    db.prepare("DELETE FROM posts WHERE authorAddress = 'test-moderation-user'").run();
    
    // Insert test posts
    const insertStmt = db.prepare(`
      INSERT INTO posts (id, timestamp, title, content, subplebbitAddress, 
                        authorAddress, authorDisplayName, upvoteCount, downvoteCount, 
                        replyCount, parentCid, postCid, depth)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const id = `test-moderation-${i}`;
      
      insertStmt.run(
        id,
        Date.now() / 1000,
        `Test ${testCase.name}`,
        testCase.content,
        'test.eth',
        'test-moderation-user',
        'TestUser',
        0,
        0,
        0,
        null,
        id,
        0
      );
      
      console.log(`Inserted test post: ${id} - ${testCase.name}`);
    }
  });
  
  transaction();
  
  // Test the moderation process
  console.log('\n--- Testing moderation process ---');
  try {
    const result = await moderatePosts();
    console.log('Moderation complete:', result);
    
    // Check flagged posts
    const flaggedPosts = db.prepare("SELECT * FROM flagged_posts WHERE authorAddress = 'test-moderation-user'").all();
    console.log(`\nFlagged posts (${flaggedPosts.length}):`);
    
    for (const post of flaggedPosts) {
      console.log(`- ID: ${post.id}, Reason: ${post.flag_reason}, Title: ${post.title}`);
    }
    
    // Check remaining posts
    const remainingPosts = db.prepare("SELECT * FROM posts WHERE authorAddress = 'test-moderation-user'").all();
    console.log(`\nRemaining posts (${remainingPosts.length}):`);
    
    for (const post of remainingPosts) {
      console.log(`- ID: ${post.id}, Title: ${post.title}`);
    }
    
  } catch (error) {
    console.error('Error testing moderation process:', error);
  }
  
  console.log('\nTest complete!');
}

// Run the test
testContentModeration().catch(console.error);