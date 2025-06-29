import { Post, FlaggedPost } from '../types';

interface DownloadRawProps {
  post: Post | FlaggedPost;
}

export default function DownloadRaw({ post }: DownloadRawProps) {
  console.log('post download raw', post);
  const handleDownload = () => {
    if (!post.raw) {
      alert('No raw content available for this post');
      return;
    }

    // Create a blob with the raw content
    const blob = new Blob([post.raw], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `post-${post.id}-raw.txt`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Only show the button if raw content exists
  if (!post.raw) {
    return null;
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        background: 'none',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '4px 8px',
        fontSize: '11px',
        color: '#666',
        cursor: 'pointer',
        marginLeft: '8px',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f5f5f5';
        e.currentTarget.style.borderColor = '#999';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.borderColor = '#ddd';
      }}
      title="Download raw content"
    >
      📄 raw
    </button>
  );
} 