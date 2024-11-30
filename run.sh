# Check if the virtual environment directory exists
if [ -d "env/bin" ]; then
    source env/bin/activate
else
    echo "Virtual environment not found. Please create it or check the path."
    exit 1
fi

# フロントエンドのビルド
cd frontend
npm run build
# ルートディレクトリに戻る
cd ../
# 静的ファイルをクリア
echo "Clearing static files..."
rm -rf /Users/shipro/Projects/studyapp/staticfiles/*
# 静的ファイルの収集（確認なしで実行）
echo "Collecting static files..."
python manage.py collectstatic --noinput
pip install -r requirements.txt

echo "Starting server..."
python manage.py runserver