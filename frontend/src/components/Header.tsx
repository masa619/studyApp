import { FaPause, FaPlay } from 'react-icons/fa'; // アイコンのインポート
import { Button } from './ui/button';
import styles from '../styles/Quiz.module.css'; // スタイルをインポート

interface HeaderProps {
  questionTime: number; // 問題ごとの経過時間
  isPaused: boolean; // 一時停止状態
  onPauseToggle: () => void; // 一時停止・再開のトグル
  onExistsToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
  return (
    <header className={styles.header}>
      <div className={styles['header-content']}>
        {/* 経過時間の表示 */}
        <div>
          <p>経過時間: {questionTime}秒</p>
        </div>

        {/* 一時停止・再開ボタン */}
        <div className="flex justify-end gap-4">
        <button
          onClick={onPauseToggle}
          className={`${styles.button} ${isPaused ? styles['button-primary'] : styles['button-secondary']} fixed-width-button`}
        >
          {isPaused ? '再開' : '一時停止'}
        </button>
        
        <Button onClick={onExistsToggle} variant="secondary">
          終了
        </Button>
        </div>

        
      </div>
    </header>
  );
};

export default Header;