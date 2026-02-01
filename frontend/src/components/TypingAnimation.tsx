import { useState, useEffect } from 'react';
import './TypingAnimation.css';

interface TypingAnimationProps {
  text: string;
  speed?: number;
}

const TypingAnimation = ({ text, speed = 50 }: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <div className="typing-container">
      <span className="typed-text">{displayedText}</span>
      <span className="cursor">|</span>
    </div>
  );
};

export default TypingAnimation;
