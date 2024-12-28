import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 左ペインでArea一覧を表示し、選択されたindexを親コンポーネントへ通知する
 */
const ImageSelector = ({ areaList, selectedAreaIndex, onSelectArea }) => {
    return (_jsxs("div", { style: { padding: '0.5rem' }, children: [_jsx("h3", { children: "Area List" }), areaList.map((item, idx) => (_jsxs("div", { style: {
                    cursor: 'pointer',
                    marginBottom: '8px',
                    fontWeight: idx === selectedAreaIndex ? 'bold' : 'normal',
                    textDecoration: idx === selectedAreaIndex ? 'underline' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }, onClick: () => onSelectArea(idx), children: ["Area No: ", item.No] }, idx)))] }));
};
export default ImageSelector;
