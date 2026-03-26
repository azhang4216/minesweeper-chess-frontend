const playSound = (sound) => new Audio(sound).play().catch(() => {});

export default playSound;