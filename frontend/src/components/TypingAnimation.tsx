import { useState, useEffect } from 'react';
import './TypingAnimation.css';

interface TypingAnimationProps {
  texts: string[];
  speed?: number;
}

const TypingAnimation = ({ texts, speed = 40 }: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLooped, setHasLooped] = useState(false);

  useEffect(() => {
    if (hasLooped) return;

    const currentText = texts[textIndex];
    
    if (!isDeleting && currentIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.substring(0, currentIndex + 1));
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && currentIndex === currentText.length) {
      if (textIndex === texts.length - 1) {
        setHasLooped(true);
        return;
      }
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex > 0) {
      const timeout = setTimeout(() => {
        setDisplayedText(currentText.substring(0, currentIndex - 1));
        setCurrentIndex(prev => prev - 1);
      }, speed / 2);
      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex === 0) {
      setIsDeleting(false);
      setTextIndex((prev) => (prev + 1) % texts.length);
    }
  }, [currentIndex, textIndex, isDeleting, hasLooped, texts, speed]);

  return (
    <div className="typing-container">
      <span className="typed-text">{displayedText}</span>
      <span className="cursor">|</span>
    </div>
  );
};

export default TypingAnimation;
