// --- src/ocr_app/markdownEditor/MarkdownEditorTab.tsx ---
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  SelectChangeEvent,
  Typography,
  Card,
  CardMedia,
  CardActions,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import axios from 'axios';

import { JsonDataContext } from '../Context/JsonDataContext';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import { useMarkdownData } from './hooks/useMarkdownData';
import { InputJSONData, Area, OptionDictItem } from '../types';
import ImageSelector from '../correction/ImageSelector';

type EditorTarget = 'question_text' | 'options_text';

const MarkdownEditorTab: React.FC = () => {
  const {
    selectedJsonData,
    setSelectedJsonData,
    selectedAreaIndex,
    setSelectedAreaIndex,
  } = useContext(JsonDataContext);

  const currentArea: Area | undefined = selectedJsonData?.json_data?.areas?.[selectedAreaIndex || 0];
  const optionKeys = currentArea?.options_element?.options_dict 
    ? Object.keys(currentArea.options_element.options_dict) 
    : [];

  const [editorTarget, setEditorTarget] = useState<EditorTarget>('question_text');
  const [selectedOptionKey, setSelectedOptionKey] = useState<string>('');

  // Snackbar用のステート
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // 画像パスを /media/... に変換するための簡易関数 (環境に合わせて調整)
  const convertToMediaUrl = useCallback((path: string): string => {
    if (!path) return '';
    // 例: Django /media/ 以下に配置している想定
    return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
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

  // useMarkdownData: Markdownテキストとstate管理
  const {
    markdownText,
    setMarkdownText,
    handleChange,
    resetToInitial,
  } = useMarkdownData(getCurrentText());

  // editorTarget or currentArea or selectedOptionKey が変わったらテキストを再取得
  useEffect(() => {
    setMarkdownText(getTextByTarget(editorTarget));
  }, [currentArea, editorTarget, selectedOptionKey]);

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

  // EditorTarget選択変更
  const handleEditorTargetChange = (e: SelectChangeEvent) => {
    const newTarget = e.target.value as EditorTarget;
    setEditorTarget(newTarget);
    setMarkdownText(getTextByTarget(newTarget));
  };

  // オプションキー選択変更
  const handleOptionKeyChange = (e: SelectChangeEvent<string>) => {
    const newKey = e.target.value;
    setSelectedOptionKey(newKey);
    if (editorTarget === 'options_text') {
      const dictItem = currentArea?.options_element?.options_dict?.[newKey];
      setMarkdownText(dictItem?.text || '');
    }
  };

  // 「Available Images」一覧に表示するパスを取得
  const getPreviewImages = (): string[] => {
    if (!currentArea) return [];
    if (editorTarget === 'question_text') {
      return currentArea.question_element?.image_paths || [];
    } else if (editorTarget === 'options_text' && selectedOptionKey) {
      return currentArea.options_element?.options_dict?.[selectedOptionKey]?.image_paths || [];
    }
    return [];
  };

  // =========== 画像挿入機能 (従来の handleInsertImage) ===========
  const handleInsertImageToMarkdown = useCallback((imagePath: string) => {
    // CREATE_DATA2/ 以降を取り出して /media/... にする例
    const relative = imagePath.match(/CREATE_DATA2\/(.*)/)?.[1] || imagePath;
    const imageMarkdown = `\n![image](/media/${relative})\n`;
    // Markdown末尾に挿入
    setMarkdownText((prev) => prev + imageMarkdown);
    // 成功メッセージ
    setSnackbarMessage('Image inserted successfully');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  }, [setMarkdownText]);

  // =========== プレビュー（新タブで拡大） ===========
  const handlePreviewImageInNewTab = useCallback((imagePath: string) => {
    window.open(convertToMediaUrl(imagePath), '_blank');
  }, [convertToMediaUrl]);

  // Snackbarを閉じる
  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  // JSON更新 (Saveボタン)  
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

      const newJsonData = updatedJson(selectedJsonData);
      if (!newJsonData) return;
      setSelectedJsonData(newJsonData);

      // サーバーPUT (例: Django REST API)
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
      
      // 成功メッセージ
      setSnackbarMessage('Markdown text saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save:', error);
      // エラーメッセージ
      setSnackbarMessage('Failed to save changes. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // 次のAreaに移動
  const handleNextArea = useCallback(() => {
    if (!selectedJsonData) return;
    
    const totalAreas = selectedJsonData.json_data.areas.length;
    const nextIndex = (selectedAreaIndex || 0) + 1;
    
    if (nextIndex < totalAreas) {
      setSelectedAreaIndex(nextIndex);
      // 移動成功メッセージ
      setSnackbarMessage(`Moved to Area ${nextIndex + 1}`);
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
      // スクロールを一番上に戻す
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 最後のAreaの場合
      setSnackbarMessage('This is the last area');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    }
  }, [selectedJsonData, selectedAreaIndex, setSelectedAreaIndex]);

  if (!selectedJsonData) {
    return <p>No JSON selected.</p>;
  }

  // 次のAreaが存在するかチェック
  const hasNextArea = selectedJsonData.json_data.areas.length > (selectedAreaIndex || 0) + 1;

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* === 左カラム: Area一覧 === */}
      <div style={{ width: '220px', borderRight: '1px solid #ccc' }}>
        <ImageSelector
          areaList={selectedJsonData.json_data.areas}
          selectedAreaIndex={selectedAreaIndex || 0}
          onSelectArea={(index) => {
            setSelectedAreaIndex(index);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* === 右カラム: エディタ部分 === */}
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

        {/* Area画像の表示（小さめ） */}
        {currentArea?.area_image_path && (
          <div style={{ marginBottom: '1rem' }}>
            <Typography variant="h6" gutterBottom>
              Area Image
            </Typography>
            <div style={{ width: '600px', marginBottom: '1rem' }}>
              <Card>
                <CardMedia
                  component="img"
                  style={{ width: '600px', height: 'auto', objectFit: 'contain' }}
                  image={convertToMediaUrl(currentArea.area_image_path)}
                  alt="Area Image"
                />
              </Card>
            </div>
          </div>
        )}

        {/* 画像プレビュー (小さめサムネイル) + Insert/Preview ボタン */}
        {getPreviewImages().length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <Typography variant="h6" gutterBottom>
              Available Images
            </Typography>
            <Grid container spacing={2}>
              {getPreviewImages().map((imagePath, index) => (
                <Grid item xs={12} sm={6} md={3} lg={2} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      style={{ width: '100%', height: '120px', objectFit: 'contain' }}
                      image={convertToMediaUrl(imagePath)}
                      alt={`Preview ${index + 1}`}
                    />
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary" 
                        onClick={() => handlePreviewImageInNewTab(imagePath)}
                      >
                        Preview
                      </Button>
                      <Button 
                        size="small" 
                        color="secondary"
                        onClick={() => handleInsertImageToMarkdown(imagePath)}
                      >
                        Insert
                      </Button>
                    </CardActions>
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
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSave}
            >
              Save
            </Button>
            <Button 
              variant="outlined" 
              onClick={resetToInitial}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleNextArea}
              disabled={!hasNextArea}
            >
              Next Area
            </Button>
          </div>
        </div>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ 
            marginTop: '6rem',
            '& .MuiSnackbar-root': {
              top: '64px !important',
            }
          }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            sx={{ 
              width: '100%',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
              fontSize: '0.95rem',
              '& .MuiAlert-message': {
                padding: '8px 0',
              }
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
};

export default MarkdownEditorTab;