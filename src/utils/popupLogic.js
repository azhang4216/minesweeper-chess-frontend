import { images } from '../assets';

export const getGameOverAsset = (result) => {
    console.log(`Setting game over media based on result of: ${result}`);
    if (result === "You win") return images.happyCatGif;
    if (result === "You lose") return images.sadHamsterGif;
    return images.officeHandshakeMeme;
};

export const getEloChangeColor = (change) => {
    if (change > 0) return "green";
    if (change < 0) return "red";
    return "gray";
};

