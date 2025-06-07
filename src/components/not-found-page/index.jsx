import "./style.css";
import { images } from "../../assets";

const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <img src={images.catSadgeLoadingGif} alt="Cat" className="cat-img-bottom" />
            <img src={images.notFound404} alt="404 Not Found" className="not-found-img" />
        </div>
    );
};

export default NotFoundPage;
