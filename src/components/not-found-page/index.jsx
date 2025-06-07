import "./style.css";
import { images } from "../../assets";

const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <img src={images.catSadgeLoadingGif} alt="Cat" className="cat-img-bottom" />
            <div className="not-found-flex-wrapper">
                <div className="not-found-content">
                    <img src={images.notFound404} alt="404 Not Found" className="not-found-img" />
                    <p className="not-found-text">this page doesn't exist, dum dum.</p>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
