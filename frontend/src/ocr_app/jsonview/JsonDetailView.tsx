// src/ocr_app/jsonview/JsonDetailView.tsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JsonDataContext } from '../Context/JsonDataContext';
import AreaItem from './AreaItem';

const JsonDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { selectedJsonId, selectedJsonData, loading, error } = useContext(JsonDataContext);

  useEffect(() => {
    console.log('[JsonDetailView] selectedJsonId:', selectedJsonId);
    console.log('[JsonDetailView] selectedJsonData:', selectedJsonData);
  }, [selectedJsonId, selectedJsonData]);

  if (loading) {
    return <p>Loading detail...</p>;
  }
  if (error) {
    return (
      <div>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }
  if (!selectedJsonData) {
    return (
      <div>
        <p>No JSON selected.</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  // ここで「json_data」として取り出し、その中に「areas」が入っている想定
  const { id, description, json_data } = selectedJsonData;
  const areas = json_data?.areas || [];

  return (
    <div style={{ padding: '1rem' }}>
      <button onClick={() => navigate(-1)}>Back</button>

      <h2>JSON Detail (ID: {id})</h2>
      <p>
        <strong>Description:</strong> {description}
      </p>

      <hr />
      {areas.length > 0 ? (
        <div>
          <h3>Areas</h3>
          {areas.map((area, idx) => (
            <AreaItem key={idx} areaIndex={idx} />
          ))}
        </div>
      ) : (
        <p>No areas found.</p>
      )}
    </div>
  );
};

export default JsonDetailView;