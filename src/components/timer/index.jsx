import React, { useEffect, useRef, useState } from 'react';
import { sounds } from '../../assets';
import { playSound } from '../../utils';

const Timer = ({ isActive, initialSeconds }) => {
    const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
    const timerRef = useRef(null);
    const tenSecondAlertPlayed = useRef(false);

    useEffect(() => {
        if (isActive && secondsLeft > 0) {
            timerRef.current = setInterval(() => {
                setSecondsLeft((prev) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    // Reset sound alert trigger if timer resets or is reactivated
    useEffect(() => {
        if (secondsLeft > 10) {
            tenSecondAlertPlayed.current = false;
        }
    }, [secondsLeft]);

    useEffect(() => {
        if (!isActive) clearInterval(timerRef.current);
    }, [isActive]);

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
