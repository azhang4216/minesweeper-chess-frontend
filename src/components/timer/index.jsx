import { useEffect, useRef, useState } from 'react';
import { sounds } from '../../assets';
import { playSound } from '../../utils';

const Timer = ({ isActive, serverSeconds, lastSyncAt }) => {
    const correctedSeconds = Math.max(
        0,
        serverSeconds - Math.floor((Date.now() - lastSyncAt) / 1000)
    );
    const [secondsLeft, setSecondsLeft] = useState(correctedSeconds);
    const timerRef = useRef(null);
    const tenSecondAlertPlayed = useRef(false);

    useEffect(() => {
        const corrected = Math.max(
            0,
            serverSeconds - Math.floor((Date.now() - lastSyncAt) / 1000)
        );
        setSecondsLeft(corrected);
        tenSecondAlertPlayed.current = false;
        clearInterval(timerRef.current);

        if (isActive && corrected > 0) {
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
    }, [serverSeconds, lastSyncAt, isActive]);

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
