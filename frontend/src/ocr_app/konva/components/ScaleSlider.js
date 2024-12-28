import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Slider } from '@mui/material';
const ScaleSlider = ({ scale, setScale }) => {
    const handleSliderChange = (event, newVal) => {
        if (typeof newVal === 'number') {
            setScale(newVal);
        }
    };
    return (_jsxs("div", { style: { width: 300, marginBottom: '1rem' }, children: [_jsxs("p", { children: ["Scale: ", scale.toFixed(2)] }), _jsx(Slider, { min: 0.5, max: 2.0, step: 0.1, value: scale, onChange: handleSliderChange, valueLabelDisplay: "auto", style: { width: '100%' } })] }));
};
export default ScaleSlider;
