import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDownload = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('http://localhost:5000/download', {
                params: { url },
                responseType: 'blob', // Expecting a binary response
            });

            // Creating a blob URL and triggering download
            const urlBlob = window.URL.createObjectURL(new Blob([response.data], { type: 'video/mp4' }));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', 'video.mp4'); // Set the filename
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Optional: Revoke the blob URL after use
            window.URL.revokeObjectURL(urlBlob);
        } catch (error) {
            setError('Error downloading the video. Please check the URL and try again.');
            console.error('Error downloading the video:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <h2>YouTube Video Downloader</h2>
            <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter YouTube URL"
            />
            <button onClick={handleDownload} disabled={loading || !url}>
                {loading ? 'Downloading...' : 'Download'}
            </button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default App;
