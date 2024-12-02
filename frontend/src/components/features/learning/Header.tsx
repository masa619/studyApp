import { Button } from "@mui/material";
import { colors } from '@/styles/colors';

interface HeaderProps {
  questionTime: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onExistsToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
  return (
    <header 
      className="sticky top-0 w-full text-white z-50 shadow-md"
      style={{ backgroundColor: colors.background.middleDark }}
    >
      <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
        <div>
          <p>経過時間: {questionTime}秒</p>
        </div>
        <div className="flex justify-end gap-4">
          <Button 
            onClick={onPauseToggle}
            variant="contained"
            color="secondary"
            sx={{
              bgcolor: colors.secondary.main,
              '&:hover': {
                bgcolor: colors.secondary.dark,
              }
            }}
          >
            {isPaused ? '再開' : '一時停止'}
          </Button>
          <Button 
            onClick={onExistsToggle}
            variant="contained"
            color="error"
            sx={{
              bgcolor: colors.error.main,
              '&:hover': {
                bgcolor: colors.error.dark,
              }
            }}
          >
            終了
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;