import { useEffect, useRef, useState } from 'react';
import { sounds } from '../../assets';
import { playSound } from '../../utils';

const Timer = ({ isActive, serverSeconds, lastSyncAt }) => {
    // Ref always holds latest server values without re-triggering the tick interval
    const syncRef = useRef({ serverSeconds, lastSyncAt });
    const tenSecondAlertPlayed = useRef(false);

    const getDisplaySeconds = () => {
        const elapsed = (Date.now() - syncRef.current.lastSyncAt) / 1000;
        // Within 500ms of a sync, return the server value directly — prevents tiny React
        // render delays from causing Math.floor to show one second less (e.g. 4:59 vs 5:00).
        if (elapsed < 0.5) return Math.floor(syncRef.current.serverSeconds);
        return Math.max(0, Math.floor(syncRef.current.serverSeconds - elapsed));
    };

    const [secondsLeft, setSecondsLeft] = useState(getDisplaySeconds);

    // Keep ref current and snap the static display when server pushes new values
    useEffect(() => {
        syncRef.current = { serverSeconds, lastSyncAt };
        setSecondsLeft(getDisplaySeconds());
        // Only re-arm the alert when time is genuinely above 10s.
        // Resetting unconditionally would re-fire the sound on every server sync
        // while under 10 seconds (syncs arrive ~every second).
        if (serverSeconds > 10) {
            tenSecondAlertPlayed.current = false;
        }
    }, [serverSeconds, lastSyncAt]);

    // Tick at 250ms while active — always derived from server sync values, never drifts
    useEffect(() => {
        if (!isActive) return;
        const id = setInterval(() => {
            const s = getDisplaySeconds();
            if (s <= 10 && !tenSecondAlertPlayed.current) {
                playSound(sounds.tenSeconds);
                tenSecondAlertPlayed.current = true;
            }
            setSecondsLeft(s);
        }, 250);
        return () => clearInterval(id);
    }, [isActive]);

    const formatTime = (s) => {
        const minutes = Math.floor(s / 60);
        const seconds = s % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const urgencyClass = isActive && secondsLeft <= 5 ? 'critical'
        : isActive && secondsLeft <= 10 ? 'low'
        : isActive && secondsLeft <= 30 ? 'warning'
        : '';

    if (isNaN(secondsLeft)) return null;

    return (
        <div className={`timer ${isActive ? 'active' : 'inactive'} ${urgencyClass}`}>
            {formatTime(secondsLeft)}
        </div>
    );
};

export default Timer;
