// --- src/ocr_app/markdownEditor/MarkdownEditorTab.tsx ---
import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  SelectChangeEvent,
  IconButton,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardActionArea,
} from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PreviewIcon from '@mui/icons-material/Preview';
import axios from 'axios';

import { JsonDataContext } from '../Context/JsonDataContext';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import { useMarkdownData } from './hooks/useMarkdownData';
import { InputJSONData, Area, OptionDictItem } from '../types';
import ImageSelector from '../correction/ImageSelector';

/**
 * 編集対象を細分化するためのenum的な型
 * question_text   : question_element.text
 * options_text    : options_element.options_dict[key].text
 */
type EditorTarget = 'question_text' | 'options_text';

/**
 * Markdownエディタ用タブ
 */
const MarkdownEditorTab: React.FC = () => {
  const {
    selectedJsonData,
    setSelectedJsonData,
    selectedAreaIndex,
    setSelectedAreaIndex,
  } = useContext(JsonDataContext);

  // 選択中のArea
  const currentArea: Area | undefined = selectedJsonData?.json_data?.areas?.[selectedAreaIndex || 0];
  // 選択できるオプションキー一覧
  const optionKeys = currentArea?.options_element?.options_dict 
    ? Object.keys(currentArea.options_element.options_dict) 
    : [];

  // 編集対象
  const [editorTarget, setEditorTarget] = useState<EditorTarget>('question_text');
  // 個別にオプションキーを選択する場合
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>('');

  // 画像プレビュー用のURL変換
  const convertToMediaUrl = (path: string): string => {
    if (!path) return '';
    return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
  };

  const convertToRelativePath = useCallback((fullPath: string): string => {
    // CREATE_DATA2 以降のパスを抽出
    const match = fullPath.match(/CREATE_DATA2\/(.*)/);
    if (match) {
      return match[1];
    }
    return fullPath;
  }, []);

  // 初期設定：オプションキー一覧があれば最初のものをデフォルトに
  useEffect(() => {
    if (optionKeys.length > 0) {
      setSelectedOptionKey(optionKeys[0]);
    }
  }, [currentArea]);

  // 現在のテキストを取り出す関数
  const getCurrentText = (): string => {
    if (!currentArea) return '';

    switch (editorTarget) {
      case 'question_text':
        return currentArea.question_element?.text || '';
      case 'options_text': {
        const dictItem = currentArea.options_element?.options_dict?.[selectedOptionKey];
        return dictItem?.text || '';
      }
      default:
        return '';
    }
  };

  // カスタムフック: MarkdownテキストとローカルStateを同期
  const {
    markdownText,
    setMarkdownText,
    handleChange,
    resetToInitial,
  } = useMarkdownData(getCurrentText());

  // Area切り替え時にテキストを更新
  useEffect(() => {
    // 現在のeditorTargetに応じたテキストで更新
    setMarkdownText(getTextByTarget(editorTarget));
  }, [currentArea, editorTarget, selectedOptionKey]);

  // EditorTarget切り替え時にテキストも更新
  const handleEditorTargetChange = (e: SelectChangeEvent) => {
    const newTarget = e.target.value as EditorTarget;
    setEditorTarget(newTarget);
    // 選択されたEditorTargetに応じてテキストを更新
    setMarkdownText(getTextByTarget(newTarget));
  };

  const getTextByTarget = (target: EditorTarget): string => {
    if (!currentArea) return '';
    switch (target) {
      case 'question_text':
        return currentArea.question_element?.text || '';
      case 'options_text':
        return currentArea.options_element?.options_dict?.[selectedOptionKey]?.text || '';
      default:
        return '';
    }
  };

  // オプションキーの切り替え
  const handleOptionKeyChange = (e: SelectChangeEvent<string>) => {
    const newKey = e.target.value;
    setSelectedOptionKey(newKey);
    // options_textの場合はテキストを再取得
    if (editorTarget === 'options_text') {
      const dictItem = currentArea?.options_element?.options_dict?.[newKey];
      setMarkdownText(dictItem?.text || '');
    }
  };

  // 画像をMarkdownに挿入
  const handleInsertImage = (imagePath: string) => {
    // CREATE_DATA2 以降のパスを抽出し、メディアルートを付与
    const relativePath = imagePath.match(/CREATE_DATA2\/(.*)/) 
      ? imagePath.match(/CREATE_DATA2\/(.*)/)?.[1] 
      : imagePath;
    
    const imageMarkdown = `\n![image](/media/${relativePath})\n`;
    setMarkdownText((prev) => prev + imageMarkdown);
  };

  // プレビュー画像の取得
  const getPreviewImages = (): string[] => {
    if (!currentArea) return [];

    if (editorTarget === 'question_text') {
      return currentArea.question_element?.image_paths || [];
    } else if (editorTarget === 'options_text' && selectedOptionKey) {
      return currentArea.options_element?.options_dict?.[selectedOptionKey]?.image_paths || [];
    }
    return [];
  };

  // JSONの更新ロジック
  const handleSave = async () => {
    if (!selectedJsonData || !setSelectedJsonData || !currentArea) return;

    try {
      const updatedJson = (prev: InputJSONData | null) => {
        if (!prev) return prev;

        const newAreas = [...(prev.json_data.areas || [])];
        const targetIndex = selectedAreaIndex || 0;
        const areaCopy = { ...newAreas[targetIndex] };

        switch (editorTarget) {
          case 'question_text':
            areaCopy.question_element = {
              ...areaCopy.question_element,
              text: markdownText,
            };
            break;

          case 'options_text': {
            const dictItem: OptionDictItem = areaCopy.options_element.options_dict[selectedOptionKey];
            areaCopy.options_element.options_dict[selectedOptionKey] = {
              ...dictItem,
              text: markdownText,
            };
            break;
          }
        }

        newAreas[targetIndex] = areaCopy;
        return {
          ...prev,
          json_data: {
            ...prev.json_data,
            areas: newAreas,
          },
        };
      };

      // Context更新
      const newJsonData = updatedJson(selectedJsonData);
      if (!newJsonData) return;
      setSelectedJsonData(newJsonData);

      // サーバーへPUT更新
      const payload = {
        json_id: selectedJsonData.id,
        No: currentArea.No,
        description: newJsonData.description,
        json_data: {
          areas: newJsonData.json_data.areas,
        },
      };

      await axios.put(
        `http://localhost:8000/ocr_app/api/input_json/${selectedJsonData.id}/`,
        payload
      );

      alert('Markdown text saved successfully!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // 以下は表示UI
  if (!selectedJsonData) {
    return <p>No JSON selected.</p>;
  }

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* === 左カラム: Area一覧 === */}
      <div style={{ width: '220px', borderRight: '1px solid #ccc' }}>
        <ImageSelector
          areaList={selectedJsonData.json_data.areas}
          selectedAreaIndex={selectedAreaIndex || 0}
          onSelectArea={setSelectedAreaIndex}
        />
      </div>

      {/* === 右カラム: エディタ === */}
      <div style={{ flex: 1, marginTop: '1rem' }}>
        <h2>Markdown Editor</h2>
        
        {/* 編集対象の選択 */}
        <FormControl fullWidth style={{ marginBottom: '1rem' }}>
          <InputLabel>Editor Target</InputLabel>
          <Select
            value={editorTarget}
            label="Editor Target"
            onChange={handleEditorTargetChange}
          >
            <MenuItem value="question_text">Question Text</MenuItem>
            <MenuItem value="options_text">Options Text</MenuItem>
          </Select>
        </FormControl>

        {/* オプションキーの選択（options_text の時のみ表示） */}
        {editorTarget === 'options_text' && (
          <FormControl fullWidth style={{ marginBottom: '1rem' }}>
            <InputLabel>Option Key</InputLabel>
            <Select
              value={selectedOptionKey}
              label="Option Key"
              onChange={handleOptionKeyChange}
            >
              {optionKeys.map((key) => (
                <MenuItem key={key} value={key}>{key}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* 画像プレビュー */}
        {getPreviewImages().length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <Typography variant="h6" gutterBottom>
              Available Images
            </Typography>
            <Grid container spacing={2}>
              {getPreviewImages().map((imagePath, index) => (
                <Grid item xs={4} key={index}>
                  <Card>
                    <CardActionArea onClick={() => handleInsertImage(imagePath)}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={convertToMediaUrl(imagePath)}
                        alt={`Preview ${index + 1}`}
                      />
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </div>
        )}

        {/* テキスト編集用のMarkdownエディタ */}
        <MarkdownEditor value={markdownText} onChange={handleChange} />

        {/* プレビュー */}
        <h3>Preview</h3>
        <div style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '1.5rem',
          minHeight: '200px',
          backgroundColor: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          maxHeight: '500px'
        }}>
          <MarkdownPreview content={markdownText} />
        </div>

        {/* ボタン類 */}
        <div style={{ marginTop: '1rem' }}>
          <Button variant="contained" color="primary" onClick={handleSave} style={{ marginRight: '0.5rem' }}>
            Save
          </Button>
          <Button variant="outlined" onClick={resetToInitial}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditorTab;