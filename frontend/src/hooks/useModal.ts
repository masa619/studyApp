import React, { useState, useEffect } from 'react';

const useModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
  
    const handleEndQuiz = () => {
        setIsModalOpen(true);
      };

    return {
      isModalOpen,
      openModal,
      closeModal,
      handleEndQuiz
    };
  };

  export default useModal;