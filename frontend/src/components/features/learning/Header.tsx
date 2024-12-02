import { Button } from '@/components/ui/button';

interface HeaderProps {
  questionTime: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onExistsToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
  return (
    <header className="sticky top-0 w-full bg-gray-800 text-white z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <div>
          <p>経過時間: {questionTime}秒</p>
        </div>
        <div className="flex justify-end gap-4">
          <Button 
            onClick={onPauseToggle}
            variant={isPaused ? "default" : "secondary"}
          >
            {isPaused ? '再開' : '一時停止'}
          </Button>
          <Button onClick={onExistsToggle} variant="destructive">
            終了
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;