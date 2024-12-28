import React from 'react';

const ImageDisplay = () => {
    // Djangoが配信する画像のURL
    const imageUrl = 'http://127.0.0.1:8000/media/20090607_co_second_q01/no_1_Area.png';

    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Sample Image Display</h2>
            <img 
                src={imageUrl} 
                alt="Area" 
                style={{ maxWidth: '80%', height: 'auto', border: '2px solid #000' }} 
            />
        </div>
    );
};

export default ImageDisplay;