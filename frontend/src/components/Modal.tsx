import React from "react";
import styles from "../styles/Quiz.module.css"; // Quiz.module.cssをインポート

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, children }) => {
    if (!isOpen) return null;

    return (
        <div className={styles["modal-overlay"]}>
            <div className={styles.modal}>
                {children}
                <div className={styles["modal-buttons"]}>
                    <button onClick={onClose} className={styles["fixed-width-button"]}>
                        キャンセル
                    </button>
                    <button onClick={onConfirm} className={styles["fixed-width-button"]}>
                        確認
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;