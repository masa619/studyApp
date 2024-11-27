import React from 'react';

interface ExplanationItem {
  key_terminology: string;
  option_analysis: string;
  overall_assessment: string;
  situation_analysis: string;
  additional_knowledge: string;
  answer_and_key_points: string;
}

interface ExplanationProps {
  explanation: ExplanationItem[];
}

const Explanation: React.FC<ExplanationProps> = ({ explanation }) => {
  return (
    <div className="shadow-lg p-6 bg-white rounded">
      <h3 className="text-lg font-bold">解説</h3>
      {explanation.length > 0 ? (
        explanation.map((item, index) => (
          <div key={index} className="mb-4">
            <h4 className="font-semibold">Situation Analysis:</h4>
            <p>{item.situation_analysis}</p>
            <h4 className="font-semibold">Answer and Key Points:</h4>
            <p>{item.answer_and_key_points}</p>
            <h4 className="font-semibold">Option Analysis:</h4>
            <p>{item.option_analysis}</p>
            <h4 className="font-semibold">Overall Assessment:</h4>
            <p>{item.overall_assessment}</p>
            <h4 className="font-semibold">Additional Knowledge:</h4>
            <p>{item.additional_knowledge}</p>
            <h4 className="font-semibold">Key Terminology:</h4>
            <p>{item.key_terminology}</p>
          </div>
        ))
      ) : (
        <p className="text-base">解説はありません。</p>
      )}
    </div>
  );
};

export default Explanation;