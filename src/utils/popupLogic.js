import { images } from '../assets';

export const getGameOverAsset = (result) => {
    if (result === "You win") return images.happyCat;
    if (result === "You lose") return images.sadHamster;
    return images.officeHandshakeMeme;
};

export const getEloChangeColor = (change) => {
    if (change > 0) return "green";
    if (change < 0) return "red";
    return "gray";
};

