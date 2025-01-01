src/
├── features/
│   ├── quiz/
│   │   ├── components/
│   │   │   ├── QuizContainer.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── ...
│   │   ├── hooks/
│   │   │   ├── useQuiz.ts
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── QuizPage.tsx
│   │   │   └── ...
│   │   ├── api/
│   │   │   ├── quizApi.ts
│   │   │   └── ...
│   │   ├── types/
│   │   │   ├── quiz.ts
│   │   │   └── ...
│   │   ├── index.tsx   (Quiz関連のエントリーポイントをまとめるなら)
│   │   └── ...
│   └── ocr/
│       ├── components/
│       │   ├── OcrDashboard.tsx
│       │   ├── ImageDisplay.tsx
│       │   ├── correction/
│       │   │   ├── CorrectionDetail.tsx
│       │   │   ├── ImageSelector.tsx
│       │   │   └── ...
│       │   ├── jsonview/
│       │   │   ├── JsonDetailView.tsx
│       │   │   └── ...
│       │   ├── konva/
│       │   │   ├── AreaSelectionCanvas.tsx
│       │   │   └── ...
│       │   ├── markdownEditor/
│       │   │   ├── MarkdownEditorTab.tsx
│       │   │   └── ...
│       │   ├── JsonManager/
│       │   │   ├── JsonList.tsx
│       │   │   ├── JsonManager.tsx
│       │   │   └── ...
│       │   └── ...
│       ├── hooks/
│       │   ├── useMarkdownData.ts
│       │   ├── useDragSelection.ts
│       │   └── ...
│       ├── pages/
│       │   └── OcrMainPage.tsx
│       ├── api/
│       │   └── ocrApi.ts
│       ├── types/
│       │   ├── ocr.ts
│       │   └── ...
│       ├── context/
│       │   └── JsonDataContext.tsx
│       └── ...
├── shared/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── etc...
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useModal.ts
│   │   └── ...
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   └── ...
│   ├── utils/
│   │   ├── convertToMediaUrl.ts
│   │   ├── transformImagePath.ts
│   │   ├── ...
│   ├── types/
│   │   ├── session.ts
│   │   ├── ...
│   └── ...
├── pages/
│   ├── Menu.tsx
│   ├── Login.tsx
│   ├── NotFound.tsx
│   └── ...
├── layouts/   (もし画面全体のレイアウト管理があれば)
│   ├── MainLayout.tsx
│   └── ...
├── App.tsx
├── main.tsx
├── routes.tsx (React Routerのルーティング定義をまとめる例)
├── assets/
│   ├── images/
│   │   └── ...
│   └── ...
├── styles/
│   ├── App.css
│   ├── index.css
│   └── ...
└── vite-env.d.ts