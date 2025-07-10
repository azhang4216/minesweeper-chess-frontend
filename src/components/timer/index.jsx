import { useEffect, useRef, useState } from 'react';
import { sounds } from '../../assets';
import { playSound } from '../../utils';

const Timer = ({ isActive, initialSeconds }) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const timerRef = useRef(null);
    const tenSecondAlertPlayed = useRef(false);

    // Reset timer and interval on initialSeconds change
    useEffect(() => {
        setSecondsLeft(initialSeconds);
        tenSecondAlertPlayed.current = false;
        clearInterval(timerRef.current);

        if (isActive && initialSeconds > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft(prev => {
                    const next = prev - 1;
                    if (next === 10 && !tenSecondAlertPlayed.current) {
                        playSound(sounds.tenSeconds);
                        tenSecondAlertPlayed.current = true;
                    }
                    return next >= 0 ? next : 0;
                });
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [initialSeconds, isActive]);

    const formatTime = (s) => {
        const minutes = Math.floor(s / 60);
        const seconds = s % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`timer ${isActive ? 'active' : 'inactive'}`}>
            {formatTime(secondsLeft)}
        </div>
    );
};

export default Timer;
