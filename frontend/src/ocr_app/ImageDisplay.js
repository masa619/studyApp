import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const ImageDisplay = () => {
    // Djangoが配信する画像のURL
    const imageUrl = 'http://127.0.0.1:8000/media/20090607_co_second_q01/no_1_Area.png';
    return (_jsxs("div", { style: { textAlign: 'center', marginTop: '20px' }, children: [_jsx("h2", { children: "Sample Image Display" }), _jsx("img", { src: imageUrl, alt: "Area", style: { maxWidth: '80%', height: 'auto', border: '2px solid #000' } })] }));
};
export default ImageDisplay;
